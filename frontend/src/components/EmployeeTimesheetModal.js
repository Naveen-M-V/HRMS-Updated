import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { buildApiUrl } from '../utils/apiConfig';
import MUIDatePicker from './MUIDatePicker';
import MUITimePicker from './MUITimePicker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import dayjs from 'dayjs';
import moment from 'moment-timezone';
import { updateTimeEntry, deleteTimeEntry, addTimeEntry } from '../utils/clockApi';
import { toast } from 'react-toastify';
import { useClockStatus } from '../context/ClockStatusContext';

const EmployeeTimesheetModal = ({ employee, onClose }) => {
  const { triggerClockRefresh } = useClockStatus(); // For global refresh
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
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [timelineRefresh, setTimelineRefresh] = useState(0);
  const [currentClockStatus, setCurrentClockStatus] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All Status');

  useEffect(() => {
    if (employee) {
      console.log('Employee data in modal:', employee);
      fetchEmployeeProfile();
      fetchWeeklyTimesheet();
      fetchTotalEmployees();
      fetchCurrentClockStatus();
    }
  }, [employee, currentDate]);

  // Update timeline every minute for progressive animation
  useEffect(() => {
    const interval = setInterval(() => {
      setTimelineRefresh(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh clock status every 10 seconds for real-time updates
  useEffect(() => {
    const statusInterval = setInterval(() => {
      if (employee) {
        fetchCurrentClockStatus();
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(statusInterval);
  }, [employee]);

  // Fetch employee profile data (includes mobile number)
  const fetchEmployeeProfile = async () => {
    try {
      // Use profileId if available, otherwise fall back to _id or id
      const profileId = employee.profileId || employee._id || employee.id;
      console.log('📱 Fetching profile for profile ID:', profileId);
      
      const response = await axios.get(
        buildApiUrl(`/profiles/${profileId}`),
        { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      
      if (response.data) {
        console.log('✅ Employee profile fetched:', response.data);
        setEmployeeProfile(response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching employee profile:', error);
      // Don't show error toast, just log it - profile is optional
    }
  };

  // Fetch total employee count
  const fetchTotalEmployees = async () => {
    try {
      const response = await axios.get(
        buildApiUrl('/clock/employees/count'),
        { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );
      if (response.data.success) {
        setTotalEmployees(response.data.total || 0);
        console.log('✅ Total employees fetched:', response.data.total);
      }
    } catch (error) {
      console.error('❌ Error fetching employee count:', error);
      setTotalEmployees(0);
    }
  };

  // Fetch current clock status
  const fetchCurrentClockStatus = async () => {
    try {
      const employeeId = employee._id || employee.id;
      const { getClockStatus } = await import('../utils/clockApi');
      const response = await getClockStatus({ includeAdmins: true });
      
      if (response.success && response.data) {
        const empStatus = response.data.find(e => (e.id || e._id) === employeeId);
        setCurrentClockStatus(empStatus || null);
        console.log('✅ Current clock status:', empStatus);
      }
    } catch (error) {
      console.error('❌ Error fetching clock status:', error);
    }
  };

  // Clock In handler
  const handleClockIn = async () => {
    try {
      const employeeId = employee._id || employee.id;
      console.log('🔵 Clock In initiated for employee:', employeeId);
      
      let gpsData = {};
      
      // Capture GPS location
      if (navigator.geolocation) {
        try {
          console.log('📍 Capturing GPS location...');
          const locationToast = toast.info('Capturing location...', { autoClose: false });
          
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
            );
          });
          
          gpsData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          toast.dismiss(locationToast);
          console.log('✅ GPS captured:', gpsData);
        } catch (gpsError) {
          console.warn('⚠️ GPS capture failed:', gpsError);
          // Continue without GPS - don't block clock-in
        }
      }
      
      const { clockIn } = await import('../utils/clockApi');
      const response = await clockIn({ employeeId, ...gpsData });
      
      if (response.success) {
        toast.success('Clocked in successfully');
        await fetchCurrentClockStatus();
        await fetchWeeklyTimesheet();
        // Trigger global refresh for all pages
        triggerClockRefresh({ action: 'clock_in', employeeId });
      } else {
        toast.error(response.message || 'Failed to clock in');
      }
    } catch (error) {
      console.error('❌ Clock in error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to clock in');
    }
  };

  // Clock Out handler
  const handleClockOut = async () => {
    try {
      const employeeId = employee._id || employee.id;
      console.log('🔴 Clock Out initiated for employee:', employeeId);
      
      const { clockOut } = await import('../utils/clockApi');
      const response = await clockOut({ employeeId });
      
      if (response.success) {
        toast.success('Clocked out successfully');
        await fetchCurrentClockStatus();
        await fetchWeeklyTimesheet();
        // Trigger global refresh for all pages
        triggerClockRefresh({ action: 'clock_out', employeeId });
      } else {
        toast.error(response.message || 'Failed to clock out');
      }
    } catch (error) {
      console.error('❌ Clock out error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to clock out');
    }
  };

  // Start Break handler
  const handleStartBreak = async () => {
    try {
      const employeeId = employee._id || employee.id;
      console.log('🟡 Start Break initiated for employee:', employeeId);
      
      const { setOnBreak } = await import('../utils/clockApi');
      const response = await setOnBreak(employeeId);
      
      if (response.success) {
        toast.success('Break started');
        await fetchCurrentClockStatus();
        await fetchWeeklyTimesheet();
        // Trigger global refresh for all pages
        triggerClockRefresh({ action: 'start_break', employeeId });
      } else {
        toast.error(response.message || 'Failed to start break');
      }
    } catch (error) {
      console.error('❌ Start break error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to start break');
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
      
      // Find ALL entries for this day (support multiple clock-ins)
      const dayEntries = data.entries?.filter(e => {
        const entryDate = moment.utc(e.date).tz('Europe/London').format('YYYY-MM-DD');
        return entryDate === dateStr;
      }) || [];
      
      // Use the first entry as the primary entry for display
      const dayEntry = dayEntries[0];

      if (dayEntry && dayEntry.clockIn) {
        const clockIn = dayEntry.clockIn;
        const clockOut = dayEntry.clockOut;
        
        // Parse hours from backend calculation - sum all entries for this day
        let hours = 0;
        let overtime = 0;
        
        // Sum hours from all entries for this day (multiple clock-ins)
        dayEntries.forEach(entry => {
          hours += parseFloat(entry.hoursWorked || 0);
          overtime += parseFloat(entry.overtime || 0);
        });
        
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

        // Create sessions array from all entries for this day
        const sessions = dayEntries.map(entry => ({
          clockInTime: formatTime(entry.clockIn),
          clockOutTime: entry.clockOut ? formatTime(entry.clockOut) : 'Present',
          breaks: entry.breaks || []
        }));

        // Log multiple sessions for debugging
        if (sessions.length > 1) {
          console.log(`📅 Multiple sessions found for ${dateStr}:`, sessions);
        }

        // Format clockedHours to show all sessions
        let clockedHoursDisplay;
        if (sessions.length > 1) {
          clockedHoursDisplay = sessions.map((s, idx) => 
            `${idx + 1}. ${s.clockInTime} - ${s.clockOutTime}`
          ).join(' | ');
        } else {
          clockedHoursDisplay = `${clockInTime} - ${clockOutTime}${breakInfo}`;
        }

        weekEntries.push({
          entryId: dayEntry._id || dayEntry.id,
          date: date,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate().toString().padStart(2, '0'),
          clockedHours: clockedHoursDisplay,
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
          gpsLocation: dayEntry.gpsLocation || null,
          // Shift data for timeline coloring
          shift: dayEntry.shift || null,
          shiftStartTime: dayEntry.shiftStartTime || null,
          shiftEndTime: dayEntry.shiftEndTime || null,
          attendanceStatus: dayEntry.attendanceStatus || null,
          // Multiple sessions support
          sessions: sessions.length > 1 ? sessions : null // Only add if multiple sessions exist
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
  // Blue = Working hours, Red = Late arrival, Orange = Overtime
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
    
    // Get shift times if available
    const shiftStartMinutes = day.shiftStartTime ? parseTime(day.shiftStartTime) : null;
    const shiftEndMinutes = day.shiftEndTime ? parseTime(day.shiftEndTime) : null;

    // Debug logging
    if (day.sessions) {
      console.log('🎯 Timeline calculation for day:', day.dayName, 'Sessions:', day.sessions);
    }

    // Check if there are multiple sessions (multiple clock-in/out pairs)
    if (day.sessions && Array.isArray(day.sessions) && day.sessions.length > 0) {
      console.log('✅ Processing multiple sessions:', day.sessions.length);
      // Handle multiple sessions
      day.sessions.forEach((session, sessionIndex) => {
        const sessionClockInMinutes = parseTime(session.clockInTime);
        const sessionClockOutMinutes = session.clockOutTime && session.clockOutTime !== 'Present' ? parseTime(session.clockOutTime) : null;

        if (!sessionClockInMinutes) return;

        // For first session, check for late arrival
        if (sessionIndex === 0 && shiftStartMinutes && sessionClockInMinutes > shiftStartMinutes) {
          const lateStartPos = ((shiftStartMinutes - workDayStart) / totalMinutes) * 100;
          const lateEndPos = ((sessionClockInMinutes - workDayStart) / totalMinutes) * 100;
          segments.push({
            type: 'late',
            left: Math.max(0, lateStartPos),
            width: Math.max(0, lateEndPos - lateStartPos),
            color: '#ff6b35', // Orange-red for late arrival
            label: 'Late'
          });
        }

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
                  color: '#007bff', // Blue
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
                color: '#4ade80', // Green for breaks
                label: 'Break'
              });

              currentTime = breakEnd;
            }
          });
        }

        // Final working time for this session
        const sessionEndTime = sessionClockOutMinutes || (sessionIndex === day.sessions.length - 1 ? (new Date().getHours() * 60 + new Date().getMinutes()) : sessionClockOutMinutes);
        
        if (sessionEndTime && currentTime < sessionEndTime) {
          // For last session, check for overtime
          const isLastSession = sessionIndex === day.sessions.length - 1;
          const hasOvertime = isLastSession && shiftEndMinutes && sessionEndTime > shiftEndMinutes;
          
          if (hasOvertime) {
            // Regular working time (up to shift end)
            if (currentTime < shiftEndMinutes) {
              const workStart = ((currentTime - workDayStart) / totalMinutes) * 100;
              const workEnd = ((shiftEndMinutes - workDayStart) / totalMinutes) * 100;
              segments.push({
                type: 'working',
                left: Math.max(0, workStart),
                width: Math.max(0, workEnd - workStart),
                color: '#007bff', // Blue for regular working hours
                label: 'Working time'
              });
            }
            
            // Overtime segment (after shift end)
            const overtimeStart = ((shiftEndMinutes - workDayStart) / totalMinutes) * 100;
            const overtimeEnd = ((sessionEndTime - workDayStart) / totalMinutes) * 100;
            segments.push({
              type: 'overtime',
              left: Math.max(0, overtimeStart),
              width: Math.max(0, Math.min(100, overtimeEnd) - overtimeStart),
              color: '#f97316', // Orange for overtime
              label: 'Overtime'
            });
          } else {
            // No overtime, just regular working time
            const workStart = ((currentTime - workDayStart) / totalMinutes) * 100;
            const workEnd = ((sessionEndTime - workDayStart) / totalMinutes) * 100;
            segments.push({
              type: 'working',
              left: Math.max(0, workStart),
              width: Math.max(0, Math.min(100, workEnd) - workStart),
              color: '#007bff', // Blue
              label: 'Working time'
            });
          }
        }
      });
    } else {
      // Handle single session with late arrival and overtime detection
      const clockInMinutes = parseTime(day.clockInTime);
      const clockOutMinutes = day.clockOutTime && day.clockOutTime !== 'Present' ? parseTime(day.clockOutTime) : null;

      if (!clockInMinutes) return null;

      let currentTime = clockInMinutes;
      
      // Check for late arrival (if shift start time is available and clock-in is after it)
      const isLate = shiftStartMinutes && clockInMinutes > shiftStartMinutes;
      
      // Add red segment for late arrival
      if (isLate) {
        const lateStartPos = ((shiftStartMinutes - workDayStart) / totalMinutes) * 100;
        const lateEndPos = ((clockInMinutes - workDayStart) / totalMinutes) * 100;
        segments.push({
          type: 'late',
          left: Math.max(0, lateStartPos),
          width: Math.max(0, lateEndPos - lateStartPos),
          color: '#ff6b35', // Orange-red for late arrival
          label: 'Late'
        });
      }

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
                color: '#007bff', // Blue
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
              color: '#4ade80', // Green for breaks
              label: 'Break'
            });

            currentTime = breakEnd;
          }
        });
      }

      // Final working time segment - split into regular and overtime
      const endTime = clockOutMinutes || (new Date().getHours() * 60 + new Date().getMinutes());
      
      if (currentTime < endTime) {
        // Check if there's overtime (clock-out after shift end)
        const hasOvertime = shiftEndMinutes && endTime > shiftEndMinutes;
        
        if (hasOvertime) {
          // Regular working time (up to shift end)
          if (currentTime < shiftEndMinutes) {
            const workStart = ((currentTime - workDayStart) / totalMinutes) * 100;
            const workEnd = ((shiftEndMinutes - workDayStart) / totalMinutes) * 100;
            segments.push({
              type: 'working',
              left: Math.max(0, workStart),
              width: Math.max(0, workEnd - workStart),
              color: '#007bff', // Blue for regular working hours
              label: 'Working time'
            });
          }
          
          // Overtime segment (after shift end)
          const overtimeStart = ((shiftEndMinutes - workDayStart) / totalMinutes) * 100;
          const overtimeEnd = ((endTime - workDayStart) / totalMinutes) * 100;
          segments.push({
            type: 'overtime',
            left: Math.max(0, overtimeStart),
            width: Math.max(0, Math.min(100, overtimeEnd) - overtimeStart),
            color: '#f97316', // Orange for overtime
            label: 'Overtime'
          });
        } else {
          // No overtime, just regular working time
          const workStart = ((currentTime - workDayStart) / totalMinutes) * 100;
          const workEnd = ((endTime - workDayStart) / totalMinutes) * 100;
          segments.push({
            type: 'working',
            left: Math.max(0, workStart),
            width: Math.max(0, Math.min(100, workEnd) - workStart),
            color: '#007bff', // Blue for working hours
            label: 'Working time'
          });
        }
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
              {(employeeProfile?.profilePicture || employee.profilePicture) ? (
                <img 
                  src={buildApiUrl((employeeProfile?.profilePicture || employee.profilePicture).startsWith('/') ? (employeeProfile?.profilePicture || employee.profilePicture) : `/uploads/${employeeProfile?.profilePicture || employee.profilePicture}`)} 
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
                <div><span style={{ fontWeight: '500' }}>VTID:</span> {employeeProfile?.vtid || employee.vtid || 'N/A'}</div>
                <div>
                  <span style={{ fontWeight: '500' }}>Mobile:</span> {employeeProfile?.mobile || employee.mobile || employeeProfile?.phone || employee.phone || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clock In/Out/Break Buttons */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          {currentClockStatus?.status === 'clocked_in' ? (
            <>
              <button
                onClick={handleStartBreak}
                style={{
                  padding: '10px 20px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Break
              </button>
              <button
                onClick={handleClockOut}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Clock Out
              </button>
              <div style={{
                padding: '8px 16px',
                background: '#d1fae5',
                color: '#065f46',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
                Clocked In
              </div>
            </>
          ) : currentClockStatus?.status === 'on_break' ? (
            <>
              <button
                onClick={async () => {
                  try {
                    const employeeId = employee._id || employee.id;
                    console.log('🟢 Resume Work initiated for employee:', employeeId);
                    
                    const { endBreak } = await import('../utils/clockApi');
                    const response = await endBreak(employeeId);
                    
                    if (response.success) {
                      toast.success('Break ended, work resumed');
                      await fetchCurrentClockStatus();
                      await fetchWeeklyTimesheet();
                      // Trigger global refresh for all pages
                      triggerClockRefresh({ action: 'end_break', employeeId });
                    } else {
                      toast.error(response.message || 'Failed to end break');
                    }
                  } catch (error) {
                    console.error('❌ End break error:', error);
                    toast.error(error.response?.data?.message || error.message || 'Failed to end break');
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                }}
              >
                Resume Work
              </button>
              <button
                onClick={handleClockOut}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Clock Out
              </button>
              <div style={{
                padding: '8px 16px',
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }}></span>
                On Break
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleClockIn}
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                }}
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Clock In
              </button>
              <div style={{
                padding: '8px 16px',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>
                Clocked Out
              </div>
            </>
          )}
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              {weekData.filter(day => {
                if (statusFilter === 'All Status') return true;
                if (statusFilter === 'Present') return day.clockIn && day.clockOut;
                if (statusFilter === 'Absent') return !day.clockIn || day.isAbsent;
                if (statusFilter === 'Late') {
                  // Check if employee was late based on shift start time
                  if (!day.clockInTime || !day.shiftStartTime) return false;
                  const parseTime = (timeStr) => {
                    if (!timeStr || timeStr === 'Present' || timeStr === 'N/A') return null;
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    return hours * 60 + minutes;
                  };
                  const clockInMinutes = parseTime(day.clockInTime);
                  const shiftStartMinutes = parseTime(day.shiftStartTime);
                  return clockInMinutes > shiftStartMinutes;
                }
                return true;
              }).map((day, index) => {
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
                          {/* Show all sessions if multiple exist */}
                          {day.sessions && day.sessions.length > 1 ? (
                            <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {day.sessions.map((session, idx) => (
                                <div key={idx}>
                                  <span style={{ fontWeight: '600', color: '#3b82f6' }}>Session {idx + 1}:</span>{' '}
                                  <span style={{ fontWeight: '500', color: '#111827' }}>
                                    {session.clockInTime} - {session.clockOutTime}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Clock-in: <span style={{ fontWeight: '500', color: '#111827' }}>{day.clockInTime || '--'}</span>
                              {day.clockOutTime && day.clockOutTime !== 'Present' && (
                                <span> | Clock-out: <span style={{ fontWeight: '500', color: '#111827' }}>{day.clockOutTime}</span></span>
                              )}
                            </div>
                          )}
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
                        <TooltipProvider>
                          <div style={{ marginBottom: '16px' }}>
                            {/* Progress Bar with progressive animation */}
                            <div style={{
                              position: 'relative',
                              height: '16px',
                              background: '#e5e7eb',
                              borderRadius: '3px',
                              overflow: 'hidden',
                              marginBottom: '12px',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}>
                              {segments.map((segment, idx) => {
                                // Calculate progressive width based on current time
                                const now = new Date();
                                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                                const parseTime = (timeStr) => {
                                  if (!timeStr || timeStr === 'Present' || timeStr === 'N/A') return null;
                                  const [hours, minutes] = timeStr.split(':').map(Number);
                                  return hours * 60 + minutes;
                                };
                                
                                const clockInMinutes = parseTime(day.clockInTime);
                                const clockOutMinutes = day.clockOutTime && day.clockOutTime !== 'Present' ? parseTime(day.clockOutTime) : null;
                                const isToday = day.isToday;
                                
                                // Calculate segment start and end in minutes
                                const workDayStart = 5 * 60;
                                const totalMinutes = 18 * 60;
                                const segmentStartMinutes = workDayStart + (segment.left / 100) * totalMinutes;
                                const segmentEndMinutes = segmentStartMinutes + (segment.width / 100) * totalMinutes;
                                
                                let displayWidth = segment.width;
                                
                                // If today and not clocked out, animate to current time
                                if (isToday && !clockOutMinutes) {
                                  if (currentMinutes < segmentStartMinutes) {
                                    displayWidth = 0;
                                  } else if (currentMinutes < segmentEndMinutes) {
                                    const progressMinutes = currentMinutes - segmentStartMinutes;
                                    const segmentTotalMinutes = segmentEndMinutes - segmentStartMinutes;
                                    displayWidth = (progressMinutes / segmentTotalMinutes) * segment.width;
                                  }
                                }
                                
                                return (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <div
                                        style={{
                                          position: 'absolute',
                                          left: `${segment.left}%`,
                                          width: `${displayWidth}%`,
                                          height: '100%',
                                          background: segment.color,
                                          borderRadius: idx === 0 ? '3px 0 0 3px' : idx === segments.length - 1 ? '0 3px 3px 0' : '0',
                                          transition: 'width 1s linear',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '9px',
                                          color: 'white',
                                          fontWeight: '600',
                                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                          marginLeft: idx > 0 ? '1px' : '0'
                                        }}
                                      >
                                        {displayWidth > 8 ? segment.label : ''}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{segment.label}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>

                          {/* Time Labels Below Bar */}
                          <div style={{ 
                            position: 'relative', 
                            height: '18px',
                            marginBottom: '12px',
                            borderTop: '1px solid #e5e7eb',
                            paddingTop: '4px'
                          }}>
                            {[5, 7, 9, 11, 13, 15, 17, 19, 21, 23].map((hour) => {
                              const position = ((hour - 5) / 18) * 100;
                              return (
                                <div
                                  key={hour}
                                  style={{
                                    position: 'absolute',
                                    left: `${position}%`,
                                    transform: 'translateX(-50%)',
                                    fontSize: '10px',
                                    color: '#6b7280',
                                    fontWeight: '500'
                                  }}
                                >
                                  {hour.toString().padStart(2, '0')}:00
                                </div>
                              );
                            })}
                          </div>

                          {/* Legend */}
                          <div style={{ 
                            display: 'flex', 
                            gap: '12px', 
                            fontSize: '11px',
                            color: '#6b7280',
                            marginBottom: '12px',
                            flexWrap: 'wrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '10px', height: '10px', background: '#ff6b35', borderRadius: '2px' }}></div>
                              <span>Late</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '10px', height: '10px', background: '#007bff', borderRadius: '2px' }}></div>
                              <span>Working</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '10px', height: '10px', background: '#4ade80', borderRadius: '2px' }}></div>
                              <span>Break</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{ width: '10px', height: '10px', background: '#f97316', borderRadius: '2px' }}></div>
                              <span>Overtime</span>
                            </div>
                          </div>

                          {/* Break Details Section */}
                          {day.breaks && day.breaks.length > 0 && (
                            <div style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '8px',
                              padding: '12px',
                              marginBottom: '12px'
                            }}>
                              <div style={{ 
                                fontSize: '12px', 
                                fontWeight: '600', 
                                color: '#166534',
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Break Details
                              </div>
                              {day.breaks.map((breakItem, idx) => {
                                const breakDuration = breakItem.duration || 0;
                                const breakHours = Math.floor(breakDuration / 60);
                                const breakMins = breakDuration % 60;
                                return (
                                  <div key={idx} style={{ 
                                    fontSize: '11px', 
                                    color: '#15803d',
                                    marginBottom: idx < day.breaks.length - 1 ? '4px' : '0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <span>
                                      Break {idx + 1}: {breakItem.startTime} - {breakItem.endTime}
                                    </span>
                                    <span style={{ fontWeight: '600' }}>
                                      {breakHours > 0 ? `${breakHours}h ` : ''}{breakMins}m
                                    </span>
                                  </div>
                                );
                              })}
                              <div style={{
                                marginTop: '8px',
                                paddingTop: '8px',
                                borderTop: '1px solid #bbf7d0',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#166534',
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}>
                                <span>Total Break Time:</span>
                                <span>
                                  {(() => {
                                    const totalBreakMins = day.breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
                                    const hours = Math.floor(totalBreakMins / 60);
                                    const mins = totalBreakMins % 60;
                                    return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Duration Display */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                          }}>
                            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                              Total Working Duration:
                            </span>
                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                              {day.totalHours || '0h 0m'}
                            </span>
                          </div>
                        </div>
                        </TooltipProvider>
                      ) : (
                        <div style={{
                          background: emptyColor,
                          padding: '16px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          color: emptyTextColor,
                          fontSize: '13px',
                          fontWeight: '500',
                          marginBottom: '16px'
                        }}>
                          {emptyLabel}
                        </div>
                      )}

                      {/* GPS Location - Moved outside timeline section */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', marginTop: '8px' }}>
                        
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