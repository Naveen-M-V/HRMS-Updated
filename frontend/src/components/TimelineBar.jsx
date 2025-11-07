import React from 'react';

const TIMELINE_START = 5;   // 05:00
const TIMELINE_END = 23;    // 23:00
const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START;

const segmentColors = {
  late: '#EF4444',      // Red
  working: '#3B82F6',   // Blue
  break: '#06B6D4',     // Cyan
  overtime: '#F97316',  // Orange
  dayoff: '#EAB308'     // Yellow
};

// Convert time string "HH:MM" to decimal hours
const timeToDecimal = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
};

// Calculate percentage position within timeline
const getPositionPercent = (time) => {
  const decimal = timeToDecimal(time);
  const offset = decimal - TIMELINE_START;
  return Math.max(0, Math.min(100, (offset / TIMELINE_HOURS) * 100));
};

export const TimelineBar = ({ segments }) => {
  // Generate time labels (05:00, 07:00, 09:00, 11:00, 13:00, 15:00, 17:00, 19:00, 21:00, 23:00)
  const timeLabels = [];
  for (let hour = 5; hour <= 23; hour += 2) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    timeLabels.push({
      time,
      position: getPositionPercent(time)
    });
  }

  return (
    <div className="relative w-full">
      {/* Time Labels */}
      <div className="relative w-full h-5 mb-1">
        {timeLabels.map((label, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${label.position}%`,
              transform: 'translateX(-50%)',
              fontSize: '11px',
              color: '#9CA3AF',
              fontWeight: 400
            }}
          >
            {label.time}
          </div>
        ))}
      </div>

      {/* Timeline Bar Container */}
      <div className="relative w-full">
        <div 
          className="relative w-full bg-slate-100 rounded overflow-hidden"
          style={{ height: '32px' }}
        >
          {/* Render Segments */}
          {segments.map((segment, index) => {
            const leftPercent = getPositionPercent(segment.startTime);
            const rightPercent = getPositionPercent(segment.endTime);
            const widthPercent = rightPercent - leftPercent;
            
            // Calculate if there's a next segment for gap
            const isLastSegment = index === segments.length - 1;
            const nextSegment = !isLastSegment ? segments[index + 1] : null;
            const hasGap = nextSegment && timeToDecimal(nextSegment.startTime) > timeToDecimal(segment.endTime);

            return (
              <div
                key={index}
                className="absolute top-0 h-full flex items-center justify-center"
                style={{
                  left: `${leftPercent}%`,
                  width: hasGap ? `calc(${widthPercent}% - 4px)` : `${widthPercent}%`,
                  backgroundColor: segmentColors[segment.type],
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 500,
                  borderRadius: '3px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {widthPercent > 6 && segment.label}
              </div>
            );
          })}
        </div>
        
        {/* End stopper line */}
        <div
          className="absolute top-0"
          style={{
            right: '0',
            width: '1px',
            height: '32px',
            backgroundColor: '#94A3B8'
          }}
        />
      </div>
    </div>
  );
};

export default TimelineBar;
