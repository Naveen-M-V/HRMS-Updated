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
        {/* Expiring Soon Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800 mb-1">Expiring Soon</p>
              <p className="text-3xl font-bold text-yellow-900">{insights.expiringCount}</p>
              <p className="text-xs text-yellow-700 mt-1">Next 90 days</p>
            </div>
            <div className="bg-yellow-200 rounded-full p-3">
              <svg className="w-8 h-8 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Outstanding/Expired Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">Outstanding Renewals</p>
              <p className="text-3xl font-bold text-red-900">{insights.outstandingCount}</p>
              <p className="text-xs text-red-700 mt-1">Expired certificates</p>
            </div>
            <div className="bg-red-200 rounded-full p-3">
              <svg className="w-8 h-8 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceInsights;
