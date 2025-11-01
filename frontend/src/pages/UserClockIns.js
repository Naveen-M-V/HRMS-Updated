import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';
import ShiftCalendar from '../components/ShiftCalendar';
import { 
  getUserClockStatus, 
  userClockIn, 
  userClockOut, 
  addUserBreak,
  userResumeWork,
  getUserTimeEntries 
} from '../utils/clockApi';

/**
 * User Clock-ins Page
 * Employee view for clocking in/out with work type and location selection
 */

const UserClockIns = () => {
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingin] = useState(false);
  const [timeEntries, setTimeEntries] = useState([]);
  const [selectedWorkType, setSelectedWorkType] = useState('Regular');
  const [selectedLocation, setSelectedLocation] = useState('Work From Office');
  const [activeView, setActiveView] = useState('clock-in');

  // Work types matching the image
  const workTypes = [
    'Regular',
    'Overtime', 
    'Weekend Overtime',
    'Client-side Overtime'
  ];

  // Location types matching the image
  const locationTypes = [
    'Work From Office',
    'Work From Home',
    'Field',
    'Client Side'
  ];

  useEffect(() => {
    fetchUserStatus();
    fetchUserEntries();
    
    // Poll for updates every 10 seconds to catch admin actions
    const interval = setInterval(() => {
      fetchUserStatus();
      fetchUserEntries();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUserStatus = async () => {
    try {
      const response = await getUserClockStatus();
      if (response.success) {
        setCurrentStatus(response.data);
      }
    } catch (error) {
      console.error('Fetch status error:', error);
      toast.error('Failed to load clock status');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEntries = async () => {
    try {
      const response = await getUserTimeEntries();
      if (response.success) {
        setTimeEntries(response.data);
      }
    } catch (error) {
      console.error('Fetch entries error:', error);
    }
  };

  const handleClockIn = async () => {
    setClockingin(true);
    try {
      const response = await userClockIn({
        workType: selectedWorkType,
        location: selectedLocation
      });
      
      if (response.success) {
        toast.success('Clocked in successfully!');
        // Immediately fetch updated status and entries
        await fetchUserStatus();
        await fetchUserEntries();
      } else {
        toast.error(response.message || 'Failed to clock in');
      }
    } catch (error) {
      console.error('Clock in error:', error);
      toast.error(error.message || 'Failed to clock in');
    } finally {
      setClockingin(false);
    }
  };

  const handleClockOut = async () => {
    setClockingin(true);
    try {
      const response = await userClockOut();
      
      if (response.success) {
        toast.success('Clocked out successfully!');
        // Immediately fetch updated status and entries
        await fetchUserStatus();
        await fetchUserEntries();
      } else {
        toast.error(response.message || 'Failed to clock out');
      }
    } catch (error) {
      console.error('Clock out error:', error);
      toast.error(error.message || 'Failed to clock out');
    } finally {
      setClockingin(false);
    }
  };

  const handleStartBreak = async () => {
    try {
      const response = await addUserBreak();
      
      if (response.success) {
        toast.success('Break started successfully!');
        // Immediately fetch updated status and entries
        await fetchUserStatus();
        await fetchUserEntries();
      } else {
        toast.error(response.message || 'Failed to start break');
      }
    } catch (error) {
      console.error('Start break error:', error);
      toast.error(error.message || 'Failed to start break');
    }
  };

  const handleResumeWork = async () => {
    try {
      const response = await userResumeWork();
      
      if (response.success) {
        toast.success('Work resumed successfully!');
        // Immediately fetch updated status and entries
        await fetchUserStatus();
        await fetchUserEntries();
      } else {
        toast.error(response.message || 'Failed to resume work');
      }
    } catch (error) {
      console.error('Resume work error:', error);
      toast.error(error.message || 'Failed to resume work');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + '\n' + today.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const isCurrentlyClockedIn = currentStatus?.status === 'clocked_in' || currentStatus?.status === 'on_break';

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        background: '#f9fafb',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '24px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Clock-ins
          </h1>
          
          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '8px'
          }}>
            <button
              onClick={() => setActiveView('clock-in')}
              style={{
                padding: '8px 16px',
                background: activeView === 'clock-in' ? '#10b981' : 'transparent',
                color: activeView === 'clock-in' ? 'white' : '#6b7280',
                border: activeView === 'clock-in' ? 'none' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Clock In/Out
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              style={{
                padding: '8px 16px',
                background: activeView === 'calendar' ? '#10b981' : 'transparent',
                color: activeView === 'calendar' ? 'white' : '#6b7280',
                border: activeView === 'calendar' ? 'none' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Calendar View
            </button>
          </div>
        </div>

        {/* Clock In/Out View */}
        {activeView === 'clock-in' && (
          <>
            {/* Main Clock In/Out Panel */}
            <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '24px',
            alignItems: 'start'
          }}>
            {/* Date Section */}
            <div style={{
              textAlign: 'center',
              padding: '16px'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '4px',
                whiteSpace: 'pre-line'
              }}>
                {getCurrentDate()}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '16px'
              }}>
                {!isCurrentlyClockedIn ? (
                  <button
                    onClick={handleClockIn}
                    disabled={clockingIn}
                    style={{
                      padding: '12px 24px',
                      background: clockingIn ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: clockingIn ? 'not-allowed' : 'pointer',
                      minWidth: '120px'
                    }}
                  >
                    {clockingIn ? 'Clocking In...' : 'Clock In'}
                  </button>
                ) : (
                  <button
                    onClick={handleClockOut}
                    disabled={clockingIn}
                    style={{
                      padding: '12px 24px',
                      background: clockingIn ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: clockingIn ? 'not-allowed' : 'pointer',
                      minWidth: '120px'
                    }}
                  >
                    {clockingIn ? 'Clocking Out...' : 'Clock Out'}
                  </button>
                )}
                
                {isCurrentlyClockedIn && (
                  currentStatus?.status === 'on_break' ? (
                    <button
                      onClick={handleResumeWork}
                      disabled={clockingIn}
                      style={{
                        padding: '12px 24px',
                        background: clockingIn ? '#9ca3af' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: clockingIn ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {clockingIn ? 'Resuming...' : 'Resume Work'}
                    </button>
                  ) : (
                    <button
                      onClick={handleStartBreak}
                      disabled={clockingIn}
                      style={{
                        padding: '12px 24px',
                        background: clockingIn ? '#9ca3af' : '#06b6d4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: clockingIn ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {clockingIn ? 'Starting Break...' : 'Start Break'}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Work Type Section */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Work Type
              </label>
              <select
                value={selectedWorkType}
                onChange={(e) => setSelectedWorkType(e.target.value)}
                disabled={isCurrentlyClockedIn}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: isCurrentlyClockedIn ? '#f3f4f6' : '#ffffff',
                  cursor: isCurrentlyClockedIn ? 'not-allowed' : 'pointer'
                }}
              >
                {workTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              {/* Work Type Options Display */}
              <div style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                {workTypes.map(type => (
                  <div key={type} style={{
                    padding: '4px 0',
                    borderBottom: type === workTypes[workTypes.length - 1] ? 'none' : '1px solid #f3f4f6'
                  }}>
                    {type}
                  </div>
                ))}
              </div>
            </div>

            {/* Location Section */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Select Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                disabled={isCurrentlyClockedIn}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: isCurrentlyClockedIn ? '#f3f4f6' : '#ffffff',
                  cursor: isCurrentlyClockedIn ? 'not-allowed' : 'pointer'
                }}
              >
                {locationTypes.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              
              {/* Location Options Display */}
              <div style={{
                marginTop: '12px',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                {locationTypes.map(location => (
                  <div key={location} style={{
                    padding: '4px 0',
                    borderBottom: location === locationTypes[locationTypes.length - 1] ? 'none' : '1px solid #f3f4f6'
                  }}>
                    {location}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Current Status Display */}
          {currentStatus && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Current Status: 
                  </span>
                  <span style={{
                    marginLeft: '8px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: currentStatus.status === 'clocked_in' ? '#10b981' : 
                               currentStatus.status === 'on_break' ? '#f59e0b' : '#3b82f6',
                    color: 'white'
                  }}>
                    {currentStatus.status === 'clocked_in' ? 'Clocked In' :
                     currentStatus.status === 'on_break' ? 'On Break' :
                     currentStatus.status === 'clocked_out' ? 'Clocked Out' : 'Not Clocked In'}
                  </span>
                </div>
                {currentStatus.clockIn && (
                  <div style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    Clocked in at: {formatTime(currentStatus.clockIn)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Time Entries Table */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Recent Time Entries
            </h3>
          </div>
          
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead style={{
              background: '#f3f4f6'
            }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>VTID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Clock In</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Clock Out</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Breaks</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Work Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Location</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.length > 0 ? timeEntries.slice(0, 10).map((entry, index) => (
                <tr key={entry._id || index} style={{
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {user?.vtid || entry.employee?.vtid || '-'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {formatDate(entry.date)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    <div>{formatTime(entry.clockIn)}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {formatDate(entry.date)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    <div>{formatTime(entry.clockOut)}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {entry.clockOut ? formatDate(entry.date) : '-'}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {entry.breaks?.length > 0 ? 
                      `${Math.floor(entry.breaks.reduce((total, b) => total + (b.duration || 0), 0) / 60)}hrs ${entry.breaks.reduce((total, b) => total + (b.duration || 0), 0) % 60}mins` : 
                      '0hrs 0mins'
                    }
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {entry.workType || 'Regular'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                    {entry.location || 'Work From Office'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                    No time entries found. Clock in to start tracking your time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          </>
        )}

        {/* Calendar View */}
        {activeView === 'calendar' && (
          <ShiftCalendar />
        )}
      </div>
    </>
  );
};

export default UserClockIns;
