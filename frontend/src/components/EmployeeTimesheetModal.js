import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PrinterIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { buildApiUrl } from '../utils/apiConfig';
import MUIDatePicker from './MUIDatePicker';
import dayjs from 'dayjs';
import axios from 'axios';

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
      console.log('Fetching timesheet for employee ID:', employeeId);

      const response = await axios.get(
        buildApiUrl(`/clock/timesheet/${employeeId}?startDate=${monday.toISOString().split('T')[0]}&endDate=${sunday.toISOString().split('T')[0]}`),
        { withCredentials: true }
      );

      if (response.data && response.data.success) {
        console.log('Timesheet data received:', response.data);
        processTimesheetData(response.data);
      } else {
        console.warn('No timesheet data, generating empty week');
        generateEmptyWeek();
      }
    } catch (error) {
      console.error('Error fetching timesheet:', error);
      if (error.response?.status === 401) {
        console.error('Unauthorized - user may need to log in again');
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
      
      const dayEntry = data.entries?.find(e => 
        new Date(e.date).toISOString().split('T')[0] === dateStr
      );

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
          date: date,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate().toString().padStart(2, '0'),
          clockedHours: `${clockInTime} - ${clockOutTime}${breakInfo}`,
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
          date: date,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate().toString().padStart(2, '0'),
          clockedHours: null,
          location: '--',
          overtime: '--',
          totalHours: '00:00',
          workType: null,
          isWeekend: isWeekend
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
                  color: '#6b7280' 
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                    Loading timesheet...
                  </td>
                </tr>
              ) : (
                weekData.map((day, index) => {
                  // Determine what to show when not clocked in
                  let emptyLabel = 'Absent';
                  let emptyColor = '#fef2f2';
                  let emptyTextColor = '#dc2626';
                  
                  if (day.isWeekend) {
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
                      <td style={{ padding: '16px 12px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                        {day.dayName} {day.dayNumber}
                      </td>
                      <td style={{ padding: '16px 12px', fontSize: '14px', color: '#111827' }}>
                        {day.clockedHours || (
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
                          <div style={{ fontSize: '12px', color: '#111827' }}>
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
