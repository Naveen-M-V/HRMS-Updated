import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import axios from "axios";

const CertificateContext = createContext();
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const useCertificates = () => {
  const context = useContext(CertificateContext);
  if (!context) throw new Error("useCertificates must be used within a CertificateProvider");
  return context;
};

export const CertificateProvider = ({ children }) => {
  const [certificates, setCertificates] = useState([]);
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    provider: "",
    search: "",
  });

  const loading = loadingCount > 0;

  const incrementLoading = () => setLoadingCount((count) => count + 1);
  const decrementLoading = () => setLoadingCount((count) => Math.max(count - 1, 0));

  // Enhanced fetchCertificates with pagination and filtering
  const fetchCertificates = useCallback(async (page = 1, limit = 20, append = false) => {
    incrementLoading();
    try {
      const response = await axios.get(`${API_BASE_URL}/certificates`, {
        params: {
          page,
          limit,
          ...filters,
        },
        withCredentials: true,
      });
      
      const { data, total, hasMore } = response.data;
      
      if (!Array.isArray(data)) {
        setCertificates([]);
        setError("Invalid data format received from API");
        return;
      }

      setCertificates(prev => append ? [...prev, ...data] : data);
      setTotalCount(total);
      setHasMore(hasMore);
      setCurrentPage(page);
      setError(null);
    } catch (error) {
      setError("Failed to fetch certificates");
      if (!append) {
        setCertificates([]);
      }
      console.error("Error fetching certificates:", error);
    } finally {
      decrementLoading();
    }
  }, [filters]);

  // Load more certificates for infinite scrolling
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchCertificates(currentPage + 1, 20, true);
  }, [currentPage, hasMore, loading, fetchCertificates]);

  // Update filters and reset pagination
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setCurrentPage(1);
    setHasMore(true);
  }, []);

  // Add new certificate with proper error handling
  const addCertificate = useCallback(async (newCertificate) => {
    incrementLoading();
    try {
      const formData = new FormData();
      Object.entries(newCertificate).forEach(([key, val]) => {
        if (key === "fileData" && val) {
          formData.append("certificateFile", val);
        } else if (key === "timeLogged" && typeof val === "object") {
          formData.append("timeLogged", JSON.stringify(val));
        } else if (val !== null && val !== undefined) {
          formData.append(key, val);
        }
      });
      
      const response = await axios.post(
        `${API_BASE_URL}/certificates`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      setCertificates(prev => [response.data, ...prev]);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to add certificate";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      decrementLoading();
    }
  }, []);

  // Updated uploadCertificateFile to handle retries
  const uploadCertificateFile = useCallback(async (certificateId, file, retries = 3) => {
    if (!certificateId || !file) throw new Error("certificateId and file are required");
    incrementLoading();
    
    const attemptUpload = async (attempt) => {
      try {
        const formData = new FormData();
        formData.append("certificateFile", file);
        
        const response = await axios.put(
          `${API_BASE_URL}/certificates/${certificateId}/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
            timeout: 30000, // 30 second timeout
          }
        );

        setCertificates(prev =>
          prev.map(c => c._id === certificateId ? response.data : c)
        );
        
        setError(null);
        return response.data;
      } catch (err) {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          return attemptUpload(attempt + 1);
        }
        throw err;
      }
    };

    try {
      return await attemptUpload(1);
    } catch (err) {
      setError("Failed to upload certificate file");
      throw err;
    } finally {
      decrementLoading();
    }
  }, []);

  // Delete certificate with optimistic update
  const deleteCertificate = useCallback(async (certificateId) => {
    if (!certificateId) throw new Error("certificateId is required");
    
    // Optimistically remove from UI
    const previousCertificates = certificates;
    setCertificates(prev => prev.filter(c => c._id !== certificateId));

    try {
      await axios.delete(`${API_BASE_URL}/certificates/${certificateId}`, {
        withCredentials: true
      });
      setError(null);
    } catch (err) {
      // Revert on failure
      setCertificates(previousCertificates);
      setError("Failed to delete certificate");
      throw err;
    }
  }, [certificates]);

  // Statistics and helper functions
  const statistics = useMemo(() => {
    const stats = {
      total: certificates.length,
      active: 0,
      expired: 0,
      expiringSoon: 0,
      byCategory: {},
      byProvider: {}
    };

    certificates.forEach(cert => {
      // Count by status
      if (cert.status === 'active') stats.active++;
      if (cert.status === 'expired') stats.expired++;
      
      // Count by category
      if (cert.category) {
        stats.byCategory[cert.category] = (stats.byCategory[cert.category] || 0) + 1;
      }
      
      // Count by provider
      if (cert.provider) {
        stats.byProvider[cert.provider] = (stats.byProvider[cert.provider] || 0) + 1;
      }

      // Check for expiring soon
      const expiryDate = cert.expiryDate ? new Date(cert.expiryDate) : null;
      if (expiryDate) {
        const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
          stats.expiringSoon++;
        }
      }
    });

    return stats;
  }, [certificates]);

  const contextValue = {
    certificates,
    loading,
    error,
    totalCount,
    hasMore,
    currentPage,
    filters,
    statistics,
    fetchCertificates,
    loadMore,
    updateFilters,
    addCertificate,
    uploadCertificateFile,
    deleteCertificate,
  };

  return (
    <CertificateContext.Provider value={contextValue}>
      {children}
    </CertificateContext.Provider>
  );
};

export default CertificateContext;