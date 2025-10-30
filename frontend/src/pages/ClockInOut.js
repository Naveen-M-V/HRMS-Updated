import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getClockStatus, getDashboardStats } from '../utils/clockApi';
import { getCurrentUserLeaveBalance, getNextUpcomingLeave } from '../utils/leaveApi';
import LoadingScreen from '../components/LoadingScreen';

/**
 * Clock In/Out Overview Page
 * Shows current clock status and statistics for all employees
 */

const ClockInOut = () => {
  const [clockData, setClockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    clockedIn: 0,
    clockedOut: 0,
    onBreak: 0,
    absent: 0
  });
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [nextLeave, setNextLeave] = useState(null);

  const fetchClockStatus = async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        getClockStatus(),
        getDashboardStats()
      ]);
      
      if (statusRes.success) {
        setClockData(statusRes.data || []);
      } else {
        setClockData([]);
      }
      
      // Use API stats if available, otherwise calculate from data
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        calculateStats(statusRes.data || []);
      }
    } catch (error) {
      console.error('Clock status error:', error);
      toast.error('Failed to fetch employee clock status');
      setClockData([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveData = async () => {
    try {
      const balanceResponse = await getCurrentUserLeaveBalance();
      if (balanceResponse.success && balanceResponse.data) {
        setLeaveBalance(balanceResponse.data);
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      // Don't show error to user, just use defaults
    }

    try {
      const nextLeaveResponse = await getNextUpcomingLeave();
      if (nextLeaveResponse.success && nextLeaveResponse.data) {
        setNextLeave(nextLeaveResponse.data);
      }
    } catch (error) {
      console.error('Error fetching next leave:', error);
      // Don't show error to user
    }
  };

  useEffect(() => {
    fetchClockStatus();
    fetchLeaveData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchClockStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateStats = (data) => {
    const stats = {
      clockedIn: 0,
      clockedOut: 0,
      onBreak: 0,
      absent: 0
    };

    data.forEach(employee => {
      switch (employee.status) {
        case 'clocked_in':
          stats.clockedIn++;
          break;
        case 'clocked_out':
          stats.clockedOut++;
          break;
        case 'on_break':
          stats.onBreak++;
          break;
        case 'absent':
          stats.absent++;
          break;
        default:
          stats.absent++;
      }
    });

    // Ensure absent count is never negative
    stats.absent = Math.max(0, stats.absent);

    setStats(stats);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'clocked_in': return '#10b981'; // green
      case 'clocked_out': return '#3b82f6'; // blue
      case 'on_break': return '#f59e0b'; // amber
      case 'absent': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'clocked_in': return 'Clocked In';
      case 'clocked_out': return 'Clocked Out';
      case 'on_break': return 'On a break';
      case 'absent': return 'Absent';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '8px'
          }}>
            Clock In Overview
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Last Updated: {new Date().toLocaleString('en-GB', { 
              timeZone: 'Europe/London',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })} (UK Time) - Updates every 30 seconds
          </p>
        </div>

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Clocked In
              </span>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981'
              }}></div>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827'
            }}>
              {stats.clockedIn}
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Clocked Out
              </span>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#3b82f6'
              }}></div>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827'
            }}>
              {stats.clockedOut}
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                On a break
              </span>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#f59e0b'
              }}></div>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827'
            }}>
              {stats.onBreak}
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                Absent
              </span>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444'
              }}></div>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827'
            }}>
              {stats.absent}
            </div>
          </div>
        </div>

        {/* My Summary and E-Learning sections */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '32px'
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
                  {nextLeave ? new Date(nextLeave.startDate).toLocaleDateString('en-GB') : 'None scheduled'}
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

        {/* Employee List */}
        {clockData.length > 0 && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Employee Status
              </h3>
            </div>
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {clockData.map((employee, index) => (
                <div key={employee.id || index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: index < clockData.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    {employee.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '2px'
                    }}>
                      {employee.name || 'Unknown User'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      {employee.department || 'No Department'}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: getStatusColor(employee.status)
                    }}></div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#111827'
                    }}>
                      {getStatusText(employee.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ClockInOut;
