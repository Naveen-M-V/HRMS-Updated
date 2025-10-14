import React, { useMemo } from 'react';
import { Eventcalendar, setOptions } from '@mobiscroll/react';
import '@mobiscroll/react/dist/css/mobiscroll.min.css';

/**
 * ShiftTimeline Component
 * Displays employee shift schedules using Mobiscroll Timeline
 * Inspired by: https://demo.mobiscroll.com/react/timeline/employee-shifts
 */

setOptions({
  theme: 'ios',
  themeVariant: 'light'
});

const ShiftTimeline = ({ rotaData, view = 'week', onEventClick }) => {
  
  /**
   * Transform rota data to Mobiscroll event format
   * Each event needs: id, start, end, resource, title, color
   */
  const events = useMemo(() => {
    if (!rotaData || rotaData.length === 0) return [];

    return rotaData.map((rota) => {
      const eventDate = new Date(rota.date);
      const [startHour, startMin] = rota.shift.startTime.split(':').map(Number);
      const [endHour, endMin] = rota.shift.endTime.split(':').map(Number);

      const start = new Date(eventDate);
      start.setHours(startHour, startMin, 0);

      const end = new Date(eventDate);
      end.setHours(endHour, endMin, 0);

      // Handle overnight shifts (e.g., Evening: 17:00-01:00)
      if (endHour < startHour) {
        end.setDate(end.getDate() + 1);
      }

      return {
        id: rota._id,
        start: start.toISOString(),
        end: end.toISOString(),
        resource: rota.employee._id,
        title: rota.shift.name,
        color: rota.shift.color || '#3b82f6',
        status: rota.status,
        employeeName: rota.employee.name,
        department: rota.employee.department,
        shiftTime: `${rota.shift.startTime} - ${rota.shift.endTime}`
      };
    });
  }, [rotaData]);

  /**
   * Create resource list (employees)
   */
  const resources = useMemo(() => {
    if (!rotaData || rotaData.length === 0) return [];

    const uniqueEmployees = {};
    rotaData.forEach((rota) => {
      if (!uniqueEmployees[rota.employee._id]) {
        uniqueEmployees[rota.employee._id] = {
          id: rota.employee._id,
          name: rota.employee.name,
          department: rota.employee.department
        };
      }
    });

    return Object.values(uniqueEmployees);
  }, [rotaData]);

  /**
   * Timeline view configuration
   */
  const calendarView = useMemo(() => {
    return {
      timeline: {
        type: view === 'month' ? 'month' : 'week',
        startDay: 1, // Monday
        endDay: 5,   // Friday (skip weekends)
        startTime: '00:00',
        endTime: '24:00'
      }
    };
  }, [view]);

  /**
   * Handle event click
   */
  const handleEventClick = (args) => {
    if (onEventClick) {
      const eventData = events.find(e => e.id === args.event.id);
      onEventClick(eventData);
    }
  };

  /**
   * Custom event rendering
   */
  const renderEvent = (data) => {
    return (
      <div className="shift-event" style={{ padding: '8px' }}>
        <div style={{ fontWeight: '600', fontSize: '14px' }}>
          {data.original.title}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          {data.original.shiftTime}
        </div>
      </div>
    );
  };

  /**
   * Custom resource rendering
   */
  const renderResource = (resource) => {
    return (
      <div style={{ padding: '12px' }}>
        <div style={{ fontWeight: '600', fontSize: '14px' }}>
          {resource.name}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          {resource.department}
        </div>
      </div>
    );
  };

  if (!rotaData || rotaData.length === 0) {
    return (
      <div className="no-data-message" style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#6b7280',
        fontSize: '16px'
      }}>
        <svg 
          style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.5 }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
        <p>No shift schedules found. Generate a rota to get started.</p>
      </div>
    );
  }

  return (
    <div className="shift-timeline-container" style={{ 
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      <Eventcalendar
        data={events}
        resources={resources}
        view={calendarView}
        onEventClick={handleEventClick}
        renderScheduleEvent={renderEvent}
        renderResource={renderResource}
        cssClass="shift-timeline"
        height={600}
      />
    </div>
  );
};

export default ShiftTimeline;
