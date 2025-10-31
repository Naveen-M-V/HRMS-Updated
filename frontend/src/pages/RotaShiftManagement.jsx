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
import MUIDatePicker from '../components/MUIDatePicker';
import MUITimePicker from '../components/MUITimePicker';

const RotaShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({
    startDate: getMonday(new Date()).toISOString().split('T')[0],
    endDate: getFriday(new Date()).toISOString().split('T')[0],
    employeeId: '',
    location: '',
    workType: '',
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
      
      if (shiftsRes.success) setShifts(shiftsRes.data || []);
      if (statsRes.success) setStatistics(statsRes.data);
      
      // Map profiles to employee format
      if (profilesResponse.data) {
        const employeeList = profilesResponse.data.map(profile => {
          // Ensure we get a string ID, not an object
          const userId = profile.userId?._id || profile.userId || profile._id;
          const idString = typeof userId === 'object' ? userId.toString() : userId;
          
          return {
            id: idString,
            _id: idString,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            name: `${profile.firstName} ${profile.lastName}`
          };
        });
        console.log(`✅ Loaded ${employeeList.length} employees from profiles`);
        console.log('📋 Employee IDs:', employeeList.map(e => ({ name: e.name, id: e.id, type: typeof e.id })));
        setEmployees(employeeList);
      }
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
        fetchData();
      }
    } catch (error) {
      console.error('❌ Assign shift error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to assign shift';
      toast.error(`Failed to assign shift: ${errorMsg}`);
      
      // Show detailed error in console for debugging
      if (error.response?.data?.details) {
        console.error('Backend stack trace:', error.response.data.details);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;

    setLoading(true);
    try {
      const response = await deleteShiftAssignment(shiftId);
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
              <MUIDatePicker
                label="Start Date"
                value={filters.startDate ? new Date(filters.startDate) : null}
                onChange={(date) => handleFilterChange('startDate', date ? date.toISOString().split('T')[0] : '')}
              />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <MUIDatePicker
                label="End Date"
                value={filters.endDate ? new Date(filters.endDate) : null}
                onChange={(date) => handleFilterChange('endDate', date ? date.toISOString().split('T')[0] : '')}
                minDate={filters.startDate ? new Date(filters.startDate) : undefined}
              />
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Locations</option>
                <option value="Office">Office</option>
                <option value="Home">Home</option>
                <option value="Field">Field</option>
                <option value="Client Site">Client Site</option>
              </select>
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Work Type
              </label>
              <select
                value={filters.workType}
                onChange={(e) => handleFilterChange('workType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Types</option>
                <option value="Regular">Regular</option>
                <option value="Overtime">Overtime</option>
                <option value="Weekend overtime">Weekend Overtime</option>
                <option value="Client side overtime">Client Side Overtime</option>
              </select>
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
                    <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                      No shifts found. Create your first shift assignment.
                    </td>
                  </tr>
                ) : (
                  shifts.map((shift) => (
                    <tr key={shift._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                        {shift.employeeId?.firstName} {shift.employeeId?.lastName}
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
                          onClick={() => handleDeleteShift(shift._id)}
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
                  ))
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
          zIndex: 9999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
              Assign New Shift
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Employee <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id || emp._id} value={emp.id || emp._id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <MUIDatePicker
                  label="Date *"
                  value={formData.date ? new Date(formData.date) : null}
                  onChange={(date) => setFormData({ ...formData, date: date ? date.toISOString().split('T')[0] : '' })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <MUITimePicker
                    label="Start Time"
                    value={formData.startTime ? new Date(`2000-01-01T${formData.startTime}`) : null}
                    onChange={(time) => {
                      if (time) {
                        const hours = time.getHours().toString().padStart(2, '0');
                        const minutes = time.getMinutes().toString().padStart(2, '0');
                        setFormData({ ...formData, startTime: `${hours}:${minutes}` });
                      } else {
                        setFormData({ ...formData, startTime: '' });
                      }
                    }}
                    orientation="landscape"
                  />
                </div>
                <div>
                  <MUITimePicker
                    label="End Time"
                    value={formData.endTime ? new Date(`2000-01-01T${formData.endTime}`) : null}
                    onChange={(time) => {
                      if (time) {
                        const hours = time.getHours().toString().padStart(2, '0');
                        const minutes = time.getMinutes().toString().padStart(2, '0');
                        setFormData({ ...formData, endTime: `${hours}:${minutes}` });
                      } else {
                        setFormData({ ...formData, endTime: '' });
                      }
                    }}
                    orientation="landscape"
                  />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Location
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Office">Work From Office</option>
                  <option value="Home">Work From Home</option>
                  <option value="Field">Field</option>
                  <option value="Client Site">Client Site</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Work Type
                </label>
                <select
                  value={formData.workType}
                  onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="Regular">Regular</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Weekend overtime">Weekend Overtime</option>
                  <option value="Client side overtime">Client Side Overtime</option>
                </select>
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
    </>
  );
};

export default RotaShiftManagement;
