import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const CertificateContext = createContext();

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const useCertificates = () => {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error('useCertificates must be used within a CertificateProvider');
  }
  return context;
};

export const CertificateProvider = ({ children }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch certificates from API
  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/certificates`);
      setCertificates(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch certificates');
      console.error('Error fetching certificates:', err);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  // Load certificates on mount
  useEffect(() => {
    fetchCertificates();
  }, []);

  // Add certificate with file upload support
  const addCertificate = async (newCertificate) => {
    setLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all certificate fields to FormData
      Object.keys(newCertificate).forEach(key => {
        if (key === 'fileData' && newCertificate[key]) {
          // Handle file upload
          formData.append('certificateFile', newCertificate[key]);
        } else if (key === 'timeLogged' && typeof newCertificate[key] === 'object') {
          // Handle timeLogged object
          formData.append('timeLogged', JSON.stringify(newCertificate[key]));
        } else if (newCertificate[key] !== null && newCertificate[key] !== undefined) {
          formData.append(key, newCertificate[key]);
        }
      });
      
      const response = await axios.post(`${API_BASE_URL}/certificates`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setCertificates(prev => [response.data, ...prev]);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to add certificate');
      console.error('Error adding certificate:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update certificate
  const updateCertificate = async (id, updatedCertificate) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/certificates/${id}`, updatedCertificate);
      setCertificates(prev => 
        prev.map(cert => cert._id === id ? response.data : cert)
      );
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to update certificate');
      console.error('Error updating certificate:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update certificate with file upload
  const updateCertificateWithFile = async (id, formData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(`${API_BASE_URL}/certificates/${id}/upload`, formData, {
        headers: {
          // Don't set Content-Type - let browser set it with boundary for multipart/form-data
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      // Update local state
      setCertificates(prev => prev.map(cert => 
        (cert.id || cert._id) === id ? response.data : cert
      ));
      
      return response.data;
    } catch (error) {
      console.error('Error updating certificate with file:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  };

  // Delete certificate
  const deleteCertificate = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/certificates/${id}`);
      setCertificates(prev => prev.filter(cert => cert._id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete certificate');
      console.error('Error deleting certificate:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get certificate by ID
  const getCertificateById = (id) => {
    return certificates.find(cert => cert._id === id || cert.id === id);
  };

  // Get active certificates count
  const getActiveCertificatesCount = () => {
    if (!Array.isArray(certificates)) {
      console.error("Expected an array of certificates, but got:", certificates);
      return 0;
    }

    return certificates.filter(cert => cert.active === 'Yes' || cert.status === 'Active').length;
  };

  // Get expiring certificates within specified days
  const getExpiringCertificates = (days = 30) => {
    if (!Array.isArray(certificates)) {
      console.error("Expected an array of certificates, but got:", certificates);
      return [];
    }

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return certificates.filter(cert => {
      if (!cert.expiryDate) return false;
      
      const [day, month, year] = cert.expiryDate.split('/');
      const expiryDate = new Date(year, month - 1, day);
      
      return expiryDate >= today && expiryDate <= futureDate;
    });
  };

  // Get expired certificates
  const getExpiredCertificates = () => {
    const today = new Date();
    
    return certificates.filter(cert => {
      if (!cert.expiryDate) return false;
      
      const [day, month, year] = cert.expiryDate.split('/');
      const expiryDate = new Date(year, month - 1, day);
      
      return expiryDate < today;
    });
  };

  // Get certificates by category
  const getCertificatesByCategory = () => {
    const categoryCounts = {};
    certificates.forEach(cert => {
      const category = cert.category || 'Other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    return categoryCounts;
  };

  // Get certificates by job role
  const getCertificatesByJobRole = () => {
    const jobRoleCounts = {};
    certificates.forEach(cert => {
      const jobRole = cert.jobRole || 'Unspecified';
      jobRoleCounts[jobRole] = (jobRoleCounts[jobRole] || 0) + 1;
    });
    return jobRoleCounts;
  };

  const value = {
    certificates,
    loading,
    error,
    fetchCertificates,
    addCertificate,
    updateCertificate,
    updateCertificateWithFile,
    deleteCertificate,
    getCertificateById,
    getActiveCertificatesCount,
    getExpiringCertificates,
    getExpiredCertificates,
    getCertificatesByCategory,
    getCertificatesByJobRole
  };

  return (
    <CertificateContext.Provider value={value}>
      {children}
    </CertificateContext.Provider>
  );
};
