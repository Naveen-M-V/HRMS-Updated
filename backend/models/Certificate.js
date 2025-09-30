const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificate: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  provider: String,
  issuedDate: Date,
  expiryDate: Date,
  status: {
    type: String,
    enum: ['active', 'expired', 'pending'],
    default: 'active'
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  profileName: String,
  certificateUrl: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
certificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
certificateSchema.index({ certificate: 1 });
certificateSchema.index({ profileId: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ category: 1 });
certificateSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);