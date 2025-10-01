const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import Notification model (defined in server.js)
let Notification;
try {
  Notification = mongoose.model('Notification');
} catch (e) {
  // Model not registered yet, define schema here
  const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    message: { type: String, required: true },
    certificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
    read: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  });
  Notification = mongoose.model('Notification', notificationSchema);
}

// Get unread notification count
router.get('/unread-count', async (req, res) => {
  try {
    // Validate JWT user data
    if (!req.user?.userId) {
      console.error("Invalid user data. User:", req.user);
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Count unread notifications from database
    const count = await Notification.countDocuments({ 
      userId: req.user.userId, 
      read: false 
    });

    res.json({ count });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    console.error("User data:", req.user);
    res.status(500).json({ error: 'Failed to fetch notification count' });
  }
});

// Get all notifications for user
router.get('/', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Fetch notifications from database
    const userNotifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ notifications: userNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await Notification.updateMany(
      { userId: req.user.userId, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Create new notification (for admin/system use)
router.post('/', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { message, type = 'info', priority = 'low', certificateId } = req.body;
    
    const newNotification = new Notification({
      userId: req.user.userId,
      type,
      priority,
      message,
      certificateId,
      read: false
    });
    
    await newNotification.save();
    res.status(201).json({ notification: newNotification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

module.exports = router;
