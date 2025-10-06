import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch notifications from backend
  useEffect(() => {
    if (user && (user.id || user.userId) && user.role === 'admin') {
      console.log('NotificationContext: Starting to fetch notifications for admin user:', user.email);
      fetchNotifications();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      console.log('NotificationContext: User not eligible for notifications:', { 
        hasUser: !!user, 
        hasId: !!(user?.id || user?.userId), 
        role: user?.role 
      });
      setNotifications([]);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('NotificationContext: Fetching notifications...');

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('NotificationContext: Received data:', data);
      
      // Handle both direct array and object with notifications property
      const notificationsArray = Array.isArray(data) ? data : (data.notifications || []);
      console.log('NotificationContext: Processing notifications array:', notificationsArray.length, 'items');
      
      // Transform backend notifications to match frontend format
      const transformedNotifications = notificationsArray.map(notif => ({
        id: notif._id,
        title: notif.title || notif.message, // Use message as title if title is empty
        message: notif.message,
        type: notif.type,
        priority: notif.priority,
        read: notif.read, // Use existing 'read' field
        status: notif.read ? 'Read' : 'Open',
        date: new Date(notif.createdOn || notif.createdAt).toLocaleDateString(), // Use createdOn field
        createdAt: notif.createdOn || notif.createdAt,
        metadata: notif.metadata || {}
      }));

      console.log('NotificationContext: Transformed notifications:', transformedNotifications.length, 'items');
      setNotifications(transformedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      console.log('NotificationContext: Marking notification as read:', notificationId);

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, status: 'Read' }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  const refreshNotifications = () => {
    fetchNotifications();
  };

  // Add callback for external components to listen to count changes
  const [notificationCallbacks, setNotificationCallbacks] = useState([]);
  
  const subscribeToNotificationChanges = (callback) => {
    setNotificationCallbacks(prev => [...prev, callback]);
    return () => {
      setNotificationCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  };

  // Notify subscribers when unread count changes
  useEffect(() => {
    const unreadCount = getUnreadCount();
    notificationCallbacks.forEach(callback => callback(unreadCount));
  }, [notifications, notificationCallbacks]);

  // Function to trigger immediate refresh after actions
  const triggerRefresh = () => {
    setTimeout(() => {
      fetchNotifications();
    }, 1000); // Wait 1 second for backend to process
  };

  const value = {
    notifications,
    loading,
    error,
    markAsRead,
    getUnreadCount,
    refreshNotifications,
    triggerRefresh,
    subscribeToNotificationChanges
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
