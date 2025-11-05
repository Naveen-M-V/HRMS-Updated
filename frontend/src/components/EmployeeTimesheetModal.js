import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PrinterIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { buildApiUrl } from '../utils/apiConfig';
import MUIDatePicker from './MUIDatePicker';
import MUITimePicker from './MUITimePicker';
import dayjs from 'dayjs';
import moment from 'moment-timezone';
import axios from 'axios';
import { updateTimeEntry, deleteTimeEntry, addTimeEntry } from '../utils/clockApi';
import { toast } from 'react-toastify';

const EmployeeTimesheetModal = ({ employee, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekData, setWeekData] = useState([]);
  const [statistics, setStatistics] = useState({
    hoursWorked: 0,
    overtime: 0,
    negativeHours: 0
  });
  const [loading, setLoading] = useState(false);
  const [weeklyTotalHours, setWeeklyTotalHours] = useState(0);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    date: null,
    clockIn: null,
    clockOut: null
  });

  useEffect(() => {
    if (employee) {
      console.log('Employee data in modal:', employee);
      fetchWeeklyTimesheet();
    }
  }, [employee, currentDate]);

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const fetchWeeklyTimesheet = async () => {
    setLoading(true);
    try {
      const monday = getMonday(currentDate);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const employeeId = employee._id || employee.id;
      console.log('📋 Fetching timesheet for employee:', {
        employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role,
        fullEmployee: employee
      });

      const response = await axios.get(
        buildApiUrl(`/clock/timesheet/${employeeId}?startDate=${monday.toISOString().split('T')[0]}&endDate=${sunday.toISOString().split('T')[0]}`),
        { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );

      console.log('📥 Timesheet API response:', response.data);
      console.log('📥 Response entries count:', response.data?.entries?.length || 0);
      console.log('📥 Response entries:', response.data?.entries);

      if (response.data && response.data.success) {
        console.log('✅ Timesheet data received:', response.data);
        if (response.data.entries && response.data.entries.length > 0) {
          console.log('✅ Processing', response.data.entries.length, 'time entries');
          processTimesheetData(response.data);
        } else {
          console.warn('⚠️ No time entries in response, generating empty week');
          generateEmptyWeek();
        }
      } else {
        console.warn('⚠️ No timesheet data or unsuccessful response, generating empty week');
        console.warn('Response success:', response.data?.success);
        console.warn('Response message:', response.data?.message);
        generateEmptyWeek();
      }
    } catch (error) {
      console.error('❌ Error fetching timesheet:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 401) {
        console.error('Unauthorized - user may need to log in again');
      } else if (error.response?.status === 404) {
        console.error('Timesheet endpoint not found or employee not found');
      }
      generateEmptyWeek();
    } finally {
      setLoading(false);
    }
  };

  const generateEmptyWeek = () => {
    const monday = getMonday(currentDate);
    const emptyWeek = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      emptyWeek.push({
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate().toString().padStart(2, '0'),
        clockedHours: null,
        location: '--',
        overtime: '--',
        totalHours: '00:00',
        isWeekend: isWeekend
      });
    }
    setWeekData(emptyWeek);
    setStatistics({ hoursWorked: 0, overtime: 0, negativeHours: 0 });
    setWeeklyTotalHours(0);
  };

  const processTimesheetData = (data) => {
    const monday = getMonday(currentDate);
    const weekEntries = [];
    let weeklyTotalHoursSum = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const dayEntry = data.entries?.find(e => {
        const entryDate = moment.utc(e.date).tz('Europe/London').format('YYYY-MM-DD');
        return entryDate === dateStr;
      });

      if (dayEntry && dayEntry.clockIn) {
        const clockIn = dayEntry.clockIn;
        const clockOut = dayEntry.clockOut;
        
        // Parse hours from backend calculation
        const hours = parseFloat(dayEntry.hoursWorked || 0);
        const overtime = parseFloat(dayEntry.overtime || 0);
        
        // Add to weekly total
        weeklyTotalHoursSum += hours;

        // Format clock in/out times - handle both HH:mm string and ISO date formats
        const formatTime = (timeValue) => {
          if (!timeValue) return 'N/A';
          
          // If it's already in HH:mm format, return as is
          if (typeof timeValue === 'string' && /^\d{2}:\d{2}$/.test(timeValue)) {
            return timeValue;
          }
          
          // If it's an ISO date string or Date object, convert to UK time
          try {
            const date = new Date(timeValue);
            if (isNaN(date.getTime())) {
              return timeValue; // Return original if invalid
            }
            return date.toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false,
              timeZone: 'Europe/London'
            });
          } catch (e) {
            console.error('Error formatting time:', e);
            return timeValue;
          }
        };

        const clockInTime = formatTime(clockIn);
        const clockOutTime = clockOut ? formatTime(clockOut) : 'Present';

        // Calculate break time display
        let breakInfo = '';
        if (dayEntry.breaks && dayEntry.breaks.length > 0) {
          const totalBreakMinutes = dayEntry.breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
          if (totalBreakMinutes > 0) {
            const breakHours = Math.floor(totalBreakMinutes / 60);
            const breakMins = totalBreakMinutes % 60;
            breakInfo = ` (Break: ${breakHours}h ${breakMins}m)`;
          }
        }

        weekEntries.push({
          entryId: dayEntry._id || dayEntry.id,
          date: date,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate().toString().padStart(2, '0'),
          clockedHours: `${clockInTime} - ${clockOutTime}${breakInfo}`,
          clockIn: clockIn,
          clockOut: clockOut,
          breaks: dayEntry.breaks || [], // Add breaks data for timeline visualization
          location: dayEntry.location || 'N/A',
          overtime: overtime > 0 ? formatHours(overtime) : '--',
          totalHours: formatHours(hours),
          workType: dayEntry.workType || 'Regular',
          isWeekend: isWeekend,
          // GPS location data for admin view
          gpsLocation: dayEntry.gpsLocation || null
        });
      } else {
        weekEntries.push({
          entryId: `absent-${dateStr}`, // Unique ID for absent days
          date: date,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate().toString().padStart(2, '0'),
          clockedHours: null,
          location: '--',
          overtime: '--',
          totalHours: '00:00',
          workType: null,
          isWeekend: isWeekend,
          isAbsent: true // Flag to identify absent entries
        });
      }
    }

    setWeekData(weekEntries);
    setWeeklyTotalHours(weeklyTotalHoursSum);
    
    // Use statistics from backend if available
    if (data.statistics) {
      setStatistics({
        hoursWorked: parseFloat(data.statistics.totalHoursWorked || 0).toFixed(2),
        overtime: parseFloat(data.statistics.totalOvertime || 0).toFixed(2),
        negativeHours: parseFloat(data.statistics.totalNegativeHours || 0).toFixed(2)
      });
    } else {
      setStatistics({
        hoursWorked: weeklyTotalHoursSum.toFixed(2),
        overtime: 0,
        negativeHours: 0
      });
    }
  };

  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const formatDateRange = () => {
    const monday = getMonday(currentDate);
    return monday.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  };

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allEntryIds = weekData
        .filter(day => day.entryId)
        .map(day => day.entryId);
      setSelectedEntries(new Set(allEntryIds));
    } else {
      setSelectedEntries(new Set());
    }
  };

  const handleSelectEntry = (entryId) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  // Edit handler
  const handleEditEntry = (day) => {
    // Allow editing even for absent entries (to create new time entries)
    setEditingEntry(day);
    setEditForm({
      date: dayjs(day.date),
      clockIn: day.clockIn ? dayjs(day.clockIn, 'HH:mm') : dayjs().hour(9).minute(0),
      clockOut: day.clockOut ? dayjs(day.clockOut, 'HH:mm') : dayjs().hour(17).minute(0)
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !editForm.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!editForm.clockIn) {
      toast.error('Clock in time is required');
      return;
    }

    try {
      const timeData = {
        date: editForm.date.format('YYYY-MM-DD'),
        clockIn: editForm.clockIn.format('HH:mm'),
        clockOut: editForm.clockOut ? editForm.clockOut.format('HH:mm') : null
      };

      let response;
      
      // Check if this is an absent entry (no existing time entry)
      if (editingEntry.isAbsent || !editingEntry.entryId || editingEntry.entryId.startsWith('absent-')) {
        // Create new time entry
        const newEntryData = {
          ...timeData,
          employeeId: employee._id || employee.id,
          location: 'Office',
          workType: 'Regular'
        };
        console.log('Creating new time entry:', newEntryData);
        response = await addTimeEntry(newEntryData);
        
        if (response.success) {
          toast.success('Time entry created successfully');
        }
      } else {
        // Update existing time entry
        console.log('Updating time entry:', editingEntry.entryId, timeData);
        response = await updateTimeEntry(editingEntry.entryId, timeData);
        
        if (response.success) {
          toast.success('Time entry updated successfully');
        }
      }
      
      if (response.success) {
        setShowEditModal(false);
        setEditingEntry(null);
        fetchWeeklyTimesheet(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save entry');
    }
  };

  // Delete handlers
  const handleDeleteEntry = async (entryId) => {
    // Don't delete absent entries
    if (entryId.startsWith('absent-')) {
      toast.warning('Cannot delete absent entries');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this time entry?')) {
      return;
    }

    try {
      const response = await deleteTimeEntry(entryId);
      
      if (response.success) {
        toast.success('Time entry deleted successfully');
        fetchWeeklyTimesheet(); // Refresh data
        setSelectedEntries(new Set()); // Clear selection
      } else {
        toast.error(response.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error(error.message || 'Failed to delete entry');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) {
      toast.warning('Please select entries to delete');
      return;
    }

    // Filter out absent entries (those starting with 'absent-')
    const validEntries = Array.from(selectedEntries).filter(id => !id.startsWith('absent-'));
    
    if (validEntries.length === 0) {
      toast.warning('Cannot delete absent entries. Please select actual time entries.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${validEntries.length} selected entries?`)) {
      return;
    }

    try {
      const deletePromises = validEntries.map(entryId => 
        deleteTimeEntry(entryId)
      );
      
      await Promise.all(deletePromises);
      
      toast.success(`${validEntries.length} entries deleted successfully`);
      fetchWeeklyTimesheet(); // Refresh data
      setSelectedEntries(new Set()); // Clear selection
    } catch (error) {
      console.error('Error deleting entries:', error);
      toast.error('Failed to delete some entries');
    }
  };

  const exportToExcel = () => {
    // Create CSV content
    const monday = getMonday(currentDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    let csvContent = `Timesheet Report\n`;
    csvContent += `Employee: ${employee.firstName} ${employee.lastName}\n`;
    csvContent += `Period: ${monday.toLocaleDateString('en-GB')} - ${sunday.toLocaleDateString('en-GB')}\n`;
    csvContent += `Week ${getWeekNumber(currentDate)}\n\n`;
    
    // Headers
    csvContent += `Date,Clocked Hours,Location,Overtime,Total Hours\n`;
    
    // Data rows
    weekData.forEach(day => {
      const date = `${day.dayName} ${day.dayNumber}`;
      const clockedHours = day.clockedHours || 'N/A';
      const location = day.location || '--';
      const overtime = day.overtime || '--';
      const totalHours = day.totalHours || '00:00';
      
      csvContent += `"${date}","${clockedHours}","${location}","${overtime}","${totalHours}"\n`;
    });
    
    // Summary
    csvContent += `\nWeekly Total Hours,${formatHours(weeklyTotalHours)}\n`;
    csvContent += `Hours Worked to Date,${statistics.hoursWorked}\n`;
    csvContent += `Overtime to Date,${statistics.overtime}\n`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `timesheet_${employee.firstName}_${employee.lastName}_week${getWeekNumber(currentDate)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!employee) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '1100px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e5e7eb'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb',
          position: 'relative'
        }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <XMarkIcon style={{ width: '24px', height: '24px', color: '#6b7280' }} />
          </button>

          {/* Employee Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '600',
              color: '#374151',
              overflow: 'hidden'
            }}>
              {employee.profilePicture ? (
                <img 
                  src={buildApiUrl(employee.profilePicture.startsWith('/') ? employee.profilePicture : `/uploads/${employee.profilePicture}`)} 
                  alt="" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.textContent = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`;
                  }}
                />
              ) : (
                `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`
              )}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Present</div>
              <h2 style={{ fontSize: '32px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                {employee.firstName} {employee.lastName}
              </h2>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {employee.jobTitle || employee.jobRole || 'Employee'}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Year</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                {new Date().getFullYear()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Hours worked to date</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                {statistics.hoursWorked}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Overtime to date</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                {statistics.overtime}
              </div>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Weekly Total Hours</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                {formatHours(weeklyTotalHours)}
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div style={{
          padding: '16px 32px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontSize: '15px', fontWeight: '500', color: '#111827' }}>
              Week {getWeekNumber(currentDate)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigateWeek(-1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <ChevronLeftIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </button>
              <div style={{ width: '240px' }}>
                <MUIDatePicker
                  value={dayjs(currentDate)}
                  onChange={(date) => {
                    if (date) {
                      setCurrentDate(date.toDate());
                    }
                  }}
                />
              </div>
              <button
                onClick={() => navigateWeek(1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {selectedEntries.size > 0 && (
              <button
                onClick={handleBulkDelete}
                title="Delete Selected"
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <TrashIcon style={{ width: '16px', height: '16px' }} />
                Delete ({selectedEntries.size})
              </button>
            )}
            <button
              onClick={exportToExcel}
              title="Export to Excel"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <PrinterIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </button>
          </div>
        </div>

        {/* Timesheet Table */}
        <div style={{ 
          padding: '0 32px 32px',
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1
        }}
        className="hide-scrollbar">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'center', 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  width: '50px'
                }}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedEntries.size > 0 && selectedEntries.size === weekData.filter(d => d.entryId).length}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'left', 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  color: '#6b7280' 
                }}>Date</th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'left', 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  minWidth: '250px'
                }}>Clocked hours</th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'left', 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  color: '#6b7280' 
                }}>Location</th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'left', 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  color: '#6b7280' 
                }}>Overtime</th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'left', 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  color: '#6b7280' 
                }}>GPS Location</th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'right', 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  color: '#6b7280' 
                }}>Total hours worked</th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'center', 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  color: '#6b7280',
                  width: '100px'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                    Loading timesheet...
                  </td>
                </tr>
              ) : (
                weekData.map((day, index) => {
                  // Determine what to show when not clocked in
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const dayDate = new Date(day.date);
                  dayDate.setHours(0, 0, 0, 0);
                  const isFutureDate = dayDate > today;
                  
                  let emptyLabel = 'Absent';
                  let emptyColor = '#fef2f2';
                  let emptyTextColor = '#dc2626';
                  
                  if (isFutureDate) {
                    emptyLabel = 'None';
                    emptyColor = '#f9fafb';
                    emptyTextColor = '#9ca3af';
                  } else if (day.isWeekend) {
                    emptyLabel = 'Week-End';
                    emptyColor = '#f3f4f6';
                    emptyTextColor = '#9ca3af';
                  }
                  
                  return (
                    <tr 
                      key={index}
                      style={{ 
                        borderBottom: '1px solid #f3f4f6',
                        background: day.clockedHours ? '#ffffff' : '#fafafa'
                      }}
                    >
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(day.entryId)}
                          onChange={() => handleSelectEntry(day.entryId)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                      </td>
                      <td style={{ padding: '16px 12px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                        {day.dayName} {day.dayNumber}
                      </td>
                      <td style={{ padding: '16px 12px', fontSize: '14px', color: '#111827' }}>
                        {day.clockedHours ? (
                          <div className="time-entry-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <p style={{ margin: 0, fontSize: '14px' }}>
                              <strong>Clock In:</strong> {(() => {
                                if (typeof day.clockIn === 'string' && /^\d{2}:\d{2}$/.test(day.clockIn)) {
                                  return day.clockIn;
                                }
                                return moment.utc(day.clockIn).tz('Europe/London').format('HH:mm');
                              })()}
                            </p>
                            <p style={{ margin: 0, fontSize: '14px' }}>
                              <strong>Clock Out:</strong> {day.clockOut ? (() => {
                                if (typeof day.clockOut === 'string' && /^\d{2}:\d{2}$/.test(day.clockOut)) {
                                  return day.clockOut;
                                }
                                return moment.utc(day.clockOut).tz('Europe/London').format('HH:mm');
                              })() : 'Present'}
                            </p>
                            {day.breaks && day.breaks.length > 0 && (
                              <p style={{ margin: 0, fontSize: '14px' }}>
                                <strong>Break Taken:</strong> {day.breaks.reduce((sum, b) => sum + (b.duration || 0), 0)} mins
                              </p>
                            )}
                          </div>
                        ) : (
                          <span style={{
                            background: emptyColor,
                            padding: '6px 16px',
                            borderRadius: '6px',
                            color: emptyTextColor,
                            fontSize: '13px',
                            fontWeight: '500'
                          }}>
                            {emptyLabel}
                          </span>
                        )}
                      </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#6b7280' }}>
                      {day.location || '--'}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#6b7280' }}>
                      {day.overtime}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#6b7280' }}>
                      {/* GPS Location Display with Google Maps Link */}
                      {day.gpsLocation && day.gpsLocation.latitude && day.gpsLocation.longitude ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {day.gpsLocation.address && (
                            <div style={{ fontSize: '12px', color: '#111827', marginBottom: '2px', maxWidth: '200px' }}>
                              📍 {day.gpsLocation.address}
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {day.gpsLocation.latitude.toFixed(6)}, {day.gpsLocation.longitude.toFixed(6)}
                          </div>
                          <a
                            href={`https://www.google.com/maps?q=${day.gpsLocation.latitude},${day.gpsLocation.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#2563eb',
                              textDecoration: 'none',
                              fontSize: '12px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                          >
                            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Open Map
                          </a>
                          {day.gpsLocation.accuracy && (
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                              Accuracy: {Math.round(day.gpsLocation.accuracy)}m
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>No location</span>
                      )}
                    </td>
                      <td style={{ padding: '16px 12px', fontSize: '14px', color: '#111827', fontWeight: '600', textAlign: 'right' }}>
                        {day.totalHours}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        {day.entryId && selectedEntries.has(day.entryId) && (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEntry(day);
                              }}
                              title="Edit Entry"
                              style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <PencilIcon style={{ width: '14px', height: '14px' }} />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEntry(day.entryId);
                              }}
                              title="Delete Entry"
                              style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <TrashIcon style={{ width: '14px', height: '14px' }} />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingEntry && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>
              {editingEntry.isAbsent || !editingEntry.entryId || editingEntry.entryId.startsWith('absent-') 
                ? 'Add Time Entry' 
                : 'Edit Time Entry'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Date
                </label>
                <MUIDatePicker
                  value={editForm.date}
                  onChange={(date) => setEditForm({ ...editForm, date })}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Clock In Time
                </label>
                <MUITimePicker
                  value={editForm.clockIn}
                  onChange={(time) => setEditForm({ ...editForm, clockIn: time })}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Clock Out Time
                </label>
                <MUITimePicker
                  value={editForm.clockOut}
                  onChange={(time) => setEditForm({ ...editForm, clockOut: time })}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default EmployeeTimesheetModal;
