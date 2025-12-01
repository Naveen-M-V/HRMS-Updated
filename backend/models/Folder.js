const mongoose = require('mongoose');

/**
 * Simplified Folder Schema for Document Management Module
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
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  
  // Organization
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  
  // Metadata
  createdBy: {
    type: String, // Changed from ObjectId to String for simplicity
    required: false,
    default: null
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Prevent model re-compilation
const Folder = mongoose.models.Folder || mongoose.model('Folder', folderSchema);

module.exports = Folder;
