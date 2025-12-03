import React, { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowPathIcon,
  CalendarIcon as CalendarOutlineIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import axios from '../utils/axiosConfig';
import { DatePicker } from '../components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startHalfDay, setStartHalfDay] = useState('full');
  const [endHalfDay, setEndHalfDay] = useState('full');
  const [weekendWarning, setWeekendWarning] = useState('');
  
  // NEW: Real data from API
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [shiftAssignments, setShiftAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // NEW: Day expansion state
  const [expandedDay, setExpandedDay] = useState(null);
  const [dayDetails, setDayDetails] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'short-term', 'long-term'

  // NEW: Fetch calendar events when month changes
  useEffect(() => {
    fetchCalendarEvents();
  }, [currentDate]);

  const fetchCalendarEvents = async () => {
    setLoading(true);
    setError('');
    
    try {
      const startOfMonth = currentDate.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = currentDate.endOf('month').format('YYYY-MM-DD');
      
      // Fetch approved leave records
      const leaveResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/leave/records`,
        {
          params: {
            startDate: startOfMonth,
            endDate: endOfMonth,
            status: 'approved'
          }
        }
      );
      
      // Fetch shift assignments
      const shiftResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/rota/shifts/all`,
        {
          params: {
            startDate: startOfMonth,
            endDate: endOfMonth
          }
        }
      );
      
      setLeaveRecords(leaveResponse.data.data || []);
      setShiftAssignments(shiftResponse.data.data || []);
      
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setError('Failed to load calendar events. Using sample data.');
      // Don't block UI - fall back to empty arrays
      setLeaveRecords([]);
      setShiftAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const start = date.startOf('month').startOf('week');
    const end = date.endOf('month').endOf('week');
    const days = [];
    
    let current = start;
    while (current.isBefore(end) || current.isSame(end)) {
      days.push(current);
      current = current.add(1, 'day');
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };

  const formatMonthYear = (date) => {
    return date.format('MMMM YYYY');
  };

  const getEventsForDate = (date) => {
    const events = [];
    const dateString = date.format('YYYY-MM-DD');
    
    // Add leave events (REAL DATA)
    leaveRecords.forEach(leave => {
      const leaveStart = dayjs(leave.startDate).format('YYYY-MM-DD');
      const leaveEnd = dayjs(leave.endDate).format('YYYY-MM-DD');
      
      if (dateString >= leaveStart && dateString <= leaveEnd) {
        const employeeName = leave.user 
          ? `${leave.user.firstName || ''} ${leave.user.lastName || ''}`.trim()
          : 'Unknown';
        
        events.push({
          type: 'leave',
          title: `${employeeName} - ${leave.type || 'Leave'}`,
          time: 'All day',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: '🏖️',
          data: leave
        });
      }
    });
    
    // Add shift events (REAL DATA)
    shiftAssignments.forEach(shift => {
      const shiftDate = dayjs(shift.date).format('YYYY-MM-DD');
      
      if (shiftDate === dateString) {
        const employeeName = shift.employeeId
          ? `${shift.employeeId.firstName || ''} ${shift.employeeId.lastName || ''}`.trim()
          : 'Unassigned';
        
        events.push({
          type: 'shift',
          title: `${employeeName} - ${shift.location || 'Shift'}`,
          time: `${shift.startTime || ''} - ${shift.endTime || ''}`,
          color: shift.status === 'Completed' 
            ? 'bg-green-100 text-green-800 border-green-200'
            : shift.status === 'Missed' || shift.status === 'Cancelled'
            ? 'bg-red-100 text-red-800 border-red-200'
            : 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '👔',
          data: shift
        });
      }
    });
    
    return events;
  };

  // NEW: Handle day expansion
  const handleDayClick = (date) => {
    const dateString = date.format('YYYY-MM-DD');
    
    if (expandedDay === dateString) {
      // Close if clicking the same day
      setExpandedDay(null);
      setDayDetails([]);
      setActiveTab('all');
    } else {
      // Expand the clicked day
      setExpandedDay(dateString);
      fetchDayDetails(date);
    }
  };

  // NEW: Fetch detailed information for a specific day
  const fetchDayDetails = async (date) => {
    const dateString = date.format('YYYY-MM-DD');
    const details = [];
    
    // Process leave records for this day
    leaveRecords.forEach(leave => {
      const leaveStart = dayjs(leave.startDate).format('YYYY-MM-DD');
      const leaveEnd = dayjs(leave.endDate).format('YYYY-MM-DD');
      
      if (dateString >= leaveStart && dateString <= leaveEnd) {
        const employeeName = leave.user 
          ? `${leave.user.firstName || ''} ${leave.user.lastName || ''}`.trim()
          : 'Unknown';
        
        const duration = dayjs(leave.endDate).diff(dayjs(leave.startDate), 'day') + 1;
        const isLongTerm = duration > 7;
        
        details.push({
          id: leave._id,
          type: 'leave',
          employeeName,
          startDate: dayjs(leave.startDate).format('ddd D MMM YY'),
          endDate: dayjs(leave.endDate).format('ddd D MMM YY'),
          duration: `${duration} day${duration > 1 ? 's' : ''}`,
          leaveType: leave.type || 'Annual leave',
          category: isLongTerm ? 'long-term' : 'short-term',
          status: leave.status || 'approved',
          icon: '🏖️',
          color: isLongTerm ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
        });
      }
    });
    
    // Process shift assignments for this day
    shiftAssignments.forEach(shift => {
      const shiftDate = dayjs(shift.date).format('YYYY-MM-DD');
      
      if (shiftDate === dateString) {
        const employeeName = shift.employeeId
          ? `${shift.employeeId.firstName || ''} ${shift.employeeId.lastName || ''}`.trim()
          : 'Unassigned';
        
        details.push({
          id: shift._id,
          type: 'shift',
          employeeName,
          startDate: dayjs(shift.date).format('ddd D MMM YY'),
          endDate: dayjs(shift.date).format('ddd D MMM YY'),
          duration: '1 day',
          leaveType: `${shift.location || 'Shift'} - ${shift.startTime || ''} to ${shift.endTime || ''}`,
          category: 'shift',
          status: shift.status || 'Scheduled',
          icon: '👔',
          color: shift.status === 'Completed' 
            ? 'bg-green-100 text-green-800'
            : shift.status === 'Missed' || shift.status === 'Cancelled'
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        });
      }
    });
    
    setDayDetails(details);
  };

  // NEW: Filter details based on active tab
  const getFilteredDetails = () => {
    switch (activeTab) {
      case 'short-term':
        return dayDetails.filter(detail => detail.category === 'short-term');
      case 'long-term':
        return dayDetails.filter(detail => detail.category === 'long-term');
      default:
        return dayDetails;
    }
  };

  // NEW: Get tab counts
  const getTabCounts = () => {
    const all = dayDetails.length;
    const shortTerm = dayDetails.filter(detail => detail.category === 'short-term').length;
    const longTerm = dayDetails.filter(detail => detail.category === 'long-term').length;
    
    return { all, shortTerm, longTerm };
  };

  // Load employees when modal opens (REAL DATA)
  const loadEmployees = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/employees`);
      const employeeData = response.data.data || [];
      
      // Transform to format expected by modal
      const formattedEmployees = employeeData.map(emp => ({
        id: emp._id,
        name: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        department: emp.department
      }));
      
      setEmployees(formattedEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Failed to load employees');
    }
  };

  // Check if selected dates include weekends
  const checkWeekendDays = (start, end) => {
    if (!start || !end) {
      setWeekendWarning('');
      return;
    }

    try {
      // Ensure we have dayjs objects
      let startDate, endDate;
      
      if (dayjs.isDayjs(start)) {
        startDate = start;
      } else if (start instanceof Date) {
        startDate = dayjs(start);
      } else if (typeof start === 'object' && start.$d) {
        startDate = dayjs(start.$d);
      } else {
        startDate = dayjs(start);
      }
      
      if (dayjs.isDayjs(end)) {
        endDate = end;
      } else if (end instanceof Date) {
        endDate = dayjs(end);
      } else if (typeof end === 'object' && end.$d) {
        endDate = dayjs(end.$d);
      } else {
        endDate = dayjs(end);
      }

      // Validate the dayjs objects
      if (!startDate.isValid() || !endDate.isValid()) {
        setWeekendWarning('');
        return;
      }

      let hasWeekend = false;
      let current = startDate;
      const endDay = endDate;

      while (current.isSameOrBefore(endDay)) {
        if (current.day() === 0 || current.day() === 6) { // Sunday or Saturday
          hasWeekend = true;
          break;
        }
        current = current.add(1, 'day');
      }

      if (hasWeekend) {
        setWeekendWarning('Saturday is not a working day');
      } else {
        setWeekendWarning('');
      }
    } catch (error) {
      console.error('Weekend check error:', error);
      setWeekendWarning('');
    }
  };

  // Calculate working days between dates
  const calculateWorkingDays = (start, end) => {
    if (!start || !end) return 0;
    
    try {
      // Ensure we have dayjs objects
      let startDate, endDate;
      
      if (dayjs.isDayjs(start)) {
        startDate = start;
      } else if (start instanceof Date) {
        startDate = dayjs(start);
      } else if (typeof start === 'object' && start.$d) {
        startDate = dayjs(start.$d);
      } else {
        startDate = dayjs(start);
      }
      
      if (dayjs.isDayjs(end)) {
        endDate = end;
      } else if (end instanceof Date) {
        endDate = dayjs(end);
      } else if (typeof end === 'object' && end.$d) {
        endDate = dayjs(end.$d);
      } else {
        endDate = dayjs(end);
      }

      // Validate the dayjs objects
      if (!startDate.isValid() || !endDate.isValid()) {
        return 0;
      }
      
      let workingDays = 0;
      let current = startDate;
      const endDay = endDate;

      while (current.isSameOrBefore(endDay)) {
        if (current.day() !== 0 && current.day() !== 6) { // Not Sunday or Saturday
          workingDays++;
        }
        current = current.add(1, 'day');
      }

      // Adjust for half days
      if (startHalfDay !== 'full') workingDays -= 0.5;
      if (endHalfDay !== 'full' && !startDate.isSame(endDate)) workingDays -= 0.5;

      return Math.max(0, workingDays);
    } catch (error) {
      console.error('Working days calculation error:', error);
      return 0;
    }
  };

  // Handle date changes
  const handleStartDateChange = (date) => {
    // Handle different types of date objects from DatePicker
    let dayjsDate = null;
    
    if (date) {
      try {
        if (dayjs.isDayjs(date)) {
          dayjsDate = date;
        } else if (date instanceof Date) {
          dayjsDate = dayjs(date);
        } else if (typeof date === 'object' && date.$d) {
          // Handle moment-like objects
          dayjsDate = dayjs(date.$d);
        } else if (typeof date === 'string') {
          dayjsDate = dayjs(date);
        } else {
          // Last resort - try to convert
          dayjsDate = dayjs(date);
        }
      } catch (error) {
        console.error('Date conversion error:', error);
        dayjsDate = null;
      }
    }
    
    setStartDate(dayjsDate);
    checkWeekendDays(dayjsDate, endDate);
  };

  const handleEndDateChange = (date) => {
    // Handle different types of date objects from DatePicker
    let dayjsDate = null;
    
    if (date) {
      try {
        if (dayjs.isDayjs(date)) {
          dayjsDate = date;
        } else if (date instanceof Date) {
          dayjsDate = dayjs(date);
        } else if (typeof date === 'object' && date.$d) {
          // Handle moment-like objects
          dayjsDate = dayjs(date.$d);
        } else if (typeof date === 'string') {
          dayjsDate = dayjs(date);
        } else {
          // Last resort - try to convert
          dayjsDate = dayjs(date);
        }
      } catch (error) {
        console.error('Date conversion error:', error);
        dayjsDate = null;
      }
    }
    
    setEndDate(dayjsDate);
    checkWeekendDays(startDate, dayjsDate);
  };

  // Open modal
  const openTimeOffModal = () => {
    setShowTimeOffModal(true);
    loadEmployees();
  };

  // Close modal
  const closeTimeOffModal = () => {
    setShowTimeOffModal(false);
    setSelectedEmployee('');
    setStartDate(null);
    setEndDate(null);
    setStartHalfDay('full');
    setEndHalfDay('full');
    setWeekendWarning('');
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return selectedEmployee && startDate && endDate && !weekendWarning;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600">Manage your schedule and view upcoming events</p>
        
        {/* Error Alert */}
        {error && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">Loading calendar events...</p>
          </div>
        )}
      </div>

      {/* Calendar Section */}
      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium">{formatMonthYear(currentDate)}</span>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={openTimeOffModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Time Off</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <ArrowPathIcon className="h-4 w-4" />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {getDaysInMonth(currentDate).map((date, index) => {
            const isCurrentMonth = date.isSame(currentDate, 'month');
            const isToday = date.isSame(dayjs(), 'day');
            const isSelected = date.isSame(selectedDate, 'day');
            const events = getEventsForDate(date);
            
            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 border-r border-b cursor-pointer transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${isToday ? 'bg-blue-50' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''} hover:bg-gray-50`}
                onClick={() => handleDayClick(date)}
              >
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {date.format('D')}
                </div>
                
                {/* Events */}
                <div className="mt-1 space-y-1">
                  {events.slice(0, 2).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`text-xs p-1 rounded border ${event.color} truncate`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-xs text-gray-500">+{events.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Day View */}
      {expandedDay && (
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {dayjs(expandedDay).format('dddd D MMMM')}
                </h2>
                <p className="text-gray-600">
                  {dayjs(expandedDay).format('MMMM YYYY')}
                </p>
              </div>
              <button
                onClick={() => {
                  setExpandedDay(null);
                  setDayDetails([]);
                  setActiveTab('all');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All ({getTabCounts().all})
              </button>
              <button
                onClick={() => setActiveTab('short-term')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'short-term'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Short-term absences ({getTabCounts().shortTerm})
              </button>
              <button
                onClick={() => setActiveTab('long-term')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'long-term'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Long-term absences ({getTabCounts().longTerm})
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {getFilteredDetails().length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <CalendarDaysIcon className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-500">No events found for this day</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredDetails().map((detail) => (
                  <div
                    key={detail.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{detail.icon}</div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {detail.employeeName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {detail.startDate} - {detail.endDate}
                        </p>
                        <p className="text-sm text-gray-500">
                          {detail.duration} • {detail.leaveType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${detail.color}`}>
                        {detail.status}
                      </span>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time Off Modal */}
      {showTimeOffModal && (
        <div className="fixed inset-0 z-50 flex">
          {/* Dark backdrop */}
          <div 
            className="flex-1 bg-black/50"
            onClick={closeTimeOffModal}
          ></div>

          {/* Modal content */}
          <div className="w-full max-w-2xl bg-white shadow-xl overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Time Off</h2>
              <button
                onClick={closeTimeOffModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Employee Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee <span className="text-red-500">*</span>
                </label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={handleStartDateChange}
                    required
                    className="w-full"
                  />
                  <div className="mt-2">
                    <Select value={startHalfDay} onValueChange={setStartHalfDay}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Day</SelectItem>
                        <SelectItem value="first">First Half</SelectItem>
                        <SelectItem value="second">Second Half</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={handleEndDateChange}
                    required
                    minDate={startDate}
                    className="w-full"
                  />
                  <div className="mt-2">
                    <Select value={endHalfDay} onValueChange={setEndHalfDay}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Day</SelectItem>
                        <SelectItem value="first">First Half</SelectItem>
                        <SelectItem value="second">Second Half</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Weekend Warning */}
              {weekendWarning && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">{weekendWarning}</p>
                </div>
              )}

              {/* Summary */}
              {startDate && endDate && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    You were off from <strong>{startDate.format('dddd, D MMMM YYYY')}</strong> until{' '}
                    <strong>{endDate.format('dddd, D MMMM YYYY')}</strong> and{' '}
                    <strong>{calculateWorkingDays(startDate, endDate)} day(s)</strong> will be deducted from your entitlement.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeTimeOffModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isFormValid()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!isFormValid()}
                >
                  Add Absence
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
