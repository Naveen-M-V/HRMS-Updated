const mongoose = require('mongoose');

/**
 * Formal Performance Review Model
 * 
 * This model implements a formal review system where:
 * - Admins create and write performance feedback
 * - Reviews go through DRAFT -> SUBMITTED -> COMPLETED lifecycle
 * - Once COMPLETED, reviews become immutable permanent records
 * - Employees can view and add comments, but cannot edit admin feedback
 * 
 * This is NOT for goals/KPIs - it's for formal performance discussions.
 */
const reviewSchema = new mongoose.Schema({
    // === BASIC INFO ===
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeHub',
        required: true,
        index: true
    },
    
    reviewType: {
        type: String,
        enum: ['ANNUAL', 'PROBATION', 'AD_HOC'],
        required: true,
        default: 'AD_HOC'
    },
    
    // === REVIEW PERIOD ===
    reviewPeriodStart: {
        type: Date,
        required: false
    },
    
    reviewPeriodEnd: {
        type: Date,
        required: false
    },
    
    // === ADMIN FEEDBACK (Read-only after COMPLETED) ===
    performanceSummary: {
        type: String,
        required: false, // Required before submission, but can save draft without it
        maxlength: 5000
    },
    
    strengths: {
        type: String,
        maxlength: 2000
    },
    
    improvements: {
        type: String,
        maxlength: 2000
    },
    
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    
    // === LIFECYCLE STATUS ===
    status: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'],
        default: 'DRAFT',
        required: true,
        index: true
    },
    
    // === AUDIT FIELDS ===
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeHub',
        required: true
    },
    
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeHub'
    },
    
    completedAt: {
        type: Date
    },
    
    // === LEGACY FIELDS (for backward compatibility with Goal-based reviews) ===
    reviewTitle: {
        type: String,
        trim: true
    },
    
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeHub'
    },
    
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeHub'
    },
    
    startDate: {
        type: Date
    },
    
    dueDate: {
        type: Date
    },
    
    linkedGoal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Goal'
    },
    
    notes: {
        type: String,
        default: ''
    },
    
    completedDate: {
        type: Date
    }
}, {
    timestamps: true
});

// === INDEXES FOR PERFORMANCE ===
reviewSchema.index({ employee: 1, status: 1 });
reviewSchema.index({ employee: 1, reviewType: 1 });
reviewSchema.index({ createdBy: 1 });
reviewSchema.index({ completedAt: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });

// Legacy indexes (for backward compatibility)
reviewSchema.index({ assignedTo: 1, status: 1 });
reviewSchema.index({ manager: 1 });
reviewSchema.index({ linkedGoal: 1 });

// === PRE-SAVE VALIDATION ===
reviewSchema.pre('save', function(next) {
    // If marking as COMPLETED, ensure required fields are present
    if (this.status === 'COMPLETED') {
        if (!this.performanceSummary) {
            return next(new Error('Performance summary is required before completing a review'));
        }
        
        if (!this.completedBy) {
            return next(new Error('completedBy is required when marking review as COMPLETED'));
        }
        
        if (!this.completedAt) {
            this.completedAt = new Date();
        }
    }
    
    // If marking as SUBMITTED, ensure performance summary exists
    if (this.status === 'SUBMITTED' && !this.performanceSummary) {
        return next(new Error('Performance summary is required before submitting a review'));
    }
    
    next();
});

// === INSTANCE METHODS ===

/**
 * Check if review can be edited
 * Only DRAFT reviews can be edited by admins
 */
reviewSchema.methods.canEdit = function() {
    return this.status === 'DRAFT';
};

/**
 * Check if review is visible to employee
 * Employees can only see SUBMITTED or COMPLETED reviews
 */
reviewSchema.methods.isVisibleToEmployee = function() {
    return this.status === 'SUBMITTED' || this.status === 'COMPLETED';
};

/**
 * Check if review is immutable
 * COMPLETED reviews cannot be modified
 */
reviewSchema.methods.isImmutable = function() {
    return this.status === 'COMPLETED';
};

// === STATIC METHODS ===

/**
 * Get reviews for an employee (employee view)
 * Only returns SUBMITTED or COMPLETED reviews
 */
reviewSchema.statics.getEmployeeReviews = function(employeeId) {
    return this.find({
        employee: employeeId,
        status: { $in: ['SUBMITTED', 'COMPLETED'] }
    })
    .populate('createdBy', 'firstName lastName email')
    .populate('completedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

/**
 * Get all reviews (admin view)
 * Returns all reviews regardless of status
 */
reviewSchema.statics.getAdminReviews = function(filters = {}) {
    const query = {};
    
    if (filters.status) {
        query.status = filters.status;
    }
    
    if (filters.reviewType) {
        query.reviewType = filters.reviewType;
    }
    
    if (filters.employeeId) {
        query.employee = filters.employeeId;
    }
    
    return this.find(query)
        .populate('employee', 'firstName lastName email employeeId')
        .populate('createdBy', 'firstName lastName email')
        .populate('completedBy', 'firstName lastName email')
        .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Review', reviewSchema);
