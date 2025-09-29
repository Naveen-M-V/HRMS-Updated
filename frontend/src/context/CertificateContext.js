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

export const useCertificates = () => {
  const ctx = useContext(CertificateContext);
  if (!ctx) throw new Error("useCertificates must be used within CertificateProvider");
  return ctx;
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

const parseExpiryDate = (expiryDateStr) => {
  if (!expiryDateStr) return null;
  const parts = expiryDateStr.split("/");
  if (parts.length !== 3) return new Date(expiryDateStr);
  const [day, month, year] = parts;
  return new Date(year, Number(month) - 1, day);
};

export const CertificateProvider = ({ children }) => {
  const [certificates, setCertificates] = useState([]);
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState(null);

  const loading = loadingCount > 0;
  const incrementLoading = () => setLoadingCount((c) => c + 1);
  const decrementLoading = () => setLoadingCount((c) => Math.max(c - 1, 0));

  // Fetch all certificates
  const fetchCertificates = useCallback(async () => {
    incrementLoading();
    try {
      const res = await axios.get(`${API_BASE_URL}/api/certificates`);
      if (Array.isArray(res.data)) {
        setCertificates(res.data);
        setError(null);
      } else {
        setCertificates([]);
        setError("Invalid data format received from API");
      }
    } catch (err) {
      console.error("fetchCertificates error:", err);
      setError("Failed to fetch certificates");
      setCertificates([]);
    } finally {
      decrementLoading();
    }
  }, []);

  // Add certificate (supports optional file)
  const addCertificate = useCallback(async (newCertificate) => {
    incrementLoading();
    try {
      const formData = new FormData();
      Object.entries(newCertificate || {}).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        if (k === "fileData" && v) {
          formData.append("certificateFile", v);
        } else if (k === "timeLogged" && typeof v === "object") {
          formData.append("timeLogged", JSON.stringify(v));
        } else {
          formData.append(k, v);
        }
      });

      const res = await axios.post(`${API_BASE_URL}/api/certificates`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res && res.data) {
        // add to top of list
        setCertificates((prev) => [res.data, ...prev]);
        setError(null);
        return res.data;
      } else {
        throw new Error("No response data from addCertificate");
      }
    } catch (err) {
      console.error("addCertificate error:", err);
      setError("Failed to add certificate");
      throw err;
    } finally {
      decrementLoading();
    }
  }, []);

  // Upload a certificate file (for existing certificate)
  // Accepts certificateId and file (File object)
  const uploadCertificateFile = useCallback(async (certificateId, file) => {
    if (!certificateId || !file) throw new Error("certificateId and file are required");
    incrementLoading();
    try {
      const formData = new FormData();
      formData.append("certificateFile", file);

      const res = await axios.put(
        `${API_BASE_URL}/api/certificates/${certificateId}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res && res.data) {
        setCertificates((prev) =>
          prev.map((c) =>
            (c._id && c._id.toString() === certificateId.toString()) ||
            (c.id && c.id.toString() === certificateId.toString())
              ? res.data
              : c
          )
        );
        setError(null);
        return res.data;
      } else {
        // fallback: mark certificate as having a file
        setCertificates((prev) =>
          prev.map((c) =>
            (c._id && c._id.toString() === certificateId.toString()) ||
            (c.id && c.id.toString() === certificateId.toString())
              ? { ...c, certificateFile: true }
              : c
          )
        );
        setError(null);
        return null;
      }
    } catch (err) {
      console.error("uploadCertificateFile error:", err);
      setError("Failed to upload certificate file");
      throw err;
    } finally {
      decrementLoading();
    }
  }, []);

  // Update certificate (used to remove/replace file or change other fields)
  // Expects a FormData passed in (so you can append certificateFile: "" to remove)
  const updateCertificateWithFile = useCallback(async (certificateId, formData) => {
    if (!certificateId) throw new Error("certificateId is required");
    incrementLoading();
    try {
      const res = await axios.put(`${API_BASE_URL}/api/certificates/${certificateId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res && res.data) {
        setCertificates((prev) =>
          prev.map((c) =>
            (c._id && c._id.toString() === certificateId.toString()) ||
            (c.id && c.id.toString() === certificateId.toString())
              ? res.data
              : c
          )
        );
        setError(null);
        return res.data;
      } else {
        throw new Error("No data returned from updateCertificateWithFile");
      }
    } catch (err) {
      console.error("updateCertificateWithFile error:", err);
      setError("Failed to update certificate");
      throw err;
    } finally {
      decrementLoading();
    }
  }, []);

  // Delete certificate
  const deleteCertificate = useCallback(async (certificateId) => {
    if (!certificateId) throw new Error("certificateId is required");
    incrementLoading();
    try {
      await axios.delete(`${API_BASE_URL}/api/certificates/${certificateId}`);
      setCertificates((prev) =>
        prev.filter(
          (c) =>
            !(
              (c._id && c._id.toString() === certificateId.toString()) ||
              (c.id && c.id.toString() === certificateId.toString())
            )
        )
      );
      setError(null);
      return true;
    } catch (err) {
      console.error("deleteCertificate error:", err);
      setError("Failed to delete certificate");
      throw err;
    } finally {
      decrementLoading();
    }
  }, []);

  // Utility getters
  const getCertificateById = useCallback(
    (id) => certificates.find((c) => c._id === id || c.id === id || (c._id && c._id.toString() === id) || (c.id && c.id.toString() === id)),
    [certificates]
  );

  const getActiveCertificatesCount = useCallback(() => {
    if (!Array.isArray(certificates)) return 0;
    return certificates.filter((cert) => cert.active === "Yes" || cert.status === "Active").length;
  }, [certificates]);

  const getExpiringCertificates = useCallback(
    (days = 30) => {
      if (!Array.isArray(certificates)) return [];
      const today = new Date();
      const future = new Date();
      future.setDate(today.getDate() + days);
      return certificates.filter((cert) => {
        const expiryDate = parseExpiryDate(cert.expiryDate);
        return expiryDate && expiryDate >= today && expiryDate <= future;
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
    for (const c of certificates) {
      const k = c.category || "Other";
      counts[k] = (counts[k] || 0) + 1;
    }
    return counts;
  }, [certificates]);

  const getCertificatesByJobRole = useCallback(() => {
    const counts = {};
    for (const c of certificates) {
      const k = c.jobRole || "Unspecified";
      counts[k] = (counts[k] || 0) + 1;
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
      updateCertificateWithFile,
      deleteCertificate,
      getCertificateById,
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
      updateCertificateWithFile,
      deleteCertificate,
      getCertificateById,
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
