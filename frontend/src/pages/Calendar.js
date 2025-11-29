import React, { useState } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState('month'); // month, week, day

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

  const getWeekDays = (date) => {
    const start = date.startOf('week');
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      days.push(start.add(i, 'day'));
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };

  const handlePrevWeek = () => {
    setCurrentDate(currentDate.subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setCurrentDate(currentDate.add(1, 'week'));
  };

  const formatMonthYear = (date) => {
    return date.format('MMMM YYYY');
  };

  const formatWeekRange = (date) => {
    const start = date.startOf('week');
    const end = date.endOf('week');
    return `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`;
  };

  const getEventsForDate = (date) => {
    // Sample events - in real app, these would come from API
    const events = [];
    const dateStr = date.format('YYYY-MM-DD');
    
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

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">{formatMonthYear(currentDate)}</h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((date, index) => {
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
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays(currentDate);
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM
    
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Week Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">{formatWeekRange(currentDate)}</h2>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Week Grid */}
        <div className="flex">
          {/* Time Column */}
          <div className="w-20 border-r">
            <div className="h-12 border-b"></div>
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b text-xs text-gray-500 p-2">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {days.map((date, index) => {
            const events = getEventsForDate(date);
            const isToday = date.isSame(dayjs(), 'day');
            
            return (
              <div key={index} className="flex-1 border-r last:border-r-0">
                {/* Day Header */}
                <div className={`h-12 border-b p-2 text-center ${isToday ? 'bg-blue-50' : ''}`}>
                  <div className="text-sm font-medium">{date.format('ddd')}</div>
                  <div className={`text-lg ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {date.format('D')}
                  </div>
                </div>
                
                {/* Hour Slots */}
                {hours.map(hour => (
                  <div key={hour} className="h-16 border-b relative">
                    {/* Sample events */}
                    {events.map((event, eventIndex) => {
                      const eventHour = parseInt(event.time.split(':')[0]);
                      if (eventHour === hour) {
                        return (
                          <div
                            key={eventIndex}
                            className={`absolute inset-x-1 top-1 p-1 rounded text-xs ${event.color}`}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-xs opacity-75">{event.time}</div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM
    const events = getEventsForDate(selectedDate);
    
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Day Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{selectedDate.format('dddd, MMMM D, YYYY')}</h2>
            <p className="text-sm text-gray-500">Today's Schedule</p>
          </div>
        </div>

        {/* Day Schedule */}
        <div className="flex">
          {/* Time Column */}
          <div className="w-20 border-r">
            {hours.map(hour => (
              <div key={hour} className="h-20 border-b text-xs text-gray-500 p-2">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Schedule Column */}
          <div className="flex-1">
            {hours.map(hour => (
              <div key={hour} className="h-20 border-b relative hover:bg-gray-50">
                {/* Events for this hour */}
                {events.map((event, eventIndex) => {
                  const eventHour = parseInt(event.time.split(':')[0]);
                  if (eventHour === hour) {
                    return (
                      <div
                        key={eventIndex}
                        className={`absolute inset-x-2 top-2 p-3 rounded-lg ${event.color}`}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm opacity-75">{event.time}</div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600">Manage your schedule and view upcoming events</p>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => setViewMode('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'month' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => setViewMode('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'week' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => setViewMode('day')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'day' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Day
        </button>
      </div>

      {/* Calendar Views */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">12</div>
              <div className="text-sm text-gray-500">Shifts This Month</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-500">Team Meetings</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">2</div>
              <div className="text-sm text-gray-500">Deadlines</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
