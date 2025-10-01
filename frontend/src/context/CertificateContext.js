import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";

const CertificateContext = createContext();

// Standardized API base URL (same logic as AuthContext)
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (process.env.REACT_APP_API_BASE_URL?.startsWith('/')) {
    return '';
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:5003';
};

const API_BASE_URL = getApiUrl();

// Configure axios defaults for credentials
axios.defaults.withCredentials = true;

export const useCertificates = () => {
  const context = useContext(CertificateContext);
  if (!context) throw new Error("useCertificates must be used within a CertificateProvider");
  return context;
};

const parseExpiryDate = (expiryDateStr) => {
  if (!expiryDateStr) return null;
  const [day, month, year] = expiryDateStr.split("/");
  return new Date(year, month - 1, day);
};

export const CertificateProvider = ({ children }) => {
  const [certificates, setCertificates] = useState([]);
  const [loadingCount, setLoadingCount] = useState(0);
  const loading = loadingCount > 0;
  const [error, setError] = useState(null);

  const incrementLoading = () => setLoadingCount((count) => count + 1);
  const decrementLoading = () => setLoadingCount((count) => Math.max(count - 1, 0));

  const fetchCertificates = useCallback(async (page = 1, limit = 50) => {
    incrementLoading();
    try {
      const response = await axios.get(`${API_BASE_URL}/api/certificates`, {
        params: {
          page,
          limit
        },
        headers: { 
          "Cache-Control": "max-age=300",
          "If-None-Match": localStorage.getItem('certificatesEtag')
        },
        withCredentials: true
      });
      
      // Update cache if data has changed
      if (response.headers.etag) {
        localStorage.setItem('certificatesEtag', response.headers.etag);
        localStorage.setItem('certificatesCache', JSON.stringify(response.data));
      }

      if (!Array.isArray(response.data)) {
        setCertificates([]);
        setError("Invalid data format received from API");
        return;
      }
      setCertificates(response.data);
      setError(null);
    } catch (error) {
      if (error.response?.status === 304) {
        // Use cached data if available
        const cachedData = localStorage.getItem('certificatesCache');
        if (cachedData) {
          setCertificates(JSON.parse(cachedData));
          setError(null);
          return;
        }
      }
      setError("Failed to fetch certificates");
      setCertificates([]);
    } finally {
      decrementLoading();
    }
  }, []);

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
      const response = await axios.post(`${API_BASE_URL}/api/certificates`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });
      setCertificates((prev) => [response.data, ...prev]);
      setError(null);
      return response.data;
    } catch (err) {
      setError("Failed to add certificate");
      console.error(err);
      throw err;
    } finally {
      decrementLoading();
    }
  }, []);

  // Updated uploadCertificateFile to use PUT and matching URL
  const uploadCertificateFile = useCallback(async (certificateId, file) => {
    if (!certificateId || !file) throw new Error("certificateId and file are required");
    incrementLoading();
    try {
      const formData = new FormData();
      formData.append("certificateFile", file);
      const response = await axios.put(
        `${API_BASE_URL}/api/certificates/${certificateId}/upload`,
        formData,
        { 
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true
        }
      );

      if (response && response.data) {
        setCertificates((prev) =>
          prev.map((c) => (c._id === certificateId || c.id === certificateId ? response.data : c))
        );
      } else {
        setCertificates((prev) =>
          prev.map((c) =>
            c._id === certificateId || c.id === certificateId ? { ...c, certificateFile: true } : c
          )
        );
      }
      setError(null);
      return response?.data;
    } catch (err) {
      setError("Failed to upload certificate file");
      console.error(err);
      throw err;
    } finally {
      decrementLoading();
    }
  }, []);

  // Delete a certificate
  const deleteCertificate = useCallback(async (certificateId) => {
    if (!certificateId) throw new Error("certificateId is required");
    incrementLoading();
    try {
      await axios.delete(`${API_BASE_URL}/api/certificates/${certificateId}`, {
        withCredentials: true
      });
      setCertificates((prev) =>
        prev.filter((c) => c._id !== certificateId && c.id !== certificateId)
      );
      setError(null);
    } catch (err) {
      setError("Failed to delete certificate");
      console.error(err);
      throw err;
    } finally {
      decrementLoading();
    }
  }, []);

  // Other helper functions...

  const getActiveCertificatesCount = useCallback(() => {
    if (!Array.isArray(certificates)) {
      console.error("Expected an array of certificates but got:", certificates);
      return 0;
    }
    return certificates.filter(
      (cert) => cert.active === "Yes" || cert.status === "Active"
    ).length;
  }, [certificates]);

  const getExpiringCertificates = useCallback(
    (days = 30) => {
      if (!Array.isArray(certificates)) return [];
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      return certificates.filter((cert) => {
        const expiryDate = parseExpiryDate(cert.expiryDate);
        return expiryDate && expiryDate >= today && expiryDate <= futureDate;
      });
    },
    [certificates]
  );

  const getExpiredCertificates = useCallback(() => {
    if (!Array.isArray(certificates)) return [];
    const today = new Date();
    return certificates.filter((cert) => {
      const expiryDate = parseExpiryDate(cert.expiryDate);
      return expiryDate && expiryDate < today;
    });
  }, [certificates]);

  const getCertificatesByCategory = useCallback(() => {
    const counts = {};
    for (const cert of certificates) {
      const category = cert.category || "Other";
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }, [certificates]);

  const getCertificatesByJobRole = useCallback(() => {
    const counts = {};
    for (const cert of certificates) {
      const jobRole = cert.jobRole || "Unspecified";
      counts[jobRole] = (counts[jobRole] || 0) + 1;
    }
    return counts;
  }, [certificates]);

  const value = useMemo(
    () => ({
      certificates,
      loading,
      error,
      fetchCertificates,
      addCertificate,
      uploadCertificateFile,
      deleteCertificate,
      getCertificateById: (id) => certificates.find((cert) => cert._id === id || cert.id === id),
      getActiveCertificatesCount,
      getExpiringCertificates,
      getExpiredCertificates,
      getCertificatesByCategory,
      getCertificatesByJobRole,
    }),
    [
      certificates,
      loading,
      error,
      fetchCertificates,
      addCertificate,
      uploadCertificateFile,
      deleteCertificate,
      getActiveCertificatesCount,
      getExpiringCertificates,
      getExpiredCertificates,
      getCertificatesByCategory,
      getCertificatesByJobRole,
    ]
  );

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  return <CertificateContext.Provider value={value}>{children}</CertificateContext.Provider>;
};
