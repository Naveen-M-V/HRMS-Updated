import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCertificates } from '../context/CertificateContext';
import ComplianceInsights from './ComplianceInsights';

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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/certificates/dashboard-stats?days=${selectedTimeframe}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
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
}, [selectedTimeframe, certificates]);


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

    </div>
  );
};

export default ComplianceDashboard;
