const mongoose = require('mongoose');

/**
 * Time Entry Schema
 * Tracks employee clock in/out times and breaks
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

// Calculate total hours worked
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

// Pre-save hook to calculate total hours
timeEntrySchema.pre('save', function(next) {
  if (this.clockOut) {
    this.totalHours = this.calculateTotalHours();
    this.status = 'clocked_out';
  }
  next();
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
