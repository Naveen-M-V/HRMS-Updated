import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getClockStatus, clockIn, clockOut, changeEmployeeStatus, getDashboardStats, setOnBreak, deleteTimeEntry, userClockIn, userClockOut, userStartBreak } from '../utils/clockApi';
import LoadingScreen from '../components/LoadingScreen';
import EmployeeTimesheetModal from '../components/EmployeeTimesheetModal';
import MUIDatePicker from '../components/MUIDatePicker';
import MUITimePicker from '../components/MUITimePicker';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

/**
 * Clock-ins Page
 * Shows detailed employee list with clock in/out functionality
 * NO DEMO DATA - All data from backend with proper error handling
 */

const ClockIns = () => {
  const { user: currentUser } = useAuth();
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
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds for real-time sync with user dashboard
    // This ensures admin sees clock-ins from users immediately
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmployeeDropdown && !event.target.closest('.employee-search-container')) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmployeeDropdown]);

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching clock-ins data...');
      setStatsLoading(true);
      
      // Fetch profiles, clock status, and stats in parallel
      const [profilesRes, clockStatusRes, statsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'https://talentshield.co.uk'}/api/profiles`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        }).then(res => res.json()),
        getClockStatus({ includeAdmins: true }),
        getDashboardStats()
      ]);
      
      console.log('👥 Profiles Response:', profilesRes);
      console.log('⏰ Clock Status Response:', clockStatusRes);
      console.log('📊 Stats Response:', statsRes);
      
      // Merge profile data with clock status
      if (Array.isArray(profilesRes) && clockStatusRes.success) {
        const clockStatusMap = new Map();
        const clockStatusByEmail = new Map();
        
        (clockStatusRes.data || []).forEach(emp => {
          const userId = emp.id || emp._id;
          clockStatusMap.set(userId, emp);
          
          // Also index by email for fallback matching
          if (emp.email) {
            clockStatusByEmail.set(emp.email, emp);
          }
        });
        
        // Merge profiles with their clock status
        const mergedData = profilesRes.map((profile, index) => {
          // Try multiple ways to get the user ID - CRITICAL for clock operations
          const userId = profile.userId?._id || profile.userId || profile._id;
          const email = profile.email || profile.userId?.email;
          
          // Try to find clock status by userId first, then by email as fallback
          let clockStatus = clockStatusMap.get(userId);
          
          // If no clock status found by userId, try to find by email
          if (!clockStatus && email) {
            clockStatus = clockStatusByEmail.get(email);
          }
          
          // Default to empty object if still not found
          clockStatus = clockStatus || {};
          
          // Debug logging for first few employees
          if (index < 5) {
            console.log(`🔍 Employee ${index} - Merged Data:`, {
              firstName: profile.firstName,
              lastName: profile.lastName,
              userId: profile.userId,
              profileId: profile._id,
              extractedUserId: userId,
              email: email,
              clockStatus: clockStatus.status,
              timeEntryId: clockStatus.timeEntryId,
              hasClockStatus: !!clockStatus.status
            });
          }
          
          if (!userId) {
            console.warn(`⚠️ Missing userId for profile:`, profile);
          }
          
          return {
            id: userId, // CRITICAL: This is the user account ID used for clock operations
            _id: userId, // Duplicate for compatibility
            profileId: profile._id, // Keep the original profile ID
            firstName: profile.firstName,
            lastName: profile.lastName,
            name: `${profile.firstName} ${profile.lastName}`,
            email: email,
            department: profile.department || '-',
            vtid: profile.vtid || '-',
            jobTitle: profile.jobTitle || profile.role || '-',
            jobRole: profile.jobTitle || profile.role || '-',
            profilePicture: profile.profilePicture || null,
            role: profile.userId?.role || 'employee',
            company: profile.company || '-',
            staffType: profile.staffType || '-',
            poc: profile.poc || '-',
            // Clock status data - CRITICAL for button functionality
            status: clockStatus.status || 'absent',
            clockIn: clockStatus.clockIn || null,
            clockOut: clockStatus.clockOut || null,
            location: clockStatus.location || null,
            workType: clockStatus.workType || null,
            timeEntryId: clockStatus.timeEntryId || null, // CRITICAL: Required for edit/delete operations
            leaveType: clockStatus.leaveType || null,
            leaveReason: clockStatus.leaveReason || null
          };
        });
        
        console.log(`✅ Merged ${mergedData.length} profiles with clock status`);
        setEmployees(mergedData);
        
        // Calculate stats from merged data if dashboard API fails
        if (!statsRes.success) {
          calculateStatsFromEmployees(mergedData);
        }
      } else {
        console.warn('⚠️ Profile or clock status fetch failed');
        setEmployees([]);
        setStats({ clockedIn: 0, onBreak: 0, clockedOut: 0, total: 0 });
      }
      
      if (statsRes.success && statsRes.data) {
        console.log('✅ Stats loaded from API:', statsRes.data);
        setStats(statsRes.data);
        setStatsLoading(false);
      } else {
        console.warn('⚠️ Stats fetch failed, calculating from employee list');
        calculateStatsFromEmployees(employees);
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
    // Filter only today's data for live status
    const today = new Date().toISOString().split('T')[0];
    const todayEmployees = employeeList.filter(e => {
      if (!e.clockIn) return false;
      const clockInDate = new Date(e.clockIn).toISOString().split('T')[0];
      return clockInDate === today;
    });
    
    const calculated = {
      clockedIn: todayEmployees.filter(e => e.status === 'clocked_in').length,
      onBreak: todayEmployees.filter(e => e.status === 'on_break').length,
      clockedOut: todayEmployees.filter(e => e.status === 'clocked_out').length,
      absent: employeeList.length - todayEmployees.length,
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
    if (!clockInEmployee) {
      toast.error('No employee selected');
      return;
    }
    
    const employeeId = clockInEmployee.id || clockInEmployee._id;
    const isAdmin = clockInEmployee.role === 'admin';
    const isCurrentUser = currentUser?.email === clockInEmployee.email;
    
    console.log('🔍 Clock In Debug - Full Employee Object:', clockInEmployee);
    console.log('Clock In - Employee ID:', employeeId);
    console.log('Clock In - Is Admin:', isAdmin);
    console.log('Clock In - Is Current User:', isCurrentUser);
    console.log('Employee ID type:', typeof employeeId);
    
    if (!employeeId) {
      console.error('❌ Employee ID is undefined! Employee object:', clockInEmployee);
      toast.error('Invalid employee data. Please refresh and try again.');
      setShowClockInModal(false);
      return;
    }
    
    setShowClockInModal(false);

    // Optimistic update
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => 
        (emp.id === employeeId || emp._id === employeeId) 
          ? { ...emp, status: 'clocked_in' }
          : emp
      )
    );

    try {
      let response;
      
      // If clocking in yourself (current user), use userClockIn
      // Otherwise, use admin clockIn to clock in another employee
      if (isCurrentUser) {
        console.log('📤 Using userClockIn (self clock-in)');
        response = await userClockIn({ 
          location: 'Work From Office', 
          workType: 'Regular' 
        });
      } else {
        console.log('📤 Using clockIn (admin clocking in employee)');
        const payload = { employeeId };
        console.log('📤 Sending clock in request:', payload);
        response = await clockIn(payload);
      }
      
      console.log('📥 Clock in response:', response);
      
      if (response.success) {
        toast.success(isCurrentUser ? 'You have clocked in successfully' : 'Employee clocked in successfully');
        await fetchData();
        // Update selected employee status
        setSelectedEmployee(prev => prev ? { ...prev, status: 'clocked_in' } : null);
      } else {
        toast.error(response.message || 'Failed to clock in');
        await fetchData(); // Revert on failure
      }
    } catch (error) {
      console.error('❌ Clock in error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to clock in');
      await fetchData(); // Revert on error
    }
  };

  const handleClockOut = async (employeeId) => {
    if (!employeeId) {
      toast.error('Invalid employee ID');
      return;
    }

    // Find the employee to check if it's the current user
    const employee = employees.find(emp => emp.id === employeeId || emp._id === employeeId);
    const isCurrentUser = currentUser?.email === employee?.email;

    console.log('🔍 Clock Out - Employee ID:', employeeId);
    console.log('🔍 Clock Out - Is Current User:', isCurrentUser);

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
      let response;
      
      // If clocking out yourself, use userClockOut
      if (isCurrentUser) {
        console.log('📤 Using userClockOut (self clock-out)');
        console.log('Current user email:', currentUser?.email);
        console.log('Employee email:', employee?.email);
        response = await userClockOut();
      } else {
        console.log('📤 Using clockOut (admin clocking out employee)');
        console.log('Employee ID being sent:', employeeId);
        response = await clockOut({ employeeId });
      }
      
      console.log('📥 Clock out response:', response);
      
      if (response.success) {
        toast.success(isCurrentUser ? 'You have clocked out successfully' : 'Employee clocked out successfully');
        await fetchData();
      } else {
        toast.error(response.message || 'Failed to clock out');
        await fetchData(); // Revert on failure
      }
    } catch (error) {
      console.error('❌ Clock out error:', error);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error response status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to clock out';
      toast.error(`Clock out failed: ${errorMessage}`);
      await fetchData(); // Revert on error
    }
  };

  const handleOnBreak = async (employeeId) => {
    if (!employeeId) {
      toast.error('Invalid employee ID');
      return;
    }

    // Find the employee to check if it's the current user
    const employee = employees.find(emp => emp.id === employeeId || emp._id === employeeId);
    const isCurrentUser = currentUser?.email === employee?.email;

    console.log('🔍 On Break - Employee ID:', employeeId);
    console.log('🔍 On Break - Is Current User:', isCurrentUser);

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
      let response;
      
      // If setting yourself on break, use userStartBreak
      if (isCurrentUser) {
        console.log('📤 Using userStartBreak (self break)');
        response = await userStartBreak();
      } else {
        console.log('📤 Using setOnBreak (admin setting employee on break)');
        response = await setOnBreak(employeeId);
      }
      
      if (response.success) {
        toast.success(isCurrentUser ? 'You are now on break' : 'Employee is now on break');
        await fetchData(); // Force refresh
      } else {
        toast.error(response.message || 'Failed to set on break');
        await fetchData(); // Revert on failure
      }
    } catch (error) {
      console.error('❌ Set on break error:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to set on break');
      await fetchData(); // Revert on error
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
        await fetchData();
      } else {
        toast.error(response.message || 'Failed to change status');
        // Revert optimistic update on failure
        await fetchData();
      }
    } catch (error) {
      console.error('Status change error:', error);
      toast.error(error.message || 'Failed to change status');
      // Revert optimistic update on error
      await fetchData();
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
        // Force immediate refresh
        await fetchData();
        // Clear any selected employee
        setSelectedEmployee(null);
      } else {
        toast.error(response.message || 'Failed to delete time entry');
        // Still refresh to sync with backend
        await fetchData();
      }
    } catch (error) {
      console.error('Delete time entry error:', error);
      toast.error(error.message || 'Failed to delete time entry');
      // Refresh even on error to sync state
      await fetchData();
    }
  };

  const handleEditEntry = (employee) => {
    console.log('🔍 Edit Entry - Employee:', {
      id: employee.id,
      _id: employee._id,
      timeEntryId: employee.timeEntryId,
      fullObject: employee
    });

    if (!employee.timeEntryId) {
      toast.error('No time entry to edit. Employee must be clocked in first.');
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
            {/* Searchable Employee Input */}
            <div className="employee-search-container" style={{ position: 'relative', minWidth: '250px' }}>
              <input
                type="text"
                placeholder="Search employee to clock in..."
                value={employeeSearchTerm}
                onChange={(e) => {
                  setEmployeeSearchTerm(e.target.value);
                  setShowEmployeeDropdown(true);
                }}
                onFocus={() => setShowEmployeeDropdown(true)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              />
              {showEmployeeDropdown && employeeSearchTerm && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  background: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000
                }}>
                  {employees
                    .filter(emp => {
                      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
                      const search = employeeSearchTerm.toLowerCase();
                      return fullName.includes(search) || 
                             emp.email?.toLowerCase().includes(search) ||
                             emp.vtid?.toString().includes(search);
                    })
                    .slice(0, 10)
                    .map(emp => (
                      <div
                        key={emp.id || emp._id}
                        onClick={() => {
                          console.log('🎯 Selected employee from dropdown:', {
                            id: emp.id,
                            _id: emp._id,
                            firstName: emp.firstName,
                            lastName: emp.lastName,
                            fullObject: emp
                          });
                          setSelectedEmployee(emp);
                          setEmployeeSearchTerm(`${emp.firstName} ${emp.lastName}`);
                          setShowEmployeeDropdown(false);
                        }}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                      >
                        <div style={{ fontWeight: '500', fontSize: '14px', color: '#111827' }}>
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {emp.email} • {emp.vtid || 'No VTID'}
                        </div>
                      </div>
                    ))}
                  {employees.filter(emp => {
                    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
                    const search = employeeSearchTerm.toLowerCase();
                    return fullName.includes(search) || 
                           emp.email?.toLowerCase().includes(search) ||
                           emp.vtid?.toString().includes(search);
                  }).length === 0 && (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      No employees found
                    </div>
                  )}
                </div>
              )}
            </div>
            
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
                  console.log('🔘 Clock In button clicked. Selected employee:', {
                    id: selectedEmployee?.id,
                    _id: selectedEmployee?._id,
                    firstName: selectedEmployee?.firstName,
                    lastName: selectedEmployee?.lastName,
                    fullObject: selectedEmployee
                  });
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
                setStatusFilter(null);
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
                    onClick={() => {
                      console.log('🔍 Opening timesheet for employee:', {
                        id: employee.id,
                        _id: employee._id,
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        email: employee.email,
                        status: employee.status,
                        timeEntryId: employee.timeEntryId,
                        fullEmployee: employee
                      });
                      setSelectedEmployee(employee);
                      setShowTimesheetModal(true);
                    }}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {employee.firstName || '-'}
                        {currentUser?.email === employee.email && (
                          <span style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            letterSpacing: '0.5px'
                          }}>
                            ME
                          </span>
                        )}
                      </div>
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
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                        {employee.status === 'clocked_in' ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOnBreak(employee.id || employee._id);
                              }}
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
                              onClick={async (e) => {
                                e.stopPropagation();
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
                            onClick={(e) => {
                              e.stopPropagation();
                              openClockInModal(employee);
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
                            Clock In
                          </button>
                        )}
                        {/* Delete Button - Only show if employee has a time entry */}
                        {employee.timeEntryId && (
                        <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEntry(employee);
                          }}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTimeEntry(employee.timeEntryId, employee.name);
                              }}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'visible', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
              Edit Time Entry - {editingEntry.firstName} {editingEntry.lastName}
            </h2>
            <form onSubmit={handleUpdateTimeEntry}>
              <div style={{ marginBottom: '24px' }}>
                <MUIDatePicker
                  label="Date"
                  value={editForm.date || null}
                  onChange={(date) => setEditForm({ ...editForm, date: date ? date.format('YYYY-MM-DD') : '' })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div>
                  <MUITimePicker
                    label="Clock In Time"
                    value={editForm.clockIn}
                    onChange={(time) => setEditForm({ ...editForm, clockIn: time ? time.format('HH:mm') : '' })}
                    required
                  />
                </div>
                <div>
                  <MUITimePicker
                    label="Clock Out Time"
                    value={editForm.clockOut}
                    onChange={(time) => setEditForm({ ...editForm, clockOut: time ? time.format('HH:mm') : '' })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.target.style.background = '#ffffff'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '12px 28px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)' }}
                  onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
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

      {/* Employee Timesheet Modal */}
      {selectedEmployee && showTimesheetModal && (
        <EmployeeTimesheetModal
          employee={selectedEmployee}
          onClose={() => {
            setSelectedEmployee(null);
            setShowTimesheetModal(false);
          }}
        />
      )}
    </>
  );
};

export default ClockIns;
