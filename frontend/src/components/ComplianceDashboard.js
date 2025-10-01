import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCertificates } from '../context/CertificateContext';
import ComplianceInsights from './ComplianceInsights';
import AdminCompletionBar from './AdminCompletionBar';

const ComplianceDashboard = () => {
  const {
    certificates,
    loading,
    getActiveCertificatesCount,
    getExpiringCertificates,
    getExpiredCertificates,
    getCertificatesByCategory,
    getCertificatesByJobRole
  } = useCertificates();

  const [selectedTimeframe, setSelectedTimeframe] = useState(30);
  const [dashboardData, setDashboardData] = useState({
    activeCount: 0,
    expiringCertificates: [],
    expiredCertificates: [],
    categoryCounts: {},
    jobRoleCounts: {}
  });

 useEffect(() => {
  const getDashboardData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/certificates/dashboard-stats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'max-age=300'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
      }
      
      const data = await response.json();
      setDashboardData({
        activeCount: data.activeCount,
        expiringCertificates: data.expiringCertificates,
        expiredCertificates: data.expiredCertificates,
        categoryCounts: data.categoryCounts,
        jobRoleCounts: getCertificatesByJobRole()
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set empty data on error so UI doesn't hang
      setDashboardData({
        activeCount: 0,
        expiringCertificates: [],
        expiredCertificates: [],
        categoryCounts: {},
        jobRoleCounts: {}
      });
    }
  };

  getDashboardData();
}, [selectedTimeframe]);


  const formatDate = (dateString) => {
    const [day, month, year] = dateString.split('/');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const [day, month, year] = expiryDate.split('/');
    const expiry = new Date(year, month - 1, day);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatusColor = (daysUntilExpiry) => {
    if (daysUntilExpiry < 0) return 'text-red-600 bg-red-50';
    if (daysUntilExpiry <= 7) return 'text-red-600 bg-red-50';
    if (daysUntilExpiry <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Expiry Alert Period:</label>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>

      {/* Compliance Insights Section */}
      <ComplianceInsights />

      {/* Admin Details Completion Bar */}
      <AdminCompletionBar />

      {/* Main Section with Tasks and Action Buttons */}
      <div className="flex gap-10 mb-6">
        {/* Task Card */}
        <div className="w-3/4 bg-white shadow-md rounded p-10 text-center">
          {dashboardData.expiringCertificates.length > 0 || dashboardData.expiredCertificates.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Immediate Tasks</h3>
              
              {dashboardData.expiredCertificates.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-red-800 font-medium">Expired Certificates ({dashboardData.expiredCertificates.length})</h4>
                  </div>
                  <div className="text-sm text-red-700">
                    {dashboardData.expiredCertificates.slice(0, 3).map((cert, index) => (
                      <div key={cert.id} className="mb-1">
                        • {cert.certificate} - {cert.profileName}
                      </div>
                    ))}
                    {dashboardData.expiredCertificates.length > 3 && (
                      <div className="text-red-600 font-medium">
                        +{dashboardData.expiredCertificates.length - 3} more expired certificates
                      </div>
                    )}
                  </div>
                </div>
              )}

              {dashboardData.expiringCertificates.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h4 className="text-yellow-800 font-medium">Expiring Soon ({dashboardData.expiringCertificates.length})</h4>
                  </div>
                  <div className="text-sm text-yellow-700">
                    {dashboardData.expiringCertificates.slice(0, 3).map((cert, index) => {
                      const daysUntilExpiry = getDaysUntilExpiry(cert.expiryDate);
                      return (
                        <div key={cert.id} className="mb-1">
                          • {cert.certificate} - {cert.profileName} ({daysUntilExpiry} days)
                        </div>
                      );
                    })}
                    {dashboardData.expiringCertificates.length > 3 && (
                      <div className="text-yellow-600 font-medium">
                        +{dashboardData.expiringCertificates.length - 3} more expiring certificates
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-green-700 text-xl font-semibold">
              No immediate tasks found
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 w-52">
          <Link
            to="/dashboard/profilescreate"
            className="bg-teal-600 text-white py-2 rounded shadow hover:bg-teal-700 transition duration-200 text-center"
          >
            Create Profile
          </Link>
          <Link 
            to="/dashboard/createcertificate"
            className="bg-teal-600 text-white py-2 rounded shadow hover:bg-teal-700 transition duration-200 text-center"
          >
            Add Certificates
          </Link>
          
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Active Certificates</p>
              <p className="text-3xl font-bold text-green-600">{dashboardData.activeCount}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-3xl font-bold text-yellow-600">{dashboardData.expiringCertificates.length}</p>
              <p className="text-xs text-gray-500">Next {selectedTimeframe} days</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-3xl font-bold text-red-600">{dashboardData.expiredCertificates.length}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Certificates</p>
              <p className="text-3xl font-bold text-blue-600">{certificates.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Certificates */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Certificates Expiring in Next {selectedTimeframe} Days
            </h3>
          </div>
          <div className="p-6">
            {dashboardData.expiringCertificates.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No certificates expiring in the selected timeframe</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.expiringCertificates.map((cert) => {
                  const daysUntilExpiry = getDaysUntilExpiry(cert.expiryDate);
                  return (
                    <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{cert.certificate}</p>
                        <p className="text-sm text-gray-600">{cert.profileName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDate(cert.expiryDate)}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getExpiryStatusColor(daysUntilExpiry)}`}>
                          {daysUntilExpiry === 0 ? 'Today' : 
                           daysUntilExpiry === 1 ? '1 day' : 
                           `${daysUntilExpiry} days`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Certificate Categories */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Certificates by Category</h3>
          </div>
          <div className="p-6">
            {Object.keys(dashboardData.categoryCounts).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No certificate data available</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(dashboardData.categoryCounts).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / dashboardData.activeCount) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expired Certificates (if any) */}
      {dashboardData.expiredCertificates.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <h3 className="text-lg font-semibold text-red-800">
              Expired Certificates ({dashboardData.expiredCertificates.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {dashboardData.expiredCertificates.map((cert) => {
                const daysOverdue = Math.abs(getDaysUntilExpiry(cert.expiryDate));
                return (
                  <div key={cert.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{cert.certificate}</p>
                      <p className="text-sm text-gray-600">{cert.profileName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatDate(cert.expiryDate)}</p>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        {daysOverdue} days overdue
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceDashboard;
