const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewTitle: {
        type: String,
        required: true,
        trim: true
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeHub',
        required: false
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeHub',
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
    status: {
        type: String,
        enum: ['Not complete', 'Completed'],
        default: 'Not complete'
    },
    linkedGoal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal',
        required: false
    },
    reviewType: {
        type: String,
        enum: ['Goal-based', 'Performance', 'Annual', 'Probation'],
        default: 'Goal-based'
    },
    completedDate: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
reviewSchema.index({ assignedTo: 1, status: 1 });
reviewSchema.index({ manager: 1 });
reviewSchema.index({ linkedGoal: 1 });

module.exports = mongoose.model('Review', reviewSchema);
