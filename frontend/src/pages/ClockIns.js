import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getClockStatus, clockIn, clockOut, changeEmployeeStatus, getDashboardStats, setOnBreak, deleteTimeEntry } from '../utils/clockApi';
import LoadingScreen from '../components/LoadingScreen';

/**
 * Clock-ins Page
 * Shows detailed employee list with clock in/out functionality
 * NO DEMO DATA - All data from backend with proper error handling
 */

const ClockIns = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    clockedIn: 0,
    onBreak: 0,
    clockedOut: 0,
    total: 0
  });
  const [filters, setFilters] = useState({
    role: 'All Roles',
    staffType: 'All Staff Types',
    company: 'All Companies',
    manager: 'All Managers'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntries, setShowEntries] = useState(10);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching clock-ins data...');
      
      const [employeesRes, statsRes] = await Promise.all([
        getClockStatus(),
        getDashboardStats()
      ]);
      
      console.log('👥 Employees Response:', employeesRes);
      console.log('📊 Stats Response:', statsRes);
      
      if (employeesRes.success) {
        const employeeData = employeesRes.data || [];
        console.log(`✅ Loaded ${employeeData.length} employees`);
        setEmployees(employeeData);
      } else {
        console.warn('⚠️ Employee fetch failed:', employeesRes);
        setEmployees([]);
      }
      
      if (statsRes.success) {
        console.log('✅ Stats loaded:', statsRes.data);
        setStats(statsRes.data);
      } else {
        console.warn('⚠️ Stats fetch failed:', statsRes);
        // Calculate stats from employees if API fails
        calculateStatsFromEmployees(employeesRes.data || []);
      }
    } catch (error) {
      console.error('❌ Fetch data error:', error);
      toast.error('Failed to fetch data');
      setEmployees([]);
      // Try to calculate stats from whatever data we have
      calculateStatsFromEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatsFromEmployees = (employeeList) => {
    const calculated = {
      clockedIn: employeeList.filter(e => e.status === 'clocked_in').length,
      onBreak: employeeList.filter(e => e.status === 'on_break').length,
      clockedOut: employeeList.filter(e => e.status === 'clocked_out').length,
      total: employeeList.length
    };
    console.log('📊 Calculated stats from employees:', calculated);
    setStats(calculated);
  };

  const handleClockIn = async (employeeId) => {
    if (!employeeId) {
      toast.error('Invalid employee ID');
      return;
    }

    try {
      const response = await clockIn({ employeeId });
      if (response.success) {
        toast.success('Employee clocked in successfully');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to clock in');
      }
    } catch (error) {
      console.error('Clock in error:', error);
      toast.error(error.message || 'Failed to clock in');
    }
  };

  const handleClockOut = async (employeeId) => {
    if (!employeeId) {
      toast.error('Invalid employee ID');
      return;
    }

    try {
      const response = await clockOut({ employeeId });
      if (response.success) {
        toast.success('Employee clocked out successfully');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to clock out');
      }
    } catch (error) {
      console.error('Clock out error:', error);
      toast.error(error.message || 'Failed to clock out');
    }
  };

  const handleOnBreak = async (employeeId) => {
    if (!employeeId) {
      toast.error('Invalid employee ID');
      return;
    }

    try {
      const response = await setOnBreak(employeeId);
      if (response.success) {
        toast.success('Employee is now on break');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to set on break');
      }
    } catch (error) {
      console.error('On break error:', error);
      toast.error(error.message || 'Failed to set on break');
    }
  };

  const handleStatusChange = async (employeeId, newStatus) => {
    if (!employeeId) {
      toast.error('Invalid employee ID');
      return;
    }

    try {
      const response = await changeEmployeeStatus(employeeId, newStatus);
      if (response.success) {
        toast.success(`Status changed to ${newStatus.replace('_', ' ')} successfully`);
        fetchData();
      } else {
        toast.error(response.message || 'Failed to change status');
      }
    } catch (error) {
      console.error('Status change error:', error);
      toast.error(error.message || 'Failed to change status');
    }
  };

  const handleDeleteTimeEntry = async (timeEntryId, employeeName) => {
    if (!timeEntryId) {
      toast.error('No time entry to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the time entry for ${employeeName}?\n\nThis will:\n- Delete the clock-in/out record\n- Reset the shift status to "Scheduled"\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await deleteTimeEntry(timeEntryId);
      if (response.success) {
        toast.success('Time entry deleted successfully');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to delete time entry');
      }
    } catch (error) {
      console.error('Delete time entry error:', error);
      toast.error(error.message || 'Failed to delete time entry');
    }
  };

  /**
   * Get current UK time for "Last Updated"
   */
  const getCurrentUKTime = () => {
    const now = new Date();
    return now.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      clocked_in: { background: '#10b981', color: 'white' },
      clocked_out: { background: '#3b82f6', color: 'white' },
      on_break: { background: '#f59e0b', color: 'white' },
      absent: { background: '#ef4444', color: 'white' },
      on_leave: { background: '#8b5cf6', color: 'white' }
    };

    const labels = {
      clocked_in: 'Clocked In',
      clocked_out: 'Clocked Out',
      on_break: 'On Break',
      absent: 'Absent',
      on_leave: 'On Leave'
    };

    return (
      <span style={{
        ...styles[status] || styles.absent,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {labels[status] || 'Unknown'}
      </span>
    );
  };

  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         employee.vtid?.toString().includes(searchTerm) ||
                         employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const displayedEmployees = filteredEmployees.slice(0, showEntries);

  // Calculate absent count
  const absentCount = employees.filter(e => e.status === 'absent' || !e.status).length;

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={{
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '8px'
            }}>
              Clock-ins
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6b7280'
            }}>
              Last Updated: {getCurrentUKTime()} (UK Time)
            </p>
          </div>
        </div>

        {/* Statistics Cards - LIVE DATA */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{stats.clockedIn}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Clocked In</div>
          </div>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{stats.clockedOut}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Clocked Out</div>
          </div>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{stats.onBreak}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>On a break</div>
          </div>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>{absentCount}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Absent</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search by name, VTID or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Show</span>
              <select
                value={showEntries}
                onChange={(e) => setShowEntries(Number(e.target.value))}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>entries</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <button
              onClick={() => {
                setFilters({
                  role: 'All Roles',
                  staffType: 'All Staff Types',
                  company: 'All Companies',
                  manager: 'All Managers'
                });
                setSearchTerm('');
              }}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Employee Table */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead style={{
              background: '#f9fafb'
            }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>VTID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>First Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Last Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Department</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Job Title</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedEmployees.length > 0 ? (
                displayedEmployees.map((employee, index) => (
                  <tr key={employee.id || employee._id || index} style={{
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {employee.vtid || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {employee.firstName || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {employee.lastName || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {employee.email || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {employee.department || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {employee.jobTitle || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <select
                        value={employee.status || 'absent'}
                        onChange={(e) => handleStatusChange(employee.id || employee._id, e.target.value)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          background: 'white',
                          color: '#111827',
                          minWidth: '130px'
                        }}
                      >
                        <option value="clocked_in">✓ Clocked In</option>
                        <option value="clocked_out">○ Clocked Out</option>
                        <option value="on_break">☕ On Break</option>
                        <option value="absent">✗ Absent</option>
                        <option value="on_leave">🏖️ On Leave</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {employee.status === 'clocked_in' ? (
                          <>
                            <button
                              onClick={() => handleOnBreak(employee.id || employee._id)}
                              style={{
                                padding: '6px 12px',
                                background: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              Break
                            </button>
                            <button
                              onClick={() => handleClockOut(employee.id || employee._id)}
                              style={{
                                padding: '6px 12px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              Clock Out
                            </button>
                          </>
                        ) : employee.status === 'on_break' ? (
                          <button
                            onClick={() => handleClockOut(employee.id || employee._id)}
                            style={{
                              padding: '6px 12px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Clock Out
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClockIn(employee.id || employee._id)}
                            style={{
                              padding: '6px 12px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Clock In
                          </button>
                        )}
                        {/* Delete Button - Only show if employee has a time entry */}
                        {employee.timeEntryId && (
                          <button
                            onClick={() => handleDeleteTimeEntry(employee.timeEntryId, employee.name)}
                            style={{
                              padding: '6px 12px',
                              background: '#ffffff',
                              color: '#dc2626',
                              border: '1px solid #dc2626',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                            title="Delete time entry"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                      No Employees Found
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                      {searchTerm ? 'Try adjusting your search criteria' : 'No employees in the system'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {displayedEmployees.length > 0 && (
          <div style={{
            marginTop: '16px',
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Showing {Math.min(showEntries, filteredEmployees.length)} of {filteredEmployees.length} entries
          </div>
        )}
      </div>
    </>
  );
};

export default ClockIns;
