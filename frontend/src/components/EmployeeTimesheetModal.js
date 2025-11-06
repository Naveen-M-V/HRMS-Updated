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
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    date: null,
    clockIn: null,
    clockOut: null
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [currentEmployeeIndex, setCurrentEmployeeIndex] = useState(1);

  useEffect(() => {
    if (employee) {
      console.log('Employee data in modal:', employee);
      fetchWeeklyTimesheet();
      fetchTotalEmployees();
    }
  }, [employee, currentDate]);

  // Fetch total employee count
  const fetchTotalEmployees = async () => {
    try {
      const response = await axios.get(
        buildApiUrl('/employees/count'),
        { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      if (response.data.success) {
        setTotalEmployees(response.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching employee count:', error);
      setTotalEmployees(0);
    }
  };

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuIndex !== null) {
        setOpenMenuIndex(null);
      }
    };
    
    if (openMenuIndex !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuIndex]);

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

    const workDayStart = 5 * 60; // 05:00 in minutes (5 AM)
    const workDayEnd = 23 * 60; // 23:00 in minutes (11 PM)
    const totalMinutes = workDayEnd - workDayStart; // 18 hours

    const parseTime = (timeStr) => {
      if (!timeStr || timeStr === 'Present' || timeStr === 'N/A') return null;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const segments = [];

    // Check if there are multiple sessions (multiple clock-in/out pairs)
    if (day.sessions && Array.isArray(day.sessions) && day.sessions.length > 0) {
      // Handle multiple sessions
      day.sessions.forEach((session, sessionIndex) => {
        const sessionClockInMinutes = parseTime(session.clockInTime);
        const sessionClockOutMinutes = session.clockOutTime && session.clockOutTime !== 'Present' ? parseTime(session.clockOutTime) : null;

        if (!sessionClockInMinutes) return;

        // Clock-in marker for this session
        const clockInPosition = ((sessionClockInMinutes - workDayStart) / totalMinutes) * 100;
        segments.push({
          type: 'clock-in',
          left: Math.max(0, clockInPosition),
          width: 1,
          color: '#f97316', // Orange
          label: `Clock-in ${sessionIndex + 1}`
        });

        let currentTime = sessionClockInMinutes;

        // Process breaks for this session
        if (session.breaks && session.breaks.length > 0) {
          const sortedBreaks = [...session.breaks].sort((a, b) => {
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
                color: '#f59e0b', // Amber/Orange for breaks
                label: 'Break'
              });

              currentTime = breakEnd;
            }
          });
        }

        // Final working time for this session
        const sessionEndTime = sessionClockOutMinutes || (sessionIndex === day.sessions.length - 1 ? (new Date().getHours() * 60 + new Date().getMinutes()) : sessionClockOutMinutes);
        if (sessionEndTime && currentTime < sessionEndTime) {
          const workStart = ((currentTime - workDayStart) / totalMinutes) * 100;
          const workEnd = ((sessionEndTime - workDayStart) / totalMinutes) * 100;
          segments.push({
            type: 'working',
            left: Math.max(0, workStart),
            width: Math.max(0, Math.min(100, workEnd) - workStart),
            color: '#3b82f6', // Blue
            label: 'Working time'
          });
        }

        // Clock-out marker if present
        if (sessionClockOutMinutes) {
          const clockOutPosition = ((sessionClockOutMinutes - workDayStart) / totalMinutes) * 100;
          segments.push({
            type: 'clock-out',
            left: Math.max(0, clockOutPosition),
            width: 1,
            color: '#ef4444', // Red
            label: `Clock-out ${sessionIndex + 1}`
          });
        }
      });
    } else {
      // Handle single session (backward compatibility)
      const clockInMinutes = parseTime(day.clockInTime);
      const clockOutMinutes = day.clockOutTime && day.clockOutTime !== 'Present' ? parseTime(day.clockOutTime) : null;

      if (!clockInMinutes) return null;

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
              color: '#f59e0b', // Amber/Orange for breaks
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
        segments.push({
          type: 'clock-out',
          left: Math.max(0, clockOutPosition),
          width: 1,
          color: '#ef4444', // Red
          label: 'Clock-out'
        });
      }
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
    return totalEmployees || 0;
  };

  const getCurrentEmployeeIndex = () => {
    return currentEmployeeIndex;
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
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuIndex(openMenuIndex === index ? null : index);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <EllipsisVerticalIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {openMenuIndex === index && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '100%',
                                  marginTop: '4px',
                                  background: '#ffffff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                  zIndex: 1000,
                                  minWidth: '160px',
                                  overflow: 'hidden'
                                }}>
                                <button
                                  onClick={() => {
                                    setEditingEntry(day);
                                    setEditForm({
                                      date: day.date,
                                      clockIn: day.clockIn,
                                      clockOut: day.clockOut
                                    });
                                    setOpenMenuIndex(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    background: 'transparent',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#374151',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit Entry
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteEntry(day.entryId);
                                    setOpenMenuIndex(null);
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderTop: '1px solid #f3f4f6',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#dc2626',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete Entry
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Timeline Progress Bar */}
                      {day.clockIn && segments ? (
                        <div style={{ marginBottom: '12px' }}>
                          {/* Time Labels */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: '#9ca3af' }}>
                            <span>05:00</span>
                            <span>08:00</span>
                            <span>11:00</span>
                            <span>14:00</span>
                            <span>17:00</span>
                            <span>20:00</span>
                            <span>23:00</span>
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
                          
                          {/* Timeline Legend */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '16px', 
                            marginTop: '8px', 
                            fontSize: '10px',
                            justifyContent: 'center'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                background: '#3b82f6', 
                                borderRadius: '2px' 
                              }}></div>
                              <span style={{ color: '#6b7280' }}>Working</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                background: '#f59e0b', 
                                borderRadius: '2px' 
                              }}></div>
                              <span style={{ color: '#6b7280' }}>Break</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                background: '#f97316', 
                                borderRadius: '2px' 
                              }}></div>
                              <span style={{ color: '#6b7280' }}>Clock-in</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                background: '#ef4444', 
                                borderRadius: '2px' 
                              }}></div>
                              <span style={{ color: '#6b7280' }}>Clock-out</span>
                            </div>
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