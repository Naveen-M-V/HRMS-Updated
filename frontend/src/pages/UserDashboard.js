// src/pages/UserDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserClockIns from './UserClockIns';
import { userClockIn, userClockOut, getUserClockStatus } from '../utils/clockApi';
import ShiftInfoCard from '../components/ShiftInfoCard';
import { 
  PencilIcon, 
  PlusIcon, 
  EyeIcon, 
  BellIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  
  const [clockStatus, setClockStatus] = useState(null);
  const [location, setLocation] = useState('Work From Office');
  const [workType, setWorkType] = useState('Regular');
  const [processing, setProcessing] = useState(false);
  const [shiftInfo, setShiftInfo] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch user profile by email
      const profileResponse = await fetch(`${API_BASE_URL}/api/profiles/by-email/${user.email}`, {
        credentials: 'include'
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
        setEditedProfile(profileData);
        
        // Fetch user certificates
        const certificatesResponse = await fetch(`${API_BASE_URL}/api/profiles/${profileData._id}/certificates`, {
          credentials: 'include'
        });
        
        if (certificatesResponse.ok) {
          const certificatesData = await certificatesResponse.json();
          setCertificates(certificatesData);
        }

        // Fetch user notifications
        const notificationsResponse = await fetch(`${API_BASE_URL}/api/notifications/user/${profileData._id}`, {
          credentials: 'include'
        });
        
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json();
          setNotifications(notificationsData.slice(0, 10)); // Show latest 10
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, user.email]);

  useEffect(() => {
    if (user?.email) {
      fetchUserData();
      fetchClockStatus();
    }
  }, [user, fetchUserData]);

  const fetchClockStatus = async () => {
    try {
      const response = await getUserClockStatus();
      if (response.success) {
        setClockStatus(response.data);
      }
    } catch (error) {
      console.error('Fetch clock status error:', error);
    }
  };

  const handleClockIn = async () => {
    if (!location) {
      toast.warning('Please select a location');
      return;
    }

    setProcessing(true);
    try {
      const response = await userClockIn({ location, workType });
      
      if (response.success) {
        toast.success(response.message || 'Clocked in successfully!');
        
        if (response.data) {
          setShiftInfo(response.data.shift);
          setAttendanceStatus(response.data.attendanceStatus);
        }
        
        await fetchClockStatus();
        
        if (response.data?.attendanceStatus === 'Late') {
          toast.warning('Late arrival detected', { autoClose: 5000 });
        }
      }
    } catch (error) {
      console.error('Clock in error:', error);
      toast.error(error.message || 'Failed to clock in');
    } finally {
      setProcessing(false);
    }
  };

  const handleClockOut = async () => {
    if (!window.confirm('Are you sure you want to clock out?')) return;

    setProcessing(true);
    try {
      const response = await userClockOut();
      
      if (response.success) {
        const hours = response.data?.hoursWorked || 0;
        toast.success(`Clocked out! Hours: ${hours.toFixed(2)}h`, { autoClose: 5000 });
        
        setShiftInfo(null);
        setAttendanceStatus(null);
        await fetchClockStatus();
      }
    } catch (error) {
      console.error('Clock out error:', error);
      toast.error(error.message || 'Failed to clock out');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
  };

  const handleProfileSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/${userProfile._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editedProfile)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setUserProfile(updatedProfile);
        setIsEditingProfile(false);
        // Show success message
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleProfileCancel = () => {
    setEditedProfile(userProfile);
    setIsEditingProfile(false);
  };

  const handleInputChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCertificate = () => {
    navigate('/user/certificates/create');
  };

  const handleViewCertificate = (certificateId) => {
    navigate(`/user/certificates/${certificateId}`);
  };

  const getCertificateStatusColor = (expiryDate) => {
    if (!expiryDate) return 'text-gray-500';
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'text-red-600'; // Expired
    if (daysUntilExpiry <= 30) return 'text-yellow-600'; // Expiring soon
    return 'text-green-600'; // Valid
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'certificate_expiry':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'certificate_added':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'profile_updated':
        return <UserCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="/TSL.png" 
                alt="TSL Logo" 
                className="h-10 w-10 object-contain mr-3"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.firstName} {user?.lastName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {notifications.length > 0 && (
                <div className="relative">
                  <BellIcon className="h-6 w-6 text-gray-400" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: UserCircleIcon },
              { id: 'profile', name: 'My Profile', icon: UserCircleIcon },
              { id: 'clock-ins', name: 'Clock-ins', icon: ClockIcon },
              { id: 'certificates', name: 'My Certificates', icon: DocumentTextIcon },
              { id: 'notifications', name: 'Notifications', icon: BellIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
                {tab.id === 'notifications' && notifications.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Clock In/Out Widget */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Clock In / Out
              </h2>
              
              {shiftInfo && attendanceStatus && (
                <ShiftInfoCard shift={shiftInfo} attendanceStatus={attendanceStatus} validation={null} />
              )}
              
              {clockStatus?.status === 'clocked_in' || clockStatus?.status === 'on_break' ? (
                <div className="text-center">
                  <div className="mb-4 inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
                    🟢 Currently Clocked In
                  </div>
                  {clockStatus.clockIn && (
                    <p className="text-gray-600 mb-6">Clocked in at: <strong>{clockStatus.clockIn}</strong></p>
                  )}
                  <button
                    onClick={handleClockOut}
                    disabled={processing}
                    className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? '⏳ Processing...' : '🚪 Clock Out'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Work From Office">🏢 Work From Office</option>
                      <option value="Work From Home">🏠 Work From Home</option>
                      <option value="Field">🌍 Field</option>
                      <option value="Client Side">🤝 Client Site</option>
                    </select>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Work Type
                    </label>
                    <select
                      value={workType}
                      onChange={(e) => setWorkType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Regular">⏰ Regular</option>
                      <option value="Overtime">⏱️ Overtime</option>
                      <option value="Weekend Overtime">📅 Weekend Overtime</option>
                      <option value="Client-side Overtime">🤝 Client-side Overtime</option>
                    </select>
                  </div>
                  <button
                    onClick={handleClockIn}
                    disabled={processing}
                    className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? '⏳ Processing...' : '✅ Clock In'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Certificates</dt>
                        <dd className="text-lg font-medium text-gray-900">{certificates.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Expiring Soon</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {certificates.filter(cert => {
                            if (!cert.expiryDate) return false;
                            const daysUntilExpiry = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                            return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                          }).length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BellIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">New Notifications</dt>
                        <dd className="text-lg font-medium text-gray-900">{notifications.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                {notifications.length === 0 ? (
                  <p className="text-gray-500">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && userProfile && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">My Profile</h3>
                {!isEditingProfile ? (
                  <button
                    onClick={handleProfileEdit}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleProfileSave}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleProfileCancel}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { field: 'firstName', label: 'First Name', type: 'text' },
                  { field: 'lastName', label: 'Last Name', type: 'text' },
                  { field: 'email', label: 'Email', type: 'email', disabled: true },
                  { field: 'vtid', label: 'VTID', type: 'text', disabled: true },
                  { field: 'mobile', label: 'Mobile', type: 'tel' },
                  { field: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
                  { field: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                  { field: 'nationality', label: 'Nationality', type: 'text' }
                ].map((fieldConfig) => (
                  <div key={fieldConfig.field}>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      {fieldConfig.label}
                    </label>
                    {isEditingProfile && !fieldConfig.disabled ? (
                      fieldConfig.type === 'select' ? (
                        <select
                          value={editedProfile[fieldConfig.field] || ''}
                          onChange={(e) => handleInputChange(fieldConfig.field, e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">Select {fieldConfig.label}</option>
                          {fieldConfig.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={fieldConfig.type}
                          value={editedProfile[fieldConfig.field] || ''}
                          onChange={(e) => handleInputChange(fieldConfig.field, e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      )
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">
                        {fieldConfig.field === 'dateOfBirth' && userProfile[fieldConfig.field]
                          ? new Date(userProfile[fieldConfig.field]).toLocaleDateString()
                          : userProfile[fieldConfig.field] || 'Not specified'
                        }
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Clock-ins Tab */}
        {activeTab === 'clock-ins' && (
          <div style={{ margin: '-32px', padding: '0' }}>
            <UserClockIns />
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    My Certificates ({certificates.length})
                  </h3>
                  <button
                    onClick={handleAddCertificate}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Certificate
                  </button>
                </div>

                {certificates.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding your first certificate.</p>
                    <div className="mt-6">
                      <button
                        onClick={handleAddCertificate}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Certificate
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Certificate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Expiry Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {certificates.map((certificate) => {
                          const expiryDate = certificate.expiryDate ? new Date(certificate.expiryDate) : null;
                          const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                          
                          return (
                            <tr key={certificate._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{certificate.certificate}</div>
                                <div className="text-sm text-gray-500">{certificate.provider || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {certificate.category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  daysUntilExpiry === null ? 'bg-gray-100 text-gray-800' :
                                  daysUntilExpiry < 0 ? 'bg-red-100 text-red-800' :
                                  daysUntilExpiry <= 30 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {daysUntilExpiry === null ? 'No Expiry' :
                                   daysUntilExpiry < 0 ? 'Expired' :
                                   daysUntilExpiry <= 30 ? 'Expiring Soon' :
                                   'Valid'}
                                </span>
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm ${getCertificateStatusColor(certificate.expiryDate)}`}>
                                {certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString() : 'No expiry'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleViewCertificate(certificate._id)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">My Notifications</h3>
              
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">You're all caught up! New notifications will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title || 'Notification'}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
