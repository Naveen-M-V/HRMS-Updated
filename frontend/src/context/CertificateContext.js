import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { buildApiUrl } from "../utils/apiConfig";

const CertificateContext = createContext();
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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
      const url = buildApiUrl('/certificates');
      const response = await axios.get(url, {
        params: {
          page,
          limit
        },
        headers: { 
          "Cache-Control": "max-age=300",
          "If-None-Match": localStorage.getItem('certificatesEtag')
        },
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
      const url = buildApiUrl('/certificates');
      console.log('Sending certificate data:', newCertificate);
      const response = await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCertificates((prev) => [response.data, ...prev]);
      setError(null);
      return response.data;
    } catch (err) {
      setError("Failed to add certificate");
      console.error('Add certificate error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
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
      const url = buildApiUrl(`/certificates/${certificateId}/upload`);
      const response = await axios.put(
        url,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
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

  // Update a certificate
  const updateCertificate = useCallback(async (certificateId, updatedData) => {
    if (!certificateId) throw new Error("certificateId is required");
    incrementLoading();
    try {
      const url = buildApiUrl(`/certificates/${certificateId}`);
      console.log('Updating certificate:', url);
      const response = await axios.put(url, updatedData);
      setCertificates((prev) =>
        prev.map((c) => (c._id === certificateId || c.id === certificateId ? response.data : c))
      );
      setError(null);
      console.log('Certificate updated successfully');
      return response.data;
    } catch (err) {
      setError("Failed to update certificate");
      console.error('Update certificate error:', err);
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
      const url = buildApiUrl(`/certificates/${certificateId}`);
      console.log('Deleting certificate:', url);
      await axios.delete(url);
      setCertificates((prev) =>
        prev.filter((c) => c._id !== certificateId && c.id !== certificateId)
      );
      setError(null);
      console.log('Certificate deleted successfully');
    } catch (err) {
      setError("Failed to delete certificate");
      console.error('Delete certificate error:', err);
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
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      futureDate.setHours(23, 59, 59, 999);
      return certificates.filter((cert) => {
        const expiryDate = parseExpiryDate(cert.expiryDate);
        if (!expiryDate) return false;
        expiryDate.setHours(23, 59, 59, 999);
        return expiryDate >= today && expiryDate <= futureDate;
      });
    },
    [certificates]
  );

  const getExpiredCertificates = useCallback(() => {
    if (!Array.isArray(certificates)) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return certificates.filter((cert) => {
      const expiryDate = parseExpiryDate(cert.expiryDate);
      if (!expiryDate) return false;
      expiryDate.setHours(23, 59, 59, 999);
      return expiryDate < today;
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
      updateCertificate,
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
      updateCertificate,
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
