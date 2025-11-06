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
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Check if this is today
      const dayDate = new Date(date);
      dayDate.setHours(0, 0, 0, 0);
      const isToday = dayDate.getTime() === today.getTime();
      const isFuture = dayDate > today;
      
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
          clockInTime: clockInTime,
          clockOut: clockOut,
          clockOutTime: clockOutTime,
          breaks: dayEntry.breaks || [], // Add breaks data for timeline visualization
          location: dayEntry.location || 'N/A',
          overtime: overtime > 0 ? formatHours(overtime) : '--',
          totalHours: formatHours(hours),
          hoursDecimal: hours,
          workType: dayEntry.workType || 'Regular',
          isWeekend: isWeekend,
          isToday: isToday,
          isFuture: isFuture,
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
          hoursDecimal: 0,
          workType: null,
          isWeekend: isWeekend,
          isToday: isToday,
          isFuture: isFuture,
          isAbsent: true // Flag to identify absent entries
        });
      }
    }

    // Filter out future dates and sort: Today first, then past days in descending order
    const filteredAndSorted = weekEntries
      .filter(entry => !entry.isFuture) // Remove future dates
      .sort((a, b) => {
        if (a.isToday) return -1; // Today always first
        if (b.isToday) return 1;
        return b.date - a.date; // Past days in descending order
      });

    setWeekData(filteredAndSorted);
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

  // Timeline helper function to calculate position and width percentages
  const calculateTimelineSegments = (day) => {
    if (!day.clockIn) return null;

    const workDayStart = 9 * 60; // 09:00 in minutes
    const workDayEnd = 21 * 60; // 21:00 in minutes
    const totalMinutes = workDayEnd - workDayStart; // 12 hours

    const parseTime = (timeStr) => {
      if (!timeStr || timeStr === 'Present' || timeStr === 'N/A') return null;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const clockInMinutes = parseTime(day.clockInTime);
    const clockOutMinutes = day.clockOutTime && day.clockOutTime !== 'Present' ? parseTime(day.clockOutTime) : null;

    if (!clockInMinutes) return null;

    const segments = [];
    let currentTime = clockInMinutes;

    // Clock-in segment (small marker)
    const clockInPosition = ((clockInMinutes - workDayStart) / totalMinutes) * 100;
    segments.push({
      type: 'clock-in',
      left: Math.max(0, clockInPosition),
      width: 1,
      color: '#f97316', // Orange
      label: 'Clock-in'
    });

    // Process breaks and working time
    if (day.breaks && day.breaks.length > 0) {
      const sortedBreaks = [...day.breaks].sort((a, b) => {
        const aStart = parseTime(a.startTime);
        const bStart = parseTime(b.startTime);
        return aStart - bStart;
      });

      sortedBreaks.forEach((breakItem) => {
        const breakStart = parseTime(breakItem.startTime);
        const breakEnd = parseTime(breakItem.endTime);

        if (breakStart && breakEnd) {
          // Working time before break
          if (currentTime < breakStart) {
            const workStart = ((currentTime - workDayStart) / totalMinutes) * 100;
            const workEnd = ((breakStart - workDayStart) / totalMinutes) * 100;
            segments.push({
              type: 'working',
              left: Math.max(0, workStart),
              width: Math.max(0, workEnd - workStart),
              color: '#3b82f6', // Blue
              label: 'Working time'
            });
          }

          // Break time
          const breakStartPos = ((breakStart - workDayStart) / totalMinutes) * 100;
          const breakEndPos = ((breakEnd - workDayStart) / totalMinutes) * 100;
          segments.push({
            type: 'break',
            left: Math.max(0, breakStartPos),
            width: Math.max(0, breakEndPos - breakStartPos),
            color: '#06b6d4', // Cyan
            label: 'Break'
          });

          currentTime = breakEnd;
        }
      });
    }

    // Final working time segment
    const endTime = clockOutMinutes || (new Date().getHours() * 60 + new Date().getMinutes());
    if (currentTime < endTime) {
      const workStart = ((currentTime - workDayStart) / totalMinutes) * 100;
      const workEnd = ((endTime - workDayStart) / totalMinutes) * 100;
      segments.push({
        type: 'working',
        left: Math.max(0, workStart),
        width: Math.max(0, Math.min(100, workEnd) - workStart),
        color: '#3b82f6', // Blue
        label: 'Working time'
      });
    }

    // Clock-out marker if present
    if (clockOutMinutes) {
      const clockOutPosition = ((clockOutMinutes - workDayStart) / totalMinutes) * 100;
      // Don't add clock-out marker as a separate segment, just mark the end
    }

    return segments;
  };

  const navigateDay = (direction) => {
    const newIndex = currentDayIndex + direction;
    if (newIndex >= 0 && newIndex < weekData.length) {
      setCurrentDayIndex(newIndex);
    }
  };

  const getTotalEmployees = () => {
    // This would come from your employee list - placeholder for now
    return 56;
  };

  const getCurrentEmployeeIndex = () => {
    // This would be the actual index - placeholder for now
    return 1;
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
    <>
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
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          position: 'relative',
          background: '#ffffff'
        }}>
          {/* Navigation and Close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => {/* Navigate to previous employee */}}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeftIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </button>
              <button
                onClick={() => {/* Navigate to next employee */}}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
              </button>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                {getCurrentEmployeeIndex()} out of {getTotalEmployees()}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <XMarkIcon style={{ width: '24px', height: '24px', color: '#6b7280' }} />
            </button>
          </div>

          {/* Employee Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
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
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                {employee.firstName} {employee.lastName}
              </h2>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                <div><span style={{ fontWeight: '500' }}>Role:</span> {employee.jobTitle || employee.jobRole || 'Employee'}</div>
                <div><span style={{ fontWeight: '500' }}>Employee ID:</span> #{employee._id?.slice(-6) || 'N/A'}</div>
                <div><span style={{ fontWeight: '500' }}>Phone Number:</span> {employee.phone || 'N/A'}</div>
              </div>
            </div>
            <button
              style={{
                background: '#10b981',
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
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Attendance
            </button>
          </div>

          {/* Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Day off</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>12</div>
              <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>+12 vs last month</div>
            </div>
            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Late clock-in</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>6</div>
              <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>-2 vs last month</div>
            </div>
            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Late clock-out</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>21</div>
              <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>-12 vs last month</div>
            </div>
            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>No clock-out</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>2</div>
              <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px' }}>+4 vs last month</div>
            </div>
            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Off time quota</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>0</div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>0 vs last month</div>
            </div>
            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Absent</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>2</div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>0 vs last month</div>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
              {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  const newMonth = new Date(selectedMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setSelectedMonth(newMonth);
                  setCurrentDate(newMonth);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronLeftIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
              </button>
              <button
                onClick={() => {
                  const newMonth = new Date(selectedMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setSelectedMonth(newMonth);
                  setCurrentDate(newMonth);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronRightIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="text"
              placeholder="Search"
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                width: '200px',
                outline: 'none'
              }}
            />
            <select
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                background: 'white',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option>All Status</option>
              <option>Present</option>
              <option>Absent</option>
              <option>Late</option>
            </select>
          </div>
        </div>

        {/* Timeline Calendar View */}
        <div style={{ 
          padding: '24px',
          overflowY: 'auto',
          overflowX: 'hidden',
          flex: 1,
          background: '#f9fafb'
        }}
        className="hide-scrollbar">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Loading timesheet...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {weekData.map((day, index) => {
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
                  
                  const segments = calculateTimelineSegments(day);
                  const isApproved = day.clockOut && !day.isAbsent;
                  
                  return (
                    <div 
                      key={index}
                      style={{ 
                        background: day.isToday ? '#eff6ff' : '#ffffff',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        border: day.isToday ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        boxShadow: day.isToday ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      {/* Day Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', minWidth: '120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {day.isToday && <span style={{ fontSize: '16px' }}>🟢</span>}
                            {day.isToday ? 'Today' : `${day.dayName}, ${day.dayNumber}`}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Clock-in: <span style={{ fontWeight: '500', color: '#111827' }}>{day.clockInTime || '--'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {isApproved && (
                            <div style={{
                              background: '#d1fae5',
                              color: '#065f46',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              ✓ Approved
                            </div>
                          )}
                          <button
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <EllipsisVerticalIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                          </button>
                        </div>
                      </div>

                      {/* Timeline Progress Bar */}
                      {day.clockIn && segments ? (
                        <div style={{ marginBottom: '12px' }}>
                          {/* Time Labels */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: '#9ca3af' }}>
                            <span>09:00</span>
                            <span>11:00</span>
                            <span>13:00</span>
                            <span>15:00</span>
                            <span>17:00</span>
                            <span>19:00</span>
                            <span>21:00</span>
                            <span>23:59</span>
                          </div>
                          
                          {/* Progress Bar Container */}
                          <div style={{
                            position: 'relative',
                            height: '32px',
                            background: '#f3f4f6',
                            borderRadius: '6px',
                            overflow: 'hidden'
                          }}>
                            {segments.map((segment, idx) => (
                              <div
                                key={idx}
                                style={{
                                  position: 'absolute',
                                  left: `${segment.left}%`,
                                  width: `${segment.width}%`,
                                  height: '100%',
                                  background: segment.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  color: 'white',
                                  fontWeight: '600'
                                }}
                                title={segment.label}
                              >
                                {segment.width > 5 && segment.type === 'working' && 'Working'}
                                {segment.width > 5 && segment.type === 'break' && 'Break'}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          background: emptyColor,
                          padding: '12px',
                          borderRadius: '6px',
                          textAlign: 'center',
                          color: emptyTextColor,
                          fontSize: '13px',
                          fontWeight: '500',
                          marginBottom: '12px'
                        }}>
                          {emptyLabel}
                        </div>
                      )}

                      {/* Footer Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: '16px', color: '#6b7280' }}>
                            {day.clockOutTime && (
                              <div>
                                Clock-out: <span style={{ fontWeight: '500', color: '#111827' }}>{day.clockOutTime}</span>
                              </div>
                            )}
                            {day.breaks && day.breaks.length > 0 && (
                              <div>
                                Breaks: <span style={{ fontWeight: '500', color: '#111827' }}>
                                  {day.breaks.reduce((sum, b) => sum + (b.duration || 0), 0)} mins
                                </span>
                              </div>
                            )}
                          </div>
                          <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>
                            Duration: {day.totalHours || '0h 0m'}
                          </div>
                        </div>
                        
                        {/* GPS Location Display */}
                        {day.gpsLocation && day.gpsLocation.latitude && day.gpsLocation.longitude && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            padding: '8px 12px', 
                            background: '#f0fdf4', 
                            borderRadius: '6px',
                            border: '1px solid #bbf7d0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534' }}>
                              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span style={{ fontSize: '11px', fontWeight: '500' }}>
                                {day.gpsLocation.latitude.toFixed(6)}, {day.gpsLocation.longitude.toFixed(6)}
                              </span>
                            </div>
                            {day.gpsLocation.accuracy && (
                              <span style={{ fontSize: '10px', color: '#15803d' }}>
                                (±{Math.round(day.gpsLocation.accuracy)}m)
                              </span>
                            )}
                            <a
                              href={`https://www.google.com/maps?q=${day.gpsLocation.latitude},${day.gpsLocation.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                marginLeft: 'auto',
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontSize: '11px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              View Map
                              <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
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
    </>
  );
};

export default EmployeeTimesheetModal;