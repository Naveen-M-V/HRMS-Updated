import React, { useState } from 'react';
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
import { DatePicker } from './ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
    // Sample events - in real app, these would come from API
    const events = [];
    
    // Sample shift assignments
    if (date.day() === 1 || date.day() === 3) { // Monday, Wednesday
      events.push({
        type: 'shift',
        title: 'Morning Shift',
        time: '09:00 - 17:00',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      });
    }
    
    // Sample meetings
    if (date.date() === 15) {
      events.push({
        type: 'meeting',
        title: 'Team Standup',
        time: '10:00 - 10:30',
        color: 'bg-green-100 text-green-800 border-green-200'
      });
    }
    
    // Sample deadlines
    if (date.date() === 30) {
      events.push({
        type: 'deadline',
        title: 'Project Deadline',
        time: 'End of Day',
        color: 'bg-red-100 text-red-800 border-red-200'
      });
    }
    
    return events;
  };

  // Load employees when modal opens
  const loadEmployees = async () => {
    try {
      // Sample employees - in real app, fetch from API
      const sampleEmployees = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
        { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com' }
      ];
      setEmployees(sampleEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  // Check if selected dates include weekends
  const checkWeekendDays = (start, end) => {
    if (!start || !end) {
      setWeekendWarning('');
      return;
    }

    let hasWeekend = false;
    let current = dayjs(start);
    const endDay = dayjs(end);

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
  };

  // Calculate working days between dates
  const calculateWorkingDays = (start, end) => {
    if (!start || !end) return 0;
    
    let workingDays = 0;
    let current = dayjs(start);
    const endDay = dayjs(end);

    while (current.isSameOrBefore(endDay)) {
      if (current.day() !== 0 && current.day() !== 6) { // Not Sunday or Saturday
        workingDays++;
      }
      current = current.add(1, 'day');
    }

    // Adjust for half days
    if (startHalfDay !== 'full') workingDays -= 0.5;
    if (endHalfDay !== 'full' && !dayjs(start).isSame(dayjs(end))) workingDays -= 0.5;

    return Math.max(0, workingDays);
  };

  // Handle date changes
  const handleStartDateChange = (date) => {
    setStartDate(date);
    checkWeekendDays(date, endDate);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    checkWeekendDays(startDate, date);
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
                onClick={() => setSelectedDate(date)}
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
                    You were off from <strong>{dayjs(startDate).format('dddd, D MMMM YYYY')}</strong> until{' '}
                    <strong>{dayjs(endDate).format('dddd, D MMMM YYYY')}</strong> and{' '}
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
