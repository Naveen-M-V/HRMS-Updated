import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getClockStatus, clockIn, clockOut, changeEmployeeStatus, getDashboardStats, setOnBreak, deleteTimeEntry } from '../utils/clockApi';
import LoadingScreen from '../components/LoadingScreen';
import EmployeeProfileModal from '../components/EmployeeProfileModal';

/**
 * Clock-ins Page
 * Shows detailed employee list with clock in/out functionality
 * NO DEMO DATA - All data from backend with proper error handling
 */

const ClockIns = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    role: 'All Roles',
    staffType: 'All Staff Types',
    company: 'All Companies',
    manager: 'All Managers'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntries, setShowEntries] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [myStatus, setMyStatus] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', clockIn: '', clockOut: '' });
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [clockInEmployee, setClockInEmployee] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null); // null means show all

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds for real-time sync with user dashboard
    // This ensures admin sees clock-ins from users immediately
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching clock-ins data...');
      setStatsLoading(true);
      
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
        
        // Calculate stats from employees if dashboard API fails
        if (!statsRes.success) {
          calculateStatsFromEmployees(employeeData);
        }
      } else {
        console.warn('⚠️ Employee fetch failed:', employeesRes);
        setEmployees([]);
        setStats({ clockedIn: 0, onBreak: 0, clockedOut: 0, total: 0 });
      }
      
      if (statsRes.success && statsRes.data) {
        console.log('✅ Stats loaded from API:', statsRes.data);
        setStats(statsRes.data);
        setStatsLoading(false);
      } else {
        console.warn('⚠️ Stats fetch failed, calculating from employee list');
        calculateStatsFromEmployees(employeesRes.data || []);
      }
    } catch (error) {
      console.error('❌ Fetch data error:', error);
      toast.error('Failed to fetch data');
      setEmployees([]);
      setStats({ clockedIn: 0, onBreak: 0, clockedOut: 0, total: 0 });
      setStatsLoading(false);
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
    setStatsLoading(false);
  };

  const openClockInModal = (employee) => {
    setClockInEmployee(employee);
    setShowClockInModal(true);
  };

  const confirmClockIn = async () => {
    if (!clockInEmployee) return;
    
    const employeeId = clockInEmployee.id || clockInEmployee._id;
    setShowClockInModal(false);
    
    console.log('Clock In - Employee ID:', employeeId);
    console.log('Employee ID type:', typeof employeeId);

    // Optimistic update
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => 
        (emp.id === employeeId || emp._id === employeeId) 
          ? { ...emp, status: 'clocked_in' }
          : emp
      )
    );

    try {
      const payload = { employeeId };
      console.log('📤 Sending clock in request:', payload);
      
      const response = await clockIn(payload);
      console.log('📥 Clock in response:', response);
      
      if (response.success) {
        toast.success('Employee clocked in successfully');
        fetchData();
        // Update selected employee status
        setSelectedEmployee(prev => prev ? { ...prev, status: 'clocked_in' } : null);
      } else {
        toast.error(response.message || 'Failed to clock in');
        fetchData(); // Revert on failure
      }
    } catch (error) {
      console.error('❌ Clock in error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to clock in');
      fetchData(); // Revert on error
    }
  };

  const handleClockOut = async (employeeId) => {
    if (!employeeId) {
      toast.error('Invalid employee ID');
      return;
    }

    // Optimistic update
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => 
        (emp.id === employeeId || emp._id === employeeId) 
          ? { ...emp, status: 'clocked_out' }
          : emp
      )
    );

    // Also update selected employee if it matches
    setSelectedEmployee(prev => 
      prev && (prev.id === employeeId || prev._id === employeeId) 
        ? { ...prev, status: 'clocked_out' }
        : prev
    );

    try {
      const response = await clockOut({ employeeId });
      if (response.success) {
        toast.success('Employee clocked out successfully');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to clock out');
        fetchData(); // Revert on failure
      }
    } catch (error) {
      console.error('Clock out error:', error);
      toast.error(error.message || 'Failed to clock out');
      fetchData(); // Revert on error
    }
  };

  const handleOnBreak = async (employeeId) => {
    if (!employeeId) {
      toast.error('Invalid employee ID');
      return;
    }

    // Optimistic update
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => 
        (emp.id === employeeId || emp._id === employeeId) 
          ? { ...emp, status: 'on_break' }
          : emp
      )
    );

    // Also update selected employee if it matches
    setSelectedEmployee(prev => 
      prev && (prev.id === employeeId || prev._id === employeeId) 
        ? { ...prev, status: 'on_break' }
        : prev
    );

    try {
      const response = await setOnBreak(employeeId);
      if (response.success) {
        toast.success('Employee is now on break');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to set on break');
        fetchData(); // Revert on failure
      }
    } catch (error) {
      console.error('Set on break error:', error);
      toast.error(error.message || 'Failed to set on break');
      fetchData(); // Revert on error
    }
  };

  const handleStatusChange = async (employeeId, newStatus) => {
    if (!employeeId) {
      toast.error('Invalid employee ID');
      return;
    }

    // Optimistic update - update UI immediately
    const actualStatus = newStatus === 'resume_work' ? 'clocked_in' : newStatus;
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => 
        (emp.id === employeeId || emp._id === employeeId) 
          ? { ...emp, status: actualStatus }
          : emp
      )
    );

    // Also update selected employee if it matches
    setSelectedEmployee(prev => 
      prev && (prev.id === employeeId || prev._id === employeeId) 
        ? { ...prev, status: actualStatus }
        : prev
    );

    try {
      const response = await changeEmployeeStatus(employeeId, actualStatus);
      if (response.success) {
        const displayStatus = newStatus === 'resume_work' ? 'resumed work' : actualStatus.replace('_', ' ');
        toast.success(`Status changed to ${displayStatus} successfully`);
        // Fetch fresh data to ensure consistency
        fetchData();
      } else {
        toast.error(response.message || 'Failed to change status');
        // Revert optimistic update on failure
        fetchData();
      }
    } catch (error) {
      console.error('Status change error:', error);
      toast.error(error.message || 'Failed to change status');
      // Revert optimistic update on error
      fetchData();
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

  const handleEditEntry = (employee) => {
    if (!employee.timeEntryId) {
      toast.error('No time entry to edit');
      return;
    }
    
    setEditingEntry(employee);
    setEditForm({
      date: new Date().toISOString().split('T')[0],
      clockIn: employee.clockIn || '09:00',
      clockOut: employee.clockOut || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateTimeEntry = async (e) => {
    e.preventDefault();
    
    if (!editingEntry?.timeEntryId) return;

    try {
      const { updateTimeEntry } = await import('../utils/clockApi');
      const response = await updateTimeEntry(editingEntry.timeEntryId, {
        clockIn: editForm.clockIn,
        clockOut: editForm.clockOut,
        date: editForm.date
      });

      if (response.success) {
        toast.success('Time entry updated successfully');
        setShowEditModal(false);
        fetchData();
      } else {
        toast.error(response.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update time entry');
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
      clocked_in: { color: '#10b981' },
      clocked_out: { color: '#3b82f6' },
      on_break: { color: '#f59e0b' },
      absent: { color: '#ef4444' },
      on_leave: { color: '#8b5cf6' }
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
        fontSize: '13px',
        fontWeight: '500'
      }}>
        {labels[status] || 'Unknown'}
      </span>
    );
  };

  // Apply status filter first, then other filters
  const filteredEmployees = employees
    .filter(employee => {
      // Status filter
      if (statusFilter) {
        if (statusFilter === 'absent') {
          if (employee.status !== 'absent' && employee.status) return false;
        } else {
          if (employee.status !== statusFilter) return false;
        }
      }
      return true;
    })
    .filter(employee => {
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
          
          {/* Top Action Buttons - Always Visible */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const emp = employees.find(emp => (emp.id || emp._id) === e.target.value);
                setSelectedEmployee(emp || null);
              }}
              style={{
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '200px',
                fontWeight: '500'
              }}
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id || emp._id} value={emp.id || emp._id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
            
            {selectedEmployee && selectedEmployee.status === 'clocked_in' && (
              <button
                onClick={() => handleOnBreak(selectedEmployee.id || selectedEmployee._id)}
                style={{
                  padding: '10px 24px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                }}
              >
                 Add Break
              </button>
            )}
            
            {selectedEmployee?.status === 'clocked_in' || selectedEmployee?.status === 'on_break' ? (
              <button
                onClick={() => handleClockOut(selectedEmployee.id || selectedEmployee._id)}
                style={{
                  padding: '10px 24px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                }}
              >
                 Clock Out
              </button>
            ) : (
              <button
                onClick={() => {
                  if (selectedEmployee) {
                    openClockInModal(selectedEmployee);
                  } else {
                    toast.warning('Please select an employee first');
                  }
                }}
                disabled={!selectedEmployee}
                style={{
                  padding: '10px 24px',
                  background: selectedEmployee ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: selectedEmployee ? 'pointer' : 'not-allowed',
                  boxShadow: selectedEmployee ? '0 2px 4px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                 Clock In
              </button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div 
            onClick={() => setStatusFilter(statusFilter === 'clocked_in' ? null : 'clocked_in')}
            style={{
              background: statusFilter === 'clocked_in' ? '#d1fae5' : '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              border: statusFilter === 'clocked_in' ? '2px solid #10b981' : '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
              {statsLoading ? '...' : (stats?.clockedIn ?? 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Clocked In</div>
          </div>
          <div 
            onClick={() => setStatusFilter(statusFilter === 'clocked_out' ? null : 'clocked_out')}
            style={{
              background: statusFilter === 'clocked_out' ? '#dbeafe' : '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              border: statusFilter === 'clocked_out' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>
              {statsLoading ? '...' : (stats?.clockedOut ?? 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Clocked Out</div>
          </div>
          <div 
            onClick={() => setStatusFilter(statusFilter === 'on_break' ? null : 'on_break')}
            style={{
              background: statusFilter === 'on_break' ? '#fef3c7' : '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              border: statusFilter === 'on_break' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>
              {statsLoading ? '...' : (stats?.onBreak ?? 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>On a break</div>
          </div>
          <div 
            onClick={() => setStatusFilter(statusFilter === 'absent' ? null : 'absent')}
            style={{
              background: statusFilter === 'absent' ? '#fee2e2' : '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              border: statusFilter === 'absent' ? '2px solid #ef4444' : '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
              {statsLoading ? '...' : (employees.filter(e => e.status === 'absent' || !e.status).length)}
            </div>
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: '60px' }}>SI No.</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>VTID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>First Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Last Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Job Title</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedEmployees.length > 0 ? (
                displayedEmployees.map((employee, index) => (
                  <tr 
                    key={employee.id || employee._id || index} 
                    onClick={() => setSelectedEmployee(employee)}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      background: selectedEmployee?.id === employee.id ? '#f0f9ff' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedEmployee?.id !== employee.id) {
                        e.currentTarget.style.background = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedEmployee?.id !== employee.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                      {index + 1}
                    </td>
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
                      {employee.jobTitle || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {getStatusBadge(employee.status || 'absent')}
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
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  const { endBreak } = await import('../utils/clockApi');
                                  const response = await endBreak(employee.id || employee._id);
                                  if (response.success) {
                                    toast.success('Work resumed successfully');
                                    fetchData();
                                  }
                                } catch (error) {
                                  toast.error('Failed to resume work');
                                }
                              }}
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
                              Resume Work
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
                        ) : (
                          <button
                            onClick={() => openClockInModal(employee)}
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
                        <>
                        <button
                          onClick={() => handleEditEntry(employee)}
                        style={{
                          padding: '6px 12px',
                          background: '#ffffff',
                          color: '#3b82f6',
                          border: '1px solid #3b82f6',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                            fontWeight: '500'
                          }}
                            title="Edit time entry"
                        >
                            Edit
                            </button>
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
                              Delete
                            </button>
                          </>
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

      {/* Edit Time Entry Modal */}
      {showEditModal && editingEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
              Edit Time Entry - {editingEntry.name}
            </h2>
            <form onSubmit={handleUpdateTimeEntry}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Clock In Time
                  </label>
                  <input
                    type="time"
                    value={editForm.clockIn}
                    onChange={(e) => setEditForm({ ...editForm, clockIn: e.target.value })}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Clock Out Time
                  </label>
                  <input
                    type="time"
                    value={editForm.clockOut}
                    onChange={(e) => setEditForm({ ...editForm, clockOut: e.target.value })}
                    style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Clock-In Modal */}
      {showClockInModal && clockInEmployee && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '0',
            maxWidth: '520px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Header Image Section */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '48px 32px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Grid Pattern Background */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
                opacity: 0.3
              }}></div>
              
              {/* Placeholder for Image - Will be replaced */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    color: 'white',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 16px rgba(59, 130, 246, 0.4)'
                  }}>
                    {clockInEmployee.firstName?.[0]}{clockInEmployee.lastName?.[0]}
                  </div>
                  <div style={{
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '4px'
                    }}>
                      {clockInEmployee.firstName} {clockInEmployee.lastName}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      {clockInEmployee.department || 'Employee'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div style={{ padding: '32px' }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                Clock In Confirmation
              </h2>
              <p style={{
                fontSize: '15px',
                color: '#6b7280',
                textAlign: 'center',
                lineHeight: '1.6',
                marginBottom: '32px'
              }}>
                You are about to clock in <strong style={{ color: '#111827' }}>{clockInEmployee.firstName} {clockInEmployee.lastName}</strong>.
                <br />
                This action will be recorded with a timestamp.
              </p>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setShowClockInModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    background: '#ffffff',
                    color: '#374151',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f9fafb';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#ffffff';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClockIn}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
                  }}
                >
                  Confirm Clock In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Profile Modal */}
      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </>
  );
};

export default ClockIns;
