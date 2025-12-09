const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  goalName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeesHub',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  measurementType: {
    type: String,
    enum: ['Yes/No', 'Progress (%)', 'Numeric Target', 'Milestones'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Not started', 'In progress', 'Completed', 'Overdue'],
    default: 'Not started'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  targetValue: {
    type: Number,
    default: null
  },
  currentValue: {
    type: Number,
    default: 0
  },
  milestones: [{
    name: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: Date
  }]
}, {
  timestamps: true
});

// Index for faster queries
goalSchema.index({ assignee: 1, status: 1 });
goalSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Goal', goalSchema);
