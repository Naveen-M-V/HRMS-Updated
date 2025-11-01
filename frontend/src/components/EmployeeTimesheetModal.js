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

const EmployeeTimesheetModal = ({ employee, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekData, setWeekData] = useState([]);
  const [statistics, setStatistics] = useState({
    hoursWorked: 0,
    overtime: 0,
    negativeHours: 0
  });
  const [selectedCount, setSelectedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);

  useEffect(() => {
    if (employee) {
      console.log('Employee data in modal:', employee);
      fetchWeeklyTimesheet();
    }
  }, [employee, currentDate]);

  useEffect(() => {
    // Update selected count when selectedDays changes
    setSelectedCount(selectedDays.length);
  }, [selectedDays]);

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

      const response = await fetch(
        buildApiUrl(`/api/clock/timesheet/${employeeId}?startDate=${monday.toISOString().split('T')[0]}&endDate=${sunday.toISOString().split('T')[0]}`),
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Timesheet data received:', data);
        processTimesheetData(data);
      } else {
        console.warn('No timesheet data, generating empty week');
        // Generate empty week if no data
        generateEmptyWeek();
      }
    } catch (error) {
      console.error('Error fetching timesheet:', error);
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
      emptyWeek.push({
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate().toString().padStart(2, '0'),
        clockedHours: null,
        negativeHours: '--',
        overtime: '--',
        totalHours: '00:00',
        selected: false
      });
    }
    setWeekData(emptyWeek);
    setStatistics({ hoursWorked: 0, overtime: 0, negativeHours: 0 });
    setSelectedDays([]);
    setSelectAll(false);
  };

  const processTimesheetData = (data) => {
    const monday = getMonday(currentDate);
    const weekEntries = [];
    let totalHours = 0;
    let totalOvertime = 0;
    let totalNegative = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntry = data.entries?.find(e => 
        new Date(e.date).toISOString().split('T')[0] === dateStr
      );

      if (dayEntry && dayEntry.clockIn) {
        const clockIn = dayEntry.clockIn;
        const clockOut = dayEntry.clockOut;
        
        // Parse hours from backend calculation
        const hours = parseFloat(dayEntry.hoursWorked || 0);
        const overtime = parseFloat(dayEntry.overtime || 0);
        const negativeHours = parseFloat(dayEntry.negativeHours || 0);
        
        totalHours += hours;
        totalOvertime += overtime;
        totalNegative += negativeHours;

        // Format clock in/out times
        const clockInTime = new Date(clockIn).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        const clockOutTime = clockOut ? new Date(clockOut).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }) : 'Present';

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
          negativeHours: negativeHours > 0 ? formatHours(negativeHours) : '--',
          overtime: overtime > 0 ? formatHours(overtime) : '--',
          totalHours: formatHours(hours),
          location: dayEntry.location || 'N/A',
          workType: dayEntry.workType || 'Regular',
          selected: false
        });
      } else {
        weekEntries.push({
          date: date,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate().toString().padStart(2, '0'),
          clockedHours: null,
          negativeHours: '--',
          overtime: '--',
          totalHours: '00:00',
          location: null,
          workType: null,
          selected: false
        });
      }
    }

    setWeekData(weekEntries);
    setSelectedDays([]);
    setSelectAll(false);
    
    // Use statistics from backend if available
    if (data.statistics) {
      setStatistics({
        hoursWorked: parseFloat(data.statistics.totalHoursWorked || 0).toFixed(2),
        overtime: parseFloat(data.statistics.totalOvertime || 0).toFixed(2),
        negativeHours: parseFloat(data.statistics.totalNegativeHours || 0).toFixed(2)
      });
    } else {
      setStatistics({
        hoursWorked: totalHours.toFixed(2),
        overtime: totalOvertime.toFixed(2),
        negativeHours: totalNegative.toFixed(2)
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

  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedDays([]);
      setSelectAll(false);
    } else {
      // Select all days
      const allDayIndices = weekData.map((_, index) => index);
      setSelectedDays(allDayIndices);
      setSelectAll(true);
    }
  };

  const handleDaySelect = (index) => {
    if (selectedDays.includes(index)) {
      setSelectedDays(selectedDays.filter(i => i !== index));
      setSelectAll(false);
    } else {
      const newSelected = [...selectedDays, index];
      setSelectedDays(newSelected);
      if (newSelected.length === weekData.length) {
        setSelectAll(true);
      }
    }
  };

  const formatDateRange = () => {
    const monday = getMonday(currentDate);
    return monday.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
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
                <img src={employee.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Negative hours to date</div>
              <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                {statistics.negativeHours}
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
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Selected ({selectedCount.toString().padStart(2, '0')})
            </div>
            <button
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <PrinterIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </button>
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
                  color: '#6b7280',
                  width: '40px'
                }}>
                  <input 
                    type="checkbox" 
                    checked={selectAll}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }} 
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
                  color: '#6b7280' 
                }}>Clocked hours</th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'left', 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  color: '#6b7280' 
                }}>Negative hours</th>
                <th style={{ 
                  padding: '16px 12px', 
                  textAlign: 'left', 
                  fontSize: '13px', 
                  fontWeight: '500', 
                  color: '#6b7280' 
                }}>Overtime</th>
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
                weekData.map((day, index) => (
                  <tr 
                    key={index}
                    style={{ 
                      borderBottom: '1px solid #f3f4f6',
                      background: day.clockedHours ? '#ffffff' : '#fafafa'
                    }}
                  >
                    <td style={{ padding: '16px 12px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedDays.includes(index)}
                        onChange={() => handleDaySelect(index)}
                        style={{ cursor: 'pointer' }} 
                      />
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                      {day.dayName} {day.dayNumber}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#111827' }}>
                      {day.clockedHours || (
                        <span style={{
                          background: '#f3f4f6',
                          padding: '6px 16px',
                          borderRadius: '6px',
                          color: '#9ca3af',
                          fontSize: '13px'
                        }}>
                          Week-End
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#6b7280' }}>
                      {day.negativeHours}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#6b7280' }}>
                      {day.overtime}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '14px', color: '#111827', fontWeight: '600', textAlign: 'right' }}>
                      {day.totalHours}
                    </td>
                  </tr>
                ))
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
