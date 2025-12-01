const mongoose = require('mongoose');

/**
 * Folder Schema for Document Management Module
 * Organizes documents into folder categories
 */
const folderSchema = new mongoose.Schema({
  // Folder Information
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true,
    maxlength: [100, 'Folder name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Organization
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  path: {
    type: String,
    default: ''
  },
  
  // Access Control
  permissions: {
    view: [{
      type: String,
      enum: ['admin', 'hr', 'manager', 'employee']
    }],
    edit: [{
      type: String,
      enum: ['admin', 'hr', 'manager', 'employee']
    }],
    delete: [{
      type: String,
      enum: ['admin', 'hr', 'manager', 'employee']
    }]
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeeHub',
    required: [true, 'Created by reference is required']
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
folderSchema.index({ name: 1 });
folderSchema.index({ parentFolder: 1 });
folderSchema.index({ createdBy: 1 });
folderSchema.index({ isActive: 1 });

// Virtual for document count
folderSchema.virtual('documentCount', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'folderId',
  count: true
});

// Pre-save middleware to update path
folderSchema.pre('save', async function(next) {
  if (this.isModified('parentFolder') || this.isNew) {
    await this.updatePath();
  }
  next();
});

// Instance method to update folder path
folderSchema.methods.updatePath = async function() {
  if (!this.parentFolder) {
    this.path = this.name;
  } else {
    const parent = await this.constructor.findById(this.parentFolder);
    this.path = parent ? `${parent.path}/${this.name}` : this.name;
  }
  
  // Update child folders paths
  await this.constructor.updateMany(
    { parentFolder: this._id },
    { $set: { path: `${this.path}/` } }
  );
};

// Static method to get root folders
folderSchema.statics.getRootFolders = function() {
  return this.find({ parentFolder: null, isActive: true })
    .populate('createdBy', 'firstName lastName employeeId')
    .sort({ name: 1 });
};

// Static method to get folder tree
folderSchema.statics.getFolderTree = function(parentId = null) {
  return this.find({ parentFolder: parentId, isActive: true })
    .populate('createdBy', 'firstName lastName employeeId')
    .sort({ name: 1 });
};

// Instance method to get hierarchy
folderSchema.methods.getHierarchy = async function() {
  const hierarchy = [this];
  let current = this;
  
  while (current.parentFolder) {
    const parent = await this.constructor.findById(current.parentFolder);
    if (!parent) break;
    hierarchy.unshift(parent);
    current = parent;
  }
  
  return hierarchy;
};

// Instance method to check permission
folderSchema.methods.hasPermission = function(action, userRole) {
  if (!this.permissions[action]) return false;
  return this.permissions[action].includes(userRole) || this.permissions[action].includes('admin');
};

// Compound index for unique folder names within parent folder
folderSchema.index({ name: 1, parentFolder: 1 }, { unique: true });

// Prevent model re-compilation
const Folder = mongoose.models.Folder || mongoose.model('Folder', folderSchema);

module.exports = Folder;
