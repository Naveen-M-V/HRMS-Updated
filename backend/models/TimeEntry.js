const mongoose = require('mongoose');

/**
 * Time Entry Schema
 * Tracks employee clock in/out times and breaks
 * NOW LINKED TO SHIFT ASSIGNMENTS
 */
const timeEntrySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  clockIn: {
    type: String, // Format: "HH:MM"
    required: true
  },
  clockOut: {
    type: String, // Format: "HH:MM"
    default: null
  },
  location: {
    type: String,
    enum: ['Work From Office', 'Work From Home', 'Field', 'Client Side'],
    default: 'Work From Office'
  },
  workType: {
    type: String,
    enum: ['Regular', 'Overtime', 'Weekend Overtime', 'Client-side Overtime'],
    default: 'Regular'
  },
  
  // ========== GPS LOCATION TRACKING ==========
  // Captures GPS coordinates during clock-in for attendance verification
  gpsLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    accuracy: {
      type: Number, // Accuracy in meters
      default: null
    },
    address: {
      type: String, // Reverse geocoded address from OpenStreetMap
      default: null
    },
    capturedAt: {
      type: Date,
      default: null
    }
  },
  // GPS location captured during clock-out
  gpsLocationOut: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    accuracy: {
      type: Number, // Accuracy in meters
      default: null
    },
    address: {
      type: String, // Reverse geocoded address
      default: null
    },
    capturedAt: {
      type: Date,
      default: null
    }
  },
  // ==========================================
  
  // ========== NEW: SHIFT LINKING ==========
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShiftAssignment',
    default: null
  },
  attendanceStatus: {
    type: String,
    enum: ['On Time', 'Late', 'Early', 'Unscheduled', 'Overtime'],
    default: 'On Time'
  },
  hoursWorked: {
    type: Number, // Calculated hours (excluding breaks)
    default: 0
  },
  scheduledHours: {
    type: Number, // Expected hours from shift
    default: 0
  },
  variance: {
    type: Number, // Difference between scheduled and actual (in hours)
    default: 0
  },
  // ========================================
  
  // ========== NEW: ON BREAK TRACKING ==========
  onBreakStart: {
    type: String, // Format: "HH:MM" - When current break started
    default: null
  },
  onBreakEnd: {
    type: String, // Format: "HH:MM" - When current break ended
    default: null
  },
  // ============================================
  
  breaks: [{
    startTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    endTime: {
      type: String, // Format: "HH:MM"
      required: true
    },
    duration: {
      type: Number, // Duration in minutes
      required: true
    },
    type: {
      type: String,
      enum: ['lunch', 'coffee', 'other'],
      default: 'other'
    }
  }],
  totalHours: {
    type: Number, // Total hours worked (excluding breaks)
    default: 0
  },
  status: {
    type: String,
    enum: ['clocked_in', 'clocked_out', 'on_break'],
    default: 'clocked_in'
  },
  notes: {
    type: String,
    default: ''
  },
  isManualEntry: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
timeEntrySchema.index({ employee: 1, date: -1 });
timeEntrySchema.index({ date: -1 });
timeEntrySchema.index({ status: 1 });
timeEntrySchema.index({ shiftId: 1 });
timeEntrySchema.index({ attendanceStatus: 1 });

/**
 * Calculate total hours worked (excluding breaks)
 */
timeEntrySchema.methods.calculateTotalHours = function() {
  if (!this.clockIn || !this.clockOut) return 0;
  
  const clockInTime = new Date(`2000-01-01T${this.clockIn}`);
  const clockOutTime = new Date(`2000-01-01T${this.clockOut}`);
  
  let totalMinutes = (clockOutTime - clockInTime) / (1000 * 60);
  
  // Subtract break time
  this.breaks.forEach(breakItem => {
    totalMinutes -= breakItem.duration;
  });
  
  return Math.max(0, totalMinutes / 60); // Convert to hours
};

/**
 * Calculate hours worked and variance from scheduled
 */
timeEntrySchema.methods.calculateHoursAndVariance = function() {
  const hoursWorked = this.calculateTotalHours();
  this.hoursWorked = hoursWorked;
  
  if (this.scheduledHours > 0) {
    this.variance = hoursWorked - this.scheduledHours;
  }
  
  return {
    hoursWorked,
    variance: this.variance
  };
};

// Pre-save hook to calculate total hours
timeEntrySchema.pre('save', function(next) {
  if (this.clockOut) {
    this.totalHours = this.calculateTotalHours();
    this.status = 'clocked_out';
    
    // Calculate variance if we have scheduled hours
    if (this.scheduledHours > 0) {
      this.hoursWorked = this.totalHours;
      this.variance = this.totalHours - this.scheduledHours;
    }
  }
  next();
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
