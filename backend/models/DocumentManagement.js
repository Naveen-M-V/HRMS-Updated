const mongoose = require('mongoose');

/**
 * Document Schema for Document Management Module
 * Enhanced version with folder support and comprehensive permissions
 */
const documentManagementSchema = new mongoose.Schema({
  // Document Reference
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    required: [true, 'Folder reference is required'],
    index: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeHub',
    default: null
  },
  
  // Document Information
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  parentDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DocumentManagement',
    default: null
  },
  
  // Categorization
  category: {
    type: String,
    enum: ['passport', 'visa', 'contract', 'certificate', 'id_proof', 'resume', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Access Control
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Uploaded by reference is required']
  },
  uploaderType: {
    type: String,
    enum: ['User', 'EmployeeHub'],
    default: 'EmployeeHub'
  },
  permissions: {
    view: [{
      type: String,
      enum: ['admin', 'hr', 'manager', 'employee']
    }],
    download: [{
      type: String,
      enum: ['admin', 'hr', 'manager', 'employee']
    }],
    share: [{
      type: String,
      enum: ['admin', 'hr', 'manager', 'employee']
    }]
  },
  
  // Expiry and Reminders
  expiresOn: {
    type: Date,
    default: null
  },
  reminderEnabled: {
    type: Boolean,
    default: false
  },
  reminderDays: {
    type: Number,
    default: 30,
    min: 1,
    max: 365
  },
  lastReminderSent: {
    type: Date,
    default: null
  },
  
  // Status and Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: null
  },
  
  // Audit Trail
  auditLog: [{
    action: {
      type: String,
      enum: ['uploaded', 'viewed', 'downloaded', 'shared', 'updated', 'archived', 'deleted'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // Made optional since it can be User or EmployeeHub
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: String,
      maxlength: [500, 'Details cannot exceed 500 characters']
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
documentManagementSchema.index({ folderId: 1, isActive: 1 });
documentManagementSchema.index({ uploadedBy: 1 });
documentManagementSchema.index({ employeeId: 1 });
documentManagementSchema.index({ expiresOn: 1 });
documentManagementSchema.index({ category: 1 });
documentManagementSchema.index({ createdAt: -1 });
documentManagementSchema.index({ fileName: 'text', category: 'text' });

// Virtual for document age in days
documentManagementSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for days until expiry
documentManagementSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresOn) return null;
  return Math.ceil((this.expiresOn - Date.now()) / (1000 * 60 * 60 * 24));
});

// Virtual for is expired
documentManagementSchema.virtual('isExpired').get(function() {
  if (!this.expiresOn) return false;
  return this.expiresOn < new Date();
});

// Virtual for file size in human readable format
documentManagementSchema.virtual('fileSizeFormatted').get(function() {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = this.fileSize;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
});

// Pre-save middleware to handle expiry
documentManagementSchema.pre('save', function(next) {
  if (this.expiresOn && this.expiresOn < new Date() && this.isActive) {
    this.isActive = false;
  }
  next();
});

// Static method to get documents by folder
documentManagementSchema.statics.getByFolder = function(folderId, options = {}) {
  const query = { folderId, isActive: true };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.employeeId) {
    query.employeeId = options.employeeId;
  }
  
  return this.find(query)
    .populate('uploadedBy', 'firstName lastName employeeId')
    .populate('employeeId', 'firstName lastName employeeId')
    .sort({ createdAt: -1 });
};

// Static method to get expiring documents
documentManagementSchema.statics.getExpiringSoon = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiresOn: { 
      $gte: new Date(),
      $lte: futureDate 
    },
    isActive: true,
    reminderEnabled: true
  })
  .populate('folderId', 'name')
  .populate('employeeId', 'firstName lastName employeeId')
  .sort({ expiresOn: 1 });
};

// Static method to search documents
documentManagementSchema.statics.searchDocuments = function(searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    isActive: true
  };
  
  if (options.folderId) {
    query.folderId = options.folderId;
  }
  
  return this.find(query)
    .populate('folderId', 'name')
    .populate('uploadedBy', 'firstName lastName employeeId')
    .populate('employeeId', 'firstName lastName employeeId')
    .sort({ score: { $meta: 'textScore' } });
};

// Instance method to check permission
documentManagementSchema.methods.hasPermission = function(action, userRole) {
  if (!this.permissions[action]) return false;
  return this.permissions[action].includes(userRole) || this.permissions[action].includes('admin');
};

// Instance method to add audit log entry
documentManagementSchema.methods.addAuditLog = function(action, performedBy, details = '') {
  this.auditLog.push({
    action,
    performedBy,
    timestamp: new Date(),
    details
  });
  return this.save();
};

// Instance method to increment download count
documentManagementSchema.methods.incrementDownload = function(userId) {
  this.downloadCount += 1;
  this.lastAccessedAt = new Date();
  this.addAuditLog('downloaded', userId, 'Document downloaded');
  return this.save();
};

// Instance method to create new version
documentManagementSchema.methods.createNewVersion = function(newFileUrl, newFileName, newFileSize, newMimeType, uploadedBy) {
  const newDocument = new this.constructor({
    folderId: this.folderId,
    employeeId: this.employeeId,
    fileName: newFileName,
    fileUrl: newFileUrl,
    fileSize: newFileSize,
    mimeType: newMimeType,
    version: this.version + 1,
    parentDocument: this._id,
    category: this.category,
    tags: [...this.tags],
    uploadedBy: uploadedBy,
    permissions: { ...this.permissions },
    expiresOn: this.expiresOn,
    reminderEnabled: this.reminderEnabled,
    reminderDays: this.reminderDays
  });
  
  return newDocument.save();
};

// Instance method to archive document
documentManagementSchema.methods.archive = function(userId) {
  this.isArchived = true;
  this.isActive = false;
  this.addAuditLog('archived', userId, 'Document archived');
  return this.save();
};

// Prevent model re-compilation
const DocumentManagement = mongoose.models.DocumentManagement || mongoose.model('DocumentManagement', documentManagementSchema);

module.exports = DocumentManagement;
