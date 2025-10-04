import React, { useState, useEffect } from 'react';
import { useCertificates } from '../context/CertificateContext';
import { Link } from 'react-router-dom';

const ComplianceInsights = () => {
  const {
    certificates,
    loading,
    getExpiringCertificates,
    getExpiredCertificates
  } = useCertificates();

  const [insights, setInsights] = useState({
    activeCertificates: [],
    expiringCertificates: [],
    expiredCertificates: [],
    pendingCertificates: []
  });
  
  const [selectedSection, setSelectedSection] = useState(null);

  useEffect(() => {
    if (certificates.length > 0) {
      const expiring = getExpiringCertificates(90); // Next 90 days
      const expired = getExpiredCertificates();
      const active = certificates.filter(cert => cert.status === 'Approved' && !expired.includes(cert));
      const pending = certificates.filter(cert => cert.status === 'Pending');
      
      setInsights({
        activeCertificates: active,
        expiringCertificates: expiring,
        expiredCertificates: expired,
        pendingCertificates: pending
      });
    }
  }, [certificates, getExpiringCertificates, getExpiredCertificates]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const renderCertificatesTable = (certs, title) => {
    if (!certs || certs.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          No {title.toLowerCase()} found
        </div>
      );
    }

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Certificate</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Profile</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Category</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Expiry Date</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {certs.map((cert) => (
                <tr key={cert.id || cert._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{cert.certificate}</td>
                  <td className="px-4 py-3">{cert.profileName || 'N/A'}</td>
                  <td className="px-4 py-3">{cert.category || 'N/A'}</td>
                  <td className="px-4 py-3">{cert.expiryDate || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cert.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      cert.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/viewcertificate/${cert.id || cert._id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Compliance Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Active Certificates */}
        <button
          onClick={() => setSelectedSection(selectedSection === 'active' ? null : 'active')}
          className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
            selectedSection === 'active' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <div className="text-3xl font-bold text-green-600">{insights.activeCertificates.length}</div>
          <div className="text-sm text-gray-600 mt-1">Active Certificates</div>
        </button>

        {/* Expiring Soon */}
        <button
          onClick={() => setSelectedSection(selectedSection === 'expiring' ? null : 'expiring')}
          className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
            selectedSection === 'expiring' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'
          }`}
        >
          <div className="text-3xl font-bold text-yellow-600">{insights.expiringCertificates.length}</div>
          <div className="text-sm text-gray-600 mt-1">Expiring Soon</div>
        </button>

        {/* Expired */}
        <button
          onClick={() => setSelectedSection(selectedSection === 'expired' ? null : 'expired')}
          className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
            selectedSection === 'expired' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <div className="text-3xl font-bold text-red-600">{insights.expiredCertificates.length}</div>
          <div className="text-sm text-gray-600 mt-1">Expired</div>
        </button>

        {/* Pending */}
        <button
          onClick={() => setSelectedSection(selectedSection === 'pending' ? null : 'pending')}
          className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
            selectedSection === 'pending' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="text-3xl font-bold text-blue-600">{insights.pendingCertificates.length}</div>
          <div className="text-sm text-gray-600 mt-1">Pending Approval</div>
        </button>
      </div>

      {/* Filtered Tables */}
      {selectedSection === 'active' && renderCertificatesTable(insights.activeCertificates, 'Active Certificates')}
      {selectedSection === 'expiring' && renderCertificatesTable(insights.expiringCertificates, 'Expiring Soon')}
      {selectedSection === 'expired' && renderCertificatesTable(insights.expiredCertificates, 'Expired Certificates')}
      {selectedSection === 'pending' && renderCertificatesTable(insights.pendingCertificates, 'Pending Certificates')}
    </div>
  );
};

export default ComplianceInsights;
