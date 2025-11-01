import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCertificates } from '../context/CertificateContext';
import { useAuth } from '../context/AuthContext';
import ComplianceInsights from './ComplianceInsights';
import AdminClockInModal from './AdminClockInModal';
import AdminClockOutModal from './AdminClockOutModal';
import { ClockIcon } from '@heroicons/react/24/outline';
import { getUserClockStatus, userClockOut, userStartBreak, userResumeWork } from '../utils/clockApi';
import { toast } from 'react-toastify';

const ComplianceDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [showAdminClockInModal, setShowAdminClockInModal] = useState(false);
  const [showAdminClockOutModal, setShowAdminClockOutModal] = useState(false);
  const [clockStatus, setClockStatus] = useState(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    activeCount: 0,
    expiringCertificates: [],
    expiredCertificates: [],
    categoryCounts: {},
    jobRoleCounts: {}
  });
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [nextLeave, setNextLeave] = useState(null);

 useEffect(() => {
  fetchClockStatus();
}, []);

 const fetchClockStatus = async () => {
  try {
    const response = await getUserClockStatus();
    if (response.success && response.data) {
      setClockStatus(response.data);
    }
  } catch (error) {
    console.error('Error fetching clock status:', error);
  }
};

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
      year: 'numeric',
      timeZone: 'Europe/London'
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

  const handleClockOut = async () => {
    setShowAdminClockOutModal(true);
  };

  const onClockOutComplete = async () => {
    await fetchClockStatus();
  };

  const handleStartBreak = async () => {
    setClockLoading(true);
    try {
      const response = await userStartBreak();
      if (response.success) {
        toast.success('Break started');
        await fetchClockStatus();
      } else {
        toast.error(response.message || 'Failed to start break');
      }
    } catch (error) {
      console.error('Start break error:', error);
      toast.error('Failed to start break');
    } finally {
      setClockLoading(false);
    }
  };

  const handleResumeWork = async () => {
    setClockLoading(true);
    try {
      const response = await userResumeWork();
      if (response.success) {
        toast.success('Work resumed');
        await fetchClockStatus();
      } else {
        toast.error(response.message || 'Failed to resume work');
      }
    } catch (error) {
      console.error('Resume work error:', error);
      toast.error('Failed to resume work');
    } finally {
      setClockLoading(false);
    }
  };

  const isClockedIn = clockStatus?.status === 'clocked_in' || clockStatus?.status === 'on_break';

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
        <div className="flex items-center space-x-4">
          {isClockedIn ? (
            <>
              {clockStatus?.status === 'on_break' ? (
                <button
                  onClick={handleResumeWork}
                  disabled={clockLoading}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ClockIcon className="h-5 w-5 mr-2" />
                  {clockLoading ? 'Resuming...' : 'Resume Work'}
                </button>
              ) : (
                <button
                  onClick={handleStartBreak}
                  disabled={clockLoading}
                  className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ClockIcon className="h-5 w-5 mr-2" />
                  {clockLoading ? 'Starting...' : 'Add Break'}
                </button>
              )}
              <button
                onClick={handleClockOut}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
              >
                <ClockIcon className="h-5 w-5 mr-2" />
                Clock Out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAdminClockInModal(true)}
              disabled={clockLoading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              {clockLoading ? 'Loading...' : 'Clock In'}
            </button>
          )}
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
      </div>

      {/* Compliance Insights Section */}
      <ComplianceInsights />

      {/* My Summary and E-Learning sections */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginTop: '32px'
      }}>
        {/* My Summary */}
        <div style={{
          background: '#dcfce7',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            My Summary
          </h3>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                Annual Leave
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827'
              }}>
                {leaveBalance?.remainingDays ?? 0} Days
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Remaining
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                Next Up
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827'
              }}>
                {nextLeave ? new Date(nextLeave.startDate).toLocaleDateString('en-GB', { timeZone: 'Europe/London' }) : 'None scheduled'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                {nextLeave ? (nextLeave.type === 'annual' ? 'Annual Leave' : nextLeave.type) : 'No upcoming leave'}
              </div>
            </div>
          </div>
        </div>

        {/* E-Learning */}
        <div style={{
          background: '#dcfce7',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '16px'
          }}>
            E Learning
          </h3>
          <div style={{
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px'
            }}>
              No Courses Assigned
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Courses assigned to you will appear here
            </div>
          </div>
        </div>
      </div>

      {/* Admin Clock-In Modal */}
      {showAdminClockInModal && (
        <AdminClockInModal
          user={user}
          onClose={() => setShowAdminClockInModal(false)}
          onClockIn={async () => {
            setShowAdminClockInModal(false);
            await fetchClockStatus();
          }}
        />
      )}

      {/* Admin Clock-Out Modal */}
      {showAdminClockOutModal && (
        <AdminClockOutModal
          user={user}
          onClose={() => setShowAdminClockOutModal(false)}
          onClockOut={async () => {
            setShowAdminClockOutModal(false);
            await fetchClockStatus();
          }}
        />
      )}
    </div>
  );
};

export default ComplianceDashboard;
