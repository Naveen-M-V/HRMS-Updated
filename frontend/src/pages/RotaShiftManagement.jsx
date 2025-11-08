import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  getAllShiftAssignments, 
  assignShift, 
  bulkCreateShifts, 
  updateShiftAssignment, 
  deleteShiftAssignment,
  requestShiftSwap, 
  approveShiftSwap, 
  getShiftStatistics 
} from '../utils/rotaApi';
import axios from 'axios';
import { buildApiUrl } from '../utils/apiConfig';
import LoadingScreen from '../components/LoadingScreen';
import { DatePicker } from '../components/ui/date-picker';
import MUITimePicker from '../components/MUITimePicker';
import ConfirmDialog from '../components/ConfirmDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import dayjs from 'dayjs';

const RotaShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [filters, setFilters] = useState({
    startDate: getMonday(new Date()).toISOString().split('T')[0],
    endDate: getFriday(new Date()).toISOString().split('T')[0],
    employeeId: '',
    location: 'all',
    workType: 'all',
    status: ''
  });
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    location: 'Office',
    workType: 'Regular',
    breakDuration: 60,
    notes: ''
  });

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function getFriday(date) {
    const monday = getMonday(date);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return friday;
  }

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching rota data...');
      
      // Fetch profiles instead of clock status for employee list
      const profilesResponse = await axios.get(
        buildApiUrl('/profiles'),
        { withCredentials: true }
      );
      
      const [shiftsRes, statsRes] = await Promise.all([
        getAllShiftAssignments(filters),
        getShiftStatistics(filters.startDate, filters.endDate)
      ]);
      
      console.log('📋 Profiles Response:', profilesResponse.data);
      console.log('📅 Shifts Response:', shiftsRes);
      
      if (shiftsRes.success) {
        console.log('📊 Shift details:', shiftsRes.data?.map(s => ({
          shiftId: s._id,
          employeeId: s.employeeId,
          employeeIdType: typeof s.employeeId,
          employeeIdIsObject: typeof s.employeeId === 'object',
          employeeIdKeys: s.employeeId ? Object.keys(s.employeeId) : null,
          hasFirstName: !!s.employeeId?.firstName,
          has_id: !!s.employeeId?._id,
          _id: s.employeeId?._id,
          firstName: s.employeeId?.firstName,
          lastName: s.employeeId?.lastName,
          role: s.employeeId?.role,
          employeeName: s.employeeId?.firstName ? `${s.employeeId.firstName} ${s.employeeId.lastName}` : 'N/A',
          rawEmployeeId: JSON.stringify(s.employeeId)
        })));
        setShifts(shiftsRes.data || []);
      }
      if (statsRes.success) setStatistics(statsRes.data);
      
      // Build comprehensive employee list from profiles AND shifts
      const employeeList = [];
      const employeeIds = new Set();
      
      // First, add all employees from profiles
      if (profilesResponse.data) {
        profilesResponse.data.forEach(profile => {
          const userId = profile.userId?._id || profile.userId || profile._id;
          const idString = typeof userId === 'object' ? userId.toString() : userId;
          
          if (!employeeIds.has(idString)) {
            employeeList.push({
              id: idString,
              _id: idString,
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
              role: profile.userId?.role || profile.role || 'employee',
              name: `${profile.firstName} ${profile.lastName}`
            });
            employeeIds.add(idString);
          }
        });
      }
      
      // Second, add any employees from shifts that aren't in profiles (e.g., admins without profiles)
      if (shiftsRes.success && shiftsRes.data) {
        console.log('🔍 Checking shifts for missing employees...');
        console.log('Total shifts to check:', shiftsRes.data.length);
        
        shiftsRes.data.forEach((shift, idx) => {
          console.log(`\n--- Checking shift ${idx + 1} ---`);
          console.log('shift.employeeId:', shift.employeeId);
          console.log('typeof:', typeof shift.employeeId);
          console.log('has firstName:', !!shift.employeeId?.firstName);
          
          if (shift.employeeId && typeof shift.employeeId === 'object' && shift.employeeId.firstName) {
            console.log('✓ Has employeeId object with firstName');
            
            // Extract the user ID - try multiple possible locations
            let userId;
            if (shift.employeeId._id) {
              userId = typeof shift.employeeId._id === 'object' ? shift.employeeId._id.toString() : shift.employeeId._id;
              console.log('✓ Found _id:', userId);
            } else if (shift.employeeId.id) {
              userId = typeof shift.employeeId.id === 'object' ? shift.employeeId.id.toString() : shift.employeeId.id;
              console.log('✓ Found id:', userId);
            } else {
              // If no _id or id field, the object itself might be the ID with firstName added
              console.warn(`⚠️ Shift ${idx} has employeeId object with firstName but no _id field:`, shift.employeeId);
              console.warn('Available keys:', Object.keys(shift.employeeId));
              return; // Skip this one
            }
            
            console.log('Checking if already in list:', employeeIds.has(userId));
            
            if (!employeeIds.has(userId)) {
              const newEmployee = {
                id: userId,
                _id: userId,
                firstName: shift.employeeId.firstName,
                lastName: shift.employeeId.lastName,
                email: shift.employeeId.email || '',
                role: shift.employeeId.role || 'employee',
                name: `${shift.employeeId.firstName} ${shift.employeeId.lastName}`
              };
              employeeList.push(newEmployee);
              employeeIds.add(userId);
              console.log('➕ Added employee from shift data:', newEmployee);
            } else {
              console.log(`ℹ️ Employee ${shift.employeeId.firstName} ${shift.employeeId.lastName} already in list (ID: ${userId})`);
            }
          } else {
            console.log('✗ Skipping - no valid employeeId object');
          }
        });
        
        console.log('\n=== Employee extraction complete ===');
      }
      
      console.log(`✅ Loaded ${employeeList.length} total employees (${profilesResponse.data?.length || 0} from profiles + ${employeeList.length - (profilesResponse.data?.length || 0)} from shifts)`);
      console.log('📋 Employee IDs:', employeeList.map(e => ({ name: e.name, id: e.id, role: e.role })));
      setEmployees(employeeList);
    } catch (error) {
      console.error('❌ Fetch data error:', error);
      toast.error(error.message || 'Failed to load data');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.date) {
      toast.warning('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Assigning shift with data:', formData);
      console.log('📤 Employee ID type:', typeof formData.employeeId);
      console.log('📤 Employee ID value:', formData.employeeId);
      
      const response = await assignShift(formData);
      console.log('📥 Assign shift response:', response);
      
      if (response.success) {
        toast.success('Shift assigned successfully');
        
        setShowModal(false);
        setFormData({
          employeeId: '',
          date: '',
          startTime: '09:00',
          endTime: '17:00',
          location: 'Office',
          workType: 'Regular',
          breakDuration: 60,
          notes: ''
        });
        
        // Refresh data immediately to show the new shift
        await fetchData();
      }
    } catch (error) {
      console.error('❌ Assign shift error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to assign shift';
      
      // Show conflict details if available
      if (error.response?.data?.conflicts && error.response.data.conflicts.length > 0) {
        const conflicts = error.response.data.conflicts;
        console.error('⚠️ Shift conflicts:', conflicts);
        
        // Show detailed conflict message
        toast.error(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{errorMsg}</div>
            <div style={{ fontSize: '12px' }}>
              {conflicts.map((c, i) => (
                <div key={i} style={{ marginTop: '4px' }}>
                  • {c.startTime} - {c.endTime} at {c.location}
                </div>
              ))}
            </div>
          </div>,
          { autoClose: 8000 }
        );
      } else {
        toast.error(errorMsg, { autoClose: 5000 });
      }
      
      // Show detailed error in console for debugging
      if (error.response?.data?.details) {
        console.error('Backend stack trace:', error.response.data.details);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShift = async () => {
    setLoading(true);
    try {
      const response = await deleteShiftAssignment(shiftToDelete);
      if (response.success) {
        toast.success('Shift deleted successfully');
        fetchData();
      }
    } catch (error) {
      console.error('Delete shift error:', error);
      toast.error(error.message || 'Failed to delete shift');
    } finally {
      setLoading(false);
    }
  };

  const getLocationColor = (location) => {
    const colors = {
      'Office': '#3b82f6',
      'Home': '#10b981',
      'Field': '#f59e0b',
      'Client Site': '#8b5cf6'
    };
    return colors[location] || '#6b7280';
  };

  /**
   * Format date to UK format: "Fri, 24 Oct 2025"
   */
  const formatUKDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      timeZone: "Europe/London",
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  /**
   * Format time to UK format: "09:03 AM"
   */
  const formatUKTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Scheduled': { bg: '#f3f4f6', text: '#374151', icon: '⚪' },
      'In Progress': { bg: '#d1fae5', text: '#065f46', icon: '🟢' },
      'On Break': { bg: '#fef3c7', text: '#92400e', icon: '🟡' },
      'Completed': { bg: '#dbeafe', text: '#1e40af', icon: '✅' },
      'Missed': { bg: '#fee2e2', text: '#991b1b', icon: '🔴' },
      'Swapped': { bg: '#fef3c7', text: '#92400e', icon: '🔄' },
      'Cancelled': { bg: '#f3f4f6', text: '#6b7280', icon: '⛔' }
    };
    const style = styles[status] || styles['Scheduled'];
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.text
      }}>
        {style.icon} {status}
      </span>
    );
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Date', 'Start Time', 'End Time', 'Location', 'Work Type', 'Status', 'Break (min)'];
    const rows = shifts.map(s => [
      `${s.employeeId?.firstName || ''} ${s.employeeId?.lastName || ''}`,
      new Date(s.date).toLocaleDateString(),
      s.startTime,
      s.endTime,
      s.location,
      s.workType,
      s.status,
      s.breakDuration
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shifts_${filters.startDate}_${filters.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  if (loading && shifts.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
            Rota & Shift Management
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Assign, manage, and track employee shift schedules
          </p>
        </div>

        {statistics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Shifts</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{statistics.totalShifts}</div>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Hours</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{statistics.totalHours}</div>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Employees</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{statistics.uniqueEmployees}</div>
            </div>
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Office</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>{statistics.byLocation.Office}</div>
            </div>
          </div>
        )}

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <DatePicker
                label="Start Date"
                value={filters.startDate || null}
                onChange={(date) => handleFilterChange('startDate', date ? date.format('YYYY-MM-DD') : '')}
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <DatePicker
                label="End Date"
                value={filters.endDate || null}
                onChange={(date) => handleFilterChange('endDate', date ? date.format('YYYY-MM-DD') : '')}
                minDate={filters.startDate || undefined}
              />
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Location
              </label>
              <Select
                value={filters.location}
                onValueChange={(value) => handleFilterChange('location', value)}
              >
                <SelectTrigger style={{ width: '100%', padding: '10px 12px' }}>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Field">Field</SelectItem>
                  <SelectItem value="Client Site">Client Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Work Type
              </label>
              <Select
                value={filters.workType}
                onValueChange={(value) => handleFilterChange('workType', value)}
              >
                <SelectTrigger style={{ width: '100%', padding: '10px 12px' }}>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Overtime">Overtime</SelectItem>
                  <SelectItem value="Weekend overtime">Weekend Overtime</SelectItem>
                  <SelectItem value="Client side overtime">Client Side Overtime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                }}
              >
                + Assign Shift
              </button>
              <button
                onClick={exportToCSV}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151', width: '60px' }}>SI No.</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Employee</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Scheduled Time</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Actual Time</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Location</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Work Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shifts.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                      No shifts found. Create your first shift assignment.
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift, index) => {
                    // Priority 1: Use populated employeeId from backend (includes firstName, lastName, role)
                    // Priority 2: Try to match with employees list
                    // Priority 3: Show 'Unassigned'
                    let employeeName = 'Unassigned';
                    
                    // Debug logging - show details for ALL shifts showing "Unassigned"
                    const shouldLog = index === 0 || !shift.employeeId || (typeof shift.employeeId === 'object' && !shift.employeeId?.firstName);
                    
                    if (shouldLog) {
                      console.log(`🔍 Rendering shift #${index + 1}:`, {
                        shiftId: shift._id,
                        date: shift.date,
                        employeeId: shift.employeeId,
                        employeeIdType: typeof shift.employeeId,
                        isObject: typeof shift.employeeId === 'object',
                        isNull: shift.employeeId === null,
                        hasFirstName: shift.employeeId?.firstName,
                        firstName: shift.employeeId?.firstName,
                        lastName: shift.employeeId?.lastName,
                        employeeIdKeys: shift.employeeId && typeof shift.employeeId === 'object' ? Object.keys(shift.employeeId) : null,
                        employeesListCount: employees.length,
                        rawEmployeeId: JSON.stringify(shift.employeeId)
                      });
                    }
                    
                    if (shift.employeeId) {
                      if (typeof shift.employeeId === 'object' && shift.employeeId !== null && shift.employeeId.firstName) {
                        // Backend populated the employeeId with user data
                        employeeName = `${shift.employeeId.firstName} ${shift.employeeId.lastName}`;
                        if (shouldLog) console.log('✅ Using populated data:', employeeName);
                      } else {
                        // employeeId is just an ID string or ObjectId, OR object without firstName
                        // Try to find in employees list
                        let employeeIdStr;
                        if (typeof shift.employeeId === 'object' && shift.employeeId !== null) {
                          // It's an object - try to get the ID
                          if (shift.employeeId._id) {
                            employeeIdStr = typeof shift.employeeId._id === 'object' ? 
                              shift.employeeId._id.toString() : shift.employeeId._id.toString();
                          } else if (shift.employeeId.id) {
                            employeeIdStr = typeof shift.employeeId.id === 'object' ? 
                              shift.employeeId.id.toString() : shift.employeeId.id.toString();
                          } else {
                            // Try to convert the whole object to string (it might be an ObjectId)
                            try {
                              employeeIdStr = shift.employeeId.toString();
                            } catch (e) {
                              console.error('Cannot convert employeeId to string:', shift.employeeId);
                              employeeIdStr = null;
                            }
                          }
                        } else {
                          // It's already a string
                          employeeIdStr = shift.employeeId?.toString();
                        }
                        
                        if (employeeIdStr) {
                          if (shouldLog) console.log('🔍 Looking for employee ID:', employeeIdStr, 'in list of', employees.length);
                          const employee = employees.find(emp => 
                            emp.id?.toString() === employeeIdStr || 
                            emp._id?.toString() === employeeIdStr
                          );
                          if (employee) {
                            employeeName = `${employee.firstName} ${employee.lastName}`;
                            if (shouldLog) console.log('✅ Found in employees list:', employeeName);
                          } else {
                            if (shouldLog) {
                              console.log('❌ Not found in employees list');
                              console.log('Searched for ID:', employeeIdStr);
                              console.log('Available employee IDs (first 10):', employees.slice(0, 10).map(e => ({ id: e.id, name: e.name })));
                            }
                          }
                        } else {
                          if (shouldLog) console.log('⚠️ Could not extract employee ID from:', shift.employeeId);
                        }
                      }
                    } else {
                      if (shouldLog) console.log('⚠️ Shift has no employeeId at all');
                    }
                    
                    return (
                    <tr key={shift._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                        {employeeName}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                        {formatUKDate(shift.date)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                        {formatUKTime(shift.startTime)} - {formatUKTime(shift.endTime)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                        {shift.actualStartTime || shift.actualEndTime ? (
                          <div>
                            <div>{shift.actualStartTime || '--:--'} - {shift.actualEndTime || '--:--'}</div>
                            {shift.status === 'In Progress' && (
                              <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>
                                ⏳ In progress
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#d1d5db' }}>Not started</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: getLocationColor(shift.location) + '20',
                          color: getLocationColor(shift.location)
                        }}>
                          {shift.location}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                        {shift.workType}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {getStatusBadge(shift.status)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => { setShiftToDelete(shift._id); setShowDeleteDialog(true); }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #fca5a5',
                            background: '#ffffff',
                            color: '#dc2626',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            zIndex: 51
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
              Assign New Shift
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Employee <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                  required
                >
                  <SelectTrigger style={{ width: '100%', padding: '12px' }}>
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {employees.map(emp => (
                      <SelectItem key={emp.id || emp._id} value={emp.id || emp._id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <DatePicker
                  label="Date"
                  required
                  value={formData.date ? dayjs(formData.date) : null}
                  onChange={(date) => setFormData({ ...formData, date: date ? date.format('YYYY-MM-DD') : '' })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <MUITimePicker
                    label="Start Time"
                    value={formData.startTime}
                    onChange={(time) => {
                      if (time) {
                        setFormData({ ...formData, startTime: time.format('HH:mm') });
                      } else {
                        setFormData({ ...formData, startTime: '' });
                      }
                    }}
                  />
                </div>
                <div>
                  <MUITimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={(time) => {
                      if (time) {
                        setFormData({ ...formData, endTime: time.format('HH:mm') });
                      } else {
                        setFormData({ ...formData, endTime: '' });
                      }
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Location
                </label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger style={{ width: '100%', padding: '12px' }}>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="Office">Work From Office</SelectItem>
                    <SelectItem value="Home">Work From Home</SelectItem>
                    <SelectItem value="Field">Field</SelectItem>
                    <SelectItem value="Client Site">Client Site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Work Type
                </label>
                <Select
                  value={formData.workType}
                  onValueChange={(value) => setFormData({ ...formData, workType: value })}
                >
                  <SelectTrigger style={{ width: '100%', padding: '12px' }}>
                    <SelectValue placeholder="Select work type" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Overtime">Overtime</SelectItem>
                    <SelectItem value="Weekend overtime">Weekend Overtime</SelectItem>
                    <SelectItem value="Client side overtime">Client Side Overtime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Break Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.breakDuration}
                  onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: loading ? '#9ca3af' : '#3b82f6',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Assigning...' : 'Assign Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Shift Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Shift"
        description="Are you sure you want to delete this shift? This action cannot be undone."
        onConfirm={handleDeleteShift}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
};

export default RotaShiftManagement;
