const mongoose = require('mongoose');

/**
 * Employee Hub Model
 * Stores comprehensive employee information for the Employee Hub section
 * Includes personal details, job information, team assignments, and profile data
 */
const employeeHubSchema = new mongoose.Schema({
  // Personal Information
  title: {
    type: String,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Unspecified'],
    default: 'Unspecified'
  },
  ethnicity: {
    type: String,
    default: 'Unspecified'
  },
  dateOfBirth: {
    type: Date
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  phone: {
    type: String,
    trim: true
  },
  workPhone: {
    type: String,
    trim: true
  },
  profilePhoto: {
    type: String,
    required: false,
    trim: true
  },
  
  // Job Information
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  team: {
    type: String,
    required: false,
    trim: true
  },
  
  // Office/Location Information
  office: {
    type: String,
    required: [true, 'Office location is required'],
    trim: true
  },
  workLocation: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'On-site'
  },
  
  // Profile Display
  avatar: {
    type: String, // URL to avatar image
    default: null
  },
  initials: {
    type: String,
    trim: true,
    maxlength: 3
  },
  color: {
    type: String, // Hex color for avatar background
    default: '#3B82F6'
  },
  
  // Employment Details
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  probationEndDate: {
    type: Date
  },
  endDate: {
    type: Date,
    default: null
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Intern'],
    default: 'Full-time'
  },
  
  // Manager/Reporting
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeHub',
    default: null
  },
  
  // User Account Link
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave', 'Terminated'],
    default: 'Active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // BrightHR Integration
  brightHRRegistered: {
    type: Boolean,
    default: false
  },
  brightHRId: {
    type: String,
    default: null
  },
  
  // Address Information
  address1: {
    type: String,
    trim: true
  },
  address2: {
    type: String,
    trim: true
  },
  address3: {
    type: String,
    trim: true
  },
  townCity: {
    type: String,
    trim: true
  },
  county: {
    type: String,
    trim: true
  },
  postcode: {
    type: String,
    trim: true
  },

  // Emergency Contact Information
  emergencyContactName: {
    type: String,
    trim: true
  },
  emergencyContactRelation: {
    type: String,
    trim: true
  },
  emergencyContactPhone: {
    type: String,
    trim: true
  },
  emergencyContactEmail: {
    type: String,
    trim: true
  },

  // Salary Details
  salary: {
    type: String,
    default: '0'
  },
  rate: {
    type: String,
    trim: true
  },
  paymentFrequency: {
    type: String,
    trim: true
  },
  effectiveFrom: {
    type: Date
  },
  reason: {
    type: String,
    trim: true
  },
  payrollNumber: {
    type: String,
    trim: true
  },

  // Bank Details
  accountName: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  bankBranch: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  sortCode: {
    type: String,
    trim: true
  },

  // Tax & National Insurance
  taxCode: {
    type: String,
    trim: true
  },
  niNumber: {
    type: String,
    trim: true
  },

  // Passport Information
  passportNumber: {
    type: String,
    trim: true
  },
  passportCountry: {
    type: String,
    trim: true
  },
  passportExpiryDate: {
    type: Date
  },

  // Driving Licence Information
  licenceNumber: {
    type: String,
    trim: true
  },
  licenceCountry: {
    type: String,
    trim: true
  },
  licenceClass: {
    type: String,
    trim: true
  },
  licenceExpiryDate: {
    type: Date
  },

  // Visa Information
  visaNumber: {
    type: String,
    trim: true
  },
  visaExpiryDate: {
    type: Date
  },

  // Additional Information
  notes: {
    type: String,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  certifications: [{
    name: String,
    issueDate: Date,
    expiryDate: Date
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
employeeHubSchema.index({ firstName: 1, lastName: 1 });
employeeHubSchema.index({ email: 1 });
employeeHubSchema.index({ team: 1 });
employeeHubSchema.index({ department: 1 });
employeeHubSchema.index({ status: 1 });
employeeHubSchema.index({ isActive: 1 });

// Virtual for full name
employeeHubSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to generate initials if not provided
employeeHubSchema.pre('save', function(next) {
  if (!this.initials && this.firstName && this.lastName) {
    this.initials = `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
  }
  next();
});

// Method to check if employee is currently employed
employeeHubSchema.methods.isCurrentlyEmployed = function() {
  return this.isActive && (!this.endDate || this.endDate > new Date());
};

// Static method to get employees by team
employeeHubSchema.statics.getByTeam = function(teamName) {
  return this.find({ team: teamName, isActive: true }).sort({ firstName: 1 });
};

// Static method to get unregistered BrightHR employees
employeeHubSchema.statics.getUnregisteredBrightHR = function() {
  return this.find({ brightHRRegistered: false, isActive: true });
};

module.exports = mongoose.model('EmployeeHub', employeeHubSchema);
