const express = require('express');
const router = express.Router();

// Mock notification data - replace with your actual notification storage
let notifications = [
  {
    id: 1,
    userId: 'all', // 'all' means for all users
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2-4 AM',
    type: 'info',
    isRead: false,
    createdAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    id: 2,
    userId: 'all',
    title: 'Certificate Expiry Warning',
    message: 'Your SSL certificate will expire in 7 days',
    type: 'warning',
    isRead: false,
    createdAt: new Date('2024-01-14T15:30:00Z')
  },
  {
    id: 3,
    userId: 'all',
    title: 'Welcome to HRMS',
    message: 'Welcome to the new HRMS system. Please update your profile.',
    type: 'success',
    isRead: false,
    createdAt: new Date('2024-01-13T09:00:00Z')
  }
];

// Get unread notification count
router.get('/unread-count', (req, res) => {
  try {
    // Validate session and user ID
    if (!req.session?.user?.userId) {
      console.error("Invalid session data. Session:", req.session);
      console.error("Cookies:", req.cookies);
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Ensure notifications is an array
    if (!Array.isArray(notifications)) {
      console.error("Notifications data is invalid. Expected an array but got:", notifications);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Filter unread notifications
    const unreadCount = notifications.filter(n => 
      !n.isRead && (n.userId === 'all' || n.userId === req.session.user.userId)
    ).length;

    res.json({ count: unreadCount });
  } catch (error) {
    console.error("Error fetching notification count:", error);
    console.error("Session data:", req.session);
    console.error("Notifications data:", notifications);
    res.status(500).json({ error: 'Failed to fetch notification count' });
  }
});

// Get all notifications for user
router.get('/', (req, res) => {
  try {
    // In a real app, filter by user ID from session
    const userNotifications = notifications
      .filter(n => n.userId === 'all' || n.userId === req.session?.user?.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ notifications: userNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.isRead = true;
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', (req, res) => {
  try {
    notifications.forEach(n => {
      if (n.userId === 'all' || n.userId === req.session?.user?.userId) {
        n.isRead = true;
      }
    });
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Create new notification (for system use)
router.post('/', (req, res) => {
  try {
    const { title, message, type = 'info', userId = 'all' } = req.body;
    
    const newNotification = {
      id: Math.max(...notifications.map(n => n.id), 0) + 1,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date()
    };
    
    notifications.push(newNotification);
    res.status(201).json({ notification: newNotification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

module.exports = router;
