const mongoose = require('mongoose');

// Check if Notification model already exists
if (mongoose.models.Notification) {
  // If it exists, just export it
  module.exports = mongoose.models.Notification;
} else {
  // Create new schema only if model doesn't exist
  const notificationSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: false // Not all notifications are profile-specific
    },
    type: {
      type: String,
      required: true,
      enum: [
        'certificate_expiring',
        'certificate_expired',
        'user_created',
        'profile_updated',
        'certificate_added',
        'certificate_deleted',
        'certificate_updated',
        'system',
        'welcome',
        'profile_created',
        'certificate_created',
        'clock_in',
        'clock_out',
        'break_started',
        'work_resumed',
        'shift_assigned',
        'admin_clock_in',
        'admin_clock_out'
      ]
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    read: { // Add alias for compatibility with existing code
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    expiresAt: {
      type: Date,
      default: null // For auto-expiring notifications
    }
  }, {
    timestamps: true
  });

  // Index for efficient queries
  notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
  notificationSchema.index({ userId: 1, read: 1, createdAt: -1 }); // Add index for 'read' field
  notificationSchema.index({ type: 1, createdAt: -1 });
  notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  // Static method to create notification
  notificationSchema.statics.createNotification = async function(data) {
    const notification = new this(data);
    return await notification.save();
  };

  // Instance method to mark as read
  notificationSchema.methods.markAsRead = async function() {
    this.isRead = true;
    this.read = true; // Set both fields for compatibility
    this.readAt = new Date();
    return await this.save();
  };

  module.exports = mongoose.model('Notification', notificationSchema);
}
