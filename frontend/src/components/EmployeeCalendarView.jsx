import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import axios from '../utils/axiosConfig';
import { toast } from 'react-toastify';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

const EmployeeCalendarView = ({ userProfile }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [shiftAssignments, setShiftAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyCalendarData();
  }, [currentDate]);

  const fetchMyCalendarData = async () => {
    if (!userProfile?._id) return;
    
    setLoading(true);
    
    try {
      const startOfMonth = currentDate.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = currentDate.endOf('month').format('YYYY-MM-DD');
      
      // Fetch MY approved leaves only
      const leaveResponse = await axios.get('/api/leave/calendar', {
        params: {
          employeeId: userProfile._id,
          startDate: startOfMonth,
          endDate: endOfMonth
        }
      });
      
      // Fetch MY shift assignments only
      const shiftResponse = await axios.get(`/api/rota/shift-assignments/employee/${userProfile._id}`, {
        params: {
          startDate: startOfMonth,
          endDate: endOfMonth
        }
      });
      
      console.log('📅 Employee Calendar - Shifts API Response:', shiftResponse.data);
      console.log('📅 Employee Calendar - Leave Records:', leaveResponse.data.data || []);
      
      setLeaveRecords(leaveResponse.data.data || []);
      setShiftAssignments(shiftResponse.data.data || []);
      
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
      setLeaveRecords([]);
      setShiftAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTimeOff = () => {
    // Navigate to leave request (open in same page, different tab)
    navigate('/user-dashboard?tab=leave');
  };

  const getDaysInMonth = (date) => {
    const startOfMonth = date.startOf('month');
    const endOfMonth = date.endOf('month');
    const daysInMonth = endOfMonth.date();
    const startDay = startOfMonth.day();

    const days = [];
    // Previous month days
    for (let i = 0; i < startDay; i++) {
      days.push(startOfMonth.subtract(startDay - i, 'day'));
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(date.date(i));
    }
    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(endOfMonth.add(i, 'day'));
    }

    return days;
  };

  const getEventsForDate = (date) => {
    const events = [];
    const dateStr = date.format('YYYY-MM-DD');

    // Add leave events
    leaveRecords.forEach(leave => {
      const leaveStart = dayjs(leave.startDate);
      const leaveEnd = dayjs(leave.endDate);
      
      if (date.isBetween(leaveStart, leaveEnd, 'day', '[]')) {
        events.push({
          type: 'leave',
          title: leave.leaveType || 'Leave',
          color: 'bg-amber-100 border-amber-300 text-amber-800',
          data: leave
        });
      }
    });

    // Add shift events
    shiftAssignments.forEach(shift => {
      const shiftDate = dayjs(shift.date);
      
      if (date.isSame(shiftDate, 'day')) {
        events.push({
          type: 'shift',
          title: 'Shift',
          time: `${shift.startTime} - ${shift.endTime}`,
          location: shift.location,
          color: 'bg-blue-100 border-blue-300 text-blue-800',
          data: shift
        });
      }
    });

    return events;
  };

  const handleDayClick = (date) => {
    const events = getEventsForDate(date);
    setSelectedDate(date);
    setSelectedDayEvents(events);
    if (events.length > 0) {
      setShowDayDetailsModal(true);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(direction === 'prev' 
      ? currentDate.subtract(1, 'month')
      : currentDate.add(1, 'month')
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Calendar</h2>
        <button
          onClick={handleRequestTimeOff}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Request time off</span>
        </button>
      </div>

      <p className="text-sm text-gray-600">View your shifts and approved leave days</p>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          <div className="text-lg font-semibold text-gray-900">
            {currentDate.format('MMMM YYYY')}
          </div>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
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
                      className={`text-xs p-1 rounded border ${event.color}`}
                      title={`${event.title}${event.time ? ` (${event.time})` : ''}`}
                    >
                      <div className="font-semibold truncate">
                        {event.title}
                      </div>
                      {event.time && event.type === 'shift' && (
                        <div className="text-[10px] opacity-75 truncate">
                          {event.time}
                        </div>
                      )}
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

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
          <span className="text-gray-700">Shift</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded"></div>
          <span className="text-gray-700">Leave</span>
        </div>
      </div>

      {/* Day Details Modal */}
      {showDayDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedDate.format('dddd, MMMM D, YYYY')}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowDayDetailsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-3">
                {selectedDayEvents.map((event, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border-l-4 ${event.color}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{event.title}</h3>
                        {event.type === 'shift' && (
                          <>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                              <ClockIcon className="h-4 w-4" />
                              <span>{event.time}</span>
                            </div>
                            {event.location && (
                              <div className="text-sm text-gray-600 mt-1">📍 {event.location}</div>
                            )}
                          </>
                        )}
                        {event.type === 'leave' && event.data.reason && (
                          <div className="text-sm text-gray-600 mt-2">
                            Reason: {event.data.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4">
              <button
                onClick={() => setShowDayDetailsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCalendarView;
