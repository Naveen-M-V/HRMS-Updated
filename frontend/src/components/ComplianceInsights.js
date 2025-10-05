import React, { useState, useEffect } from 'react';
import { useCertificates } from '../context/CertificateContext';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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
    pendingCertificates: [],
    totalCertificates: 0
  });
  
  const [selectedSection, setSelectedSection] = useState(null);

  useEffect(() => {
    if (certificates.length > 0) {
      const expiring = getExpiringCertificates(90);
      const expired = getExpiredCertificates();
      
      // Fix: Filter active certificates properly - exclude expired ones
      const expiredIds = new Set(expired.map(cert => cert.id || cert._id));
      const active = certificates.filter(cert => 
        cert.status === 'Approved' && !expiredIds.has(cert.id || cert._id)
      );
      
      const pending = certificates.filter(cert => cert.status === 'Pending');
      
      setInsights({
        activeCertificates: active,
        expiringCertificates: expiring,
        expiredCertificates: expired,
        pendingCertificates: pending,
        totalCertificates: certificates.length
      });
    } else {
      setInsights({
        activeCertificates: [],
        expiringCertificates: [],
        expiredCertificates: [],
        pendingCertificates: [],
        totalCertificates: 0
      });
    }
  }, [certificates, getExpiringCertificates, getExpiredCertificates]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
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
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {certs.map((cert) => (
                <tr key={cert.id || cert._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <AcademicCapIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <div className="font-medium text-gray-900">{cert.certificate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{cert.profileName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{cert.profileId?.vtid || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{cert.category || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{cert.provider || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{cert.expiryDate || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(cert.status)}`}>
                      {getStatusIcon(cert.status)}
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/viewcertificate/${cert.id || cert._id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors font-medium"
                      title="View Certificate"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View Certificate
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
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {/* Total Certificates */}
        <button
          onClick={() => setSelectedSection(selectedSection === 'total' ? null : 'total')}
          className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
            selectedSection === 'total' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-3xl font-bold text-emerald-600">{insights.totalCertificates}</div>
          <div className="text-sm text-gray-600 mt-1">Total Certificates</div>
        </button>

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
      {selectedSection === 'total' && renderCertificatesTable(certificates, 'All Certificates')}
      {selectedSection === 'active' && renderCertificatesTable(insights.activeCertificates, 'Active Certificates')}
      {selectedSection === 'expiring' && renderCertificatesTable(insights.expiringCertificates, 'Expiring Soon')}
      {selectedSection === 'expired' && renderCertificatesTable(insights.expiredCertificates, 'Expired Certificates')}
      {selectedSection === 'pending' && renderCertificatesTable(insights.pendingCertificates, 'Pending Certificates')}
    </div>
  );
};

export default ComplianceInsights;
