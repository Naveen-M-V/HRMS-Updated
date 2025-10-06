const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../utils/notificationService');

// Notification model is already defined in server.js

// Get unread notification count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.session?.user?.userId;
    
    if (!userId) {
      console.warn("No user session found for notification count");
      return res.json({ count: 0 });
    }

    const unreadCount = await getUnreadNotificationCount(userId);
    res.json({ count: unreadCount });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    res.status(500).json({ error: 'Failed to fetch notification count' });
  }
});

// Alternative route for user-specific unread count
router.get('/:userId/unread-count', async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(`📊 Unread count request for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const unreadCount = await getUnreadNotificationCount(userId);
    console.log(`📊 Unread count for user ${userId}: ${unreadCount}`);
    
    res.json({ count: unreadCount });
  } catch (error) {
    console.error("❌ Error fetching notification count:", error);
    res.status(500).json({ error: 'Failed to fetch notification count' });
  }
});

// Get all notifications for user
router.get('/', async (req, res) => {
  try {
    // Debug logging can be removed after testing
    
    const userId = req.session?.user?.userId;
    
    if (!userId) {
      console.warn("❌ No user session found for notifications");
      console.log('Session details:', {
        hasSession: !!req.session,
        sessionUser: req.session?.user,
        cookies: req.headers.cookie
      });
      return res.json({ notifications: [] });
    }

    console.log(`✅ Fetching notifications for user: ${userId}`);

    const { limit, skip, unreadOnly, type } = req.query;
    const options = {
      limit: parseInt(limit) || 50,
      skip: parseInt(skip) || 0,
      unreadOnly: unreadOnly === 'true',
      type: type || null
    };

    const notifications = await getUserNotifications(userId, options);
    console.log(`📊 Found ${notifications.length} notifications for user`);
    
    res.json({ notifications });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.session?.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const notification = await markNotificationAsRead(notificationId, userId);
    res.json({ 
      message: 'Notification marked as read',
      notification 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    if (error.message === 'Notification not found') {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    const userId = req.session?.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const modifiedCount = await markAllNotificationsAsRead(userId);
    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Create new notification (for system use)
router.post('/', async (req, res) => {
  try {
    const { title, message, type = 'system', userId, profileId, priority = 'medium', metadata = {} } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const { createNotification } = require('../utils/notificationService');
    
    const notificationData = {
      userId,
      profileId,
      type,
      title,
      message,
      priority,
      metadata
    };
    
    const notification = await createNotification(notificationData);
    
    if (!notification) {
      return res.status(500).json({ error: 'Failed to create notification' });
    }
    
    res.status(201).json({ notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

module.exports = router;
