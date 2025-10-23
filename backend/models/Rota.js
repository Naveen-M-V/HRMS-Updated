const mongoose = require('mongoose');

/**
 * Rota Model
 * Stores individual shift assignments for employees
 * Each rota entry represents one employee's shift on a specific date
 */
const rotaSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee reference is required']
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: [true, 'Shift reference is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  status: {
    type: String,
    enum: ['Assigned', 'Confirmed', 'Swapped', 'Cancelled'],
    default: 'Assigned'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate assignments
rotaSchema.index({ employee: 1, date: 1 }, { unique: true });

// Index for date range queries
rotaSchema.index({ date: 1 });

module.exports = mongoose.model('Rota', rotaSchema);
