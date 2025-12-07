const mongoose = require('mongoose');

/**
 * Expense Model
 * Tracks employee expense claims and reimbursements
 */
const expenseSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeHub',
    required: [true, 'Employee reference is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'GBP',
    enum: ['GBP', 'USD', 'EUR']
  },
  category: {
    type: String,
    enum: ['Travel', 'Meals', 'Accommodation', 'Equipment', 'Training', 'Other'],
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  receiptUrl: {
    type: String,
    default: null
  },
  receiptFileName: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  paidAt: {
    type: Date,
    default: null
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
expenseSchema.index({ employee: 1, date: -1 });
expenseSchema.index({ status: 1, date: -1 });
expenseSchema.index({ category: 1, status: 1 });

// Virtual for display name
expenseSchema.virtual('displayAmount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
