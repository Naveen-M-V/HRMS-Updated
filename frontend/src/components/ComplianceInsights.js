import React, { useState, useEffect } from 'react';
import { useCertificates } from '../context/CertificateContext';

const ComplianceInsights = () => {
  const {
    certificates,
    loading,
    getExpiringCertificates,
    getExpiredCertificates
  } = useCertificates();

  const [insights, setInsights] = useState({
    expiringCount: 0,
    outstandingCount: 0
  });

  useEffect(() => {
    if (certificates.length > 0) {
      const expiring = getExpiringCertificates(90); // Next 90 days
      const expired = getExpiredCertificates();
      
      setInsights({
        expiringCount: expiring.length,
        outstandingCount: expired.length
      });
    }
  }, [certificates, getExpiringCertificates, getExpiredCertificates]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Compliance Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        

        
      </div>
    </div>
  );
};

export default ComplianceInsights;
