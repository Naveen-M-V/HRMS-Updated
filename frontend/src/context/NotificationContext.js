import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [shouldAutoFetch, setShouldAutoFetch] = useState(false);
  const [notificationCallbacks, setNotificationCallbacks] = useState([]);
  const { user } = useAuth();
  
  const refreshTimeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const transformedNotifications = data.notifications.map(notif => ({
        id: notif._id,
        title: notif.title || notif.message,
        message: notif.message,
        type: notif.type,
        priority: notif.priority,
        read: notif.read,
        status: notif.read ? 'Read' : 'Open',
        date: new Date(notif.createdOn || notif.createdAt).toLocaleDateString(),
        createdAt: notif.createdOn || notif.createdAt,
        metadata: notif.metadata || {}
      }));

      if (isMountedRef.current) {
        setNotifications(transformedNotifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (isMountedRef.current) {
        setError('Failed to fetch notifications');
        setNotifications([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (user && user.id && shouldAutoFetch && isMountedRef.current) {
      fetchNotifications();

      intervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchNotifications();
        }
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, shouldAutoFetch, fetchNotifications]);

  const markAsRead = async (notificationId) => {
    if (!isMountedRef.current) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (isMountedRef.current) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true, status: 'Read' }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  const refreshNotifications = () => {
    if (isMountedRef.current) {
      fetchNotifications();
    }
  };

  const subscribeToNotificationChanges = (callback) => {
    setNotificationCallbacks(prev => [...prev, callback]);
    return () => {
      setNotificationCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  };

  useEffect(() => {
    if (isMountedRef.current) {
      const unreadCount = getUnreadCount();
      notificationCallbacks.forEach(callback => callback(unreadCount));
    }
  }, [notifications, notificationCallbacks]);

  const triggerRefresh = () => {
    if (!isMountedRef.current) return;
    
    setShouldAutoFetch(true);
    
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        fetchNotifications();
      }
    }, 1000);
  };

  const initializeNotifications = () => {
    if (!shouldAutoFetch && isMountedRef.current) {
      setShouldAutoFetch(true);
    }
  };

  const value = {
    notifications,
    loading,
    error,
    markAsRead,
    getUnreadCount,
    refreshNotifications,
    triggerRefresh,
    subscribeToNotificationChanges,
    initializeNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
