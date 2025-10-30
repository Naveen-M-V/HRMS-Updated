import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getTimeEntries, exportTimeEntries } from '../utils/clockApi';
import { assignShift } from '../utils/rotaApi';
import axios from 'axios';
import { buildApiUrl } from '../utils/apiConfig';
import LoadingScreen from '../components/LoadingScreen';

const TimeHistory = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEntries, setSelectedEntries] = useState([]);
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
  const [filters, setFilters] = useState({
    employeeSearch: '',
    locationSearch: '',
    dateRange: {
      start: getDefaultStartDate(),
      end: new Date().toISOString().split('T')[0]
    }
  });

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchTimeEntries();
    fetchEmployees();
  }, [filters.dateRange]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(buildApiUrl('/profiles'), { withCredentials: true });
      console.log('Raw profiles response:', response.data);
      
      if (response.data) {
        // Map all profiles, using userId if available, otherwise use _id
        const employeeList = response.data
          .filter(profile => profile.firstName && profile.lastName) // Only include profiles with names
          .map(profile => ({
            id: profile.userId || profile._id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            vtid: profile.vtid,
            hasUserId: !!profile.userId
          }));
        
        console.log('Fetched employees:', employeeList);
        console.log(`Total: ${employeeList.length}, With userId: ${employeeList.filter(e => e.hasUserId).length}, Without userId: ${employeeList.filter(e => !e.hasUserId).length}`);
        setEmployees(employeeList);
      }
    } catch (error) {
      console.error('Fetch employees error:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const fetchTimeEntries = async () => {
    setLoading(true);
    try {
      const response = await getTimeEntries(filters.dateRange.start, filters.dateRange.end);
      if (response.success) {
        setTimeEntries(response.data || []);
      } else {
        setTimeEntries([]);
      }
    } catch (error) {
      console.error('Fetch time entries error:', error);
      toast.error('Failed to fetch time entries');
      setTimeEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    
    if (!formData.employeeId || !formData.date) {
      toast.warning('Please fill in all required fields');
      return;
    }

    try {
      console.log('Assigning shift with data:', formData);
      const response = await assignShift(formData);
      if (response.success) {
        toast.success('Shift assigned successfully');
        setShowAssignModal(false);
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
        fetchTimeEntries();
      }
    } catch (error) {
      console.error('Assign shift error:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to assign shift');
    }
  };

  const handleSelectEntry = (entryId) => {
    setSelectedEntries(prev => {
      if (prev.includes(entryId)) {
        return prev.filter(id => id !== entryId);
      } else {
        return [...prev, entryId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedEntries.length === timeEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(timeEntries.map(entry => entry._id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedEntries.length === 0) {
      toast.warning('Please select entries to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedEntries.length} time ${selectedEntries.length === 1 ? 'entry' : 'entries'}?`)) {
      return;
    }

    try {
      const deletePromises = selectedEntries.map(entryId =>
        axios.delete(buildApiUrl(`/clock/entries/${entryId}`), { withCredentials: true })
      );
      
      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${selectedEntries.length} ${selectedEntries.length === 1 ? 'entry' : 'entries'}`);
      setSelectedEntries([]);
      fetchTimeEntries();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete entries');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvData = await exportTimeEntries(filters.dateRange.start, filters.dateRange.end);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `time-entries-${filters.dateRange.start}-to-${filters.dateRange.end}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Time entries exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export');
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
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

  const calculateShiftHours = (entry) => {
    if (!entry.shiftId || !entry.shiftId.startTime || !entry.shiftId.endTime) return '-';
    const start = new Date(`2000-01-01T${entry.shiftId.startTime}`);
    const end = new Date(`2000-01-01T${entry.shiftId.endTime}`);
    const hours = ((end - start) / (1000 * 60 * 60)).toFixed(2);
    return `${hours} hrs`;
  };

  const calculateTotalHours = (clockIn, clockOut, breaks = []) => {
    if (!clockIn || !clockOut) return '0 hrs';
    const start = new Date(`2000-01-01T${clockIn}`);
    const end = new Date(`2000-01-01T${clockOut}`);
    let totalMinutes = (end - start) / (1000 * 60);
    breaks.forEach(b => { if (b.duration) totalMinutes -= b.duration; });
    const hours = (totalMinutes / 60).toFixed(2);
    return `${hours} hrs`;
  };

  const filteredEntries = timeEntries.filter(entry => {
    const fullName = entry.employee ? `${entry.employee.firstName} ${entry.employee.lastName}`.toLowerCase() : '';
    const matchesEmployee = filters.employeeSearch === '' || fullName.includes(filters.employeeSearch.toLowerCase());
    const matchesLocation = filters.locationSearch === '' || entry.location?.toLowerCase().includes(filters.locationSearch.toLowerCase());
    return matchesEmployee && matchesLocation;
  });

  if (loading) return <LoadingScreen />;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              Time Entry History
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Last Updated: {new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour: '2-digit', minute: '2-digit', weekday: 'short', day: '2-digit', month: 'short' })}
            </p>
          </div>
          <button onClick={handleExportCSV} style={{ padding: '10px 20px', background: '#06b6d4', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
            Export to CSV
          </button>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Filter by employees</label>
              <input type="text" placeholder="Search Employees" value={filters.employeeSearch} onChange={(e) => setFilters(prev => ({ ...prev, employeeSearch: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Filter by locations</label>
              <input type="text" placeholder="Select Location" value={filters.locationSearch} onChange={(e) => setFilters(prev => ({ ...prev, locationSearch: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Start Date</label>
              <input type="date" value={filters.dateRange.start} onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
            </div>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>End Date</label>
              <input type="date" value={filters.dateRange.end} onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
            </div>
            <button onClick={() => setShowAssignModal(true)} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Assign Shift
            </button>
          </div>
        </div>

        {selectedEntries.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>
              {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'} selected
            </span>
            <button 
              onClick={handleDeleteSelected}
              style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            >
              Delete Selected
            </button>
          </div>
        )}

        <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedEntries.length === filteredEntries.length && filteredEntries.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Employee Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Clock In</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Clock Out</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Shift Hours</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Total Hours Worked</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry, index) => (
                  <tr key={entry._id || index} style={{ borderBottom: '1px solid #f3f4f6', background: selectedEntries.includes(entry._id) ? '#f0f9ff' : 'transparent' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedEntries.includes(entry._id)}
                        onChange={() => handleSelectEntry(entry._id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {entry.employee ? `${entry.employee.firstName} ${entry.employee.lastName}` : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      <div>{formatTime(entry.clockIn)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{formatDate(entry.date)}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      <div>{formatTime(entry.clockOut)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{formatDate(entry.date)}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827' }}>
                      {calculateShiftHours(entry)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                      {calculateTotalHours(entry.clockIn, entry.clockOut, entry.breaks)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>No Time Entries Found</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>Try adjusting your date range or filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>Assign New Shift</h2>
            <form onSubmit={handleAssignShift}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Employee <span style={{ color: '#dc2626' }}>*</span></label>
                <select value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} required style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} {emp.vtid ? `(${emp.vtid})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Date <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Start Time</label>
                  <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>End Time</label>
                  <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Location</label>
                <select value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="Office">Work From Office</option>
                  <option value="Home">Work From Home</option>
                  <option value="Field">Field</option>
                  <option value="Client Site">Client Site</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Work Type</label>
                <select value={formData.workType} onChange={(e) => setFormData({ ...formData, workType: e.target.value })} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="Regular">Regular</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Weekend overtime">Weekend Overtime</option>
                  <option value="Client side overtime">Client Side Overtime</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Assign Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TimeHistory;
