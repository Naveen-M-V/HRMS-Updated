import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCertificates } from './CertificateContext';
import { useProfiles } from './ProfileContext';
import { getCertificateExpiryNotifications } from '../utils/notificationUtils';

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
  const { certificates } = useCertificates();
  const { userProfile } = useProfiles();

  // Generate notifications based on certificate expiry
  useEffect(() => {
    if (certificates && userProfile) {
      generateNotifications();
    }
  }, [certificates, userProfile]);

  const generateNotifications = () => {
    try {
      // Generate certificate expiry notifications
      const expiryNotifications = getCertificateExpiryNotifications(certificates, userProfile.email);
      
      // Add system notifications
      const systemNotifications = [
        {
          id: "system-welcome",
          type: "system",
          priority: "low",
          message: "Welcome to HRMS! Keep track of your certificates and profiles.",
          title: "Welcome to HRMS",
          status: "Open",
          date: new Date().toLocaleDateString(),
          createdAt: new Date().toISOString(),
          read: false
        }
      ];

      // Combine and format all notifications
      const allNotifications = [...expiryNotifications, ...systemNotifications].map(notif => ({
        ...notif,
        title: notif.title || notif.message,
        status: notif.status || "Open",
        date: notif.date || new Date(notif.createdAt).toLocaleDateString()
      }));

      setNotifications(allNotifications);
    } catch (err) {
      console.error('Error generating notifications:', err);
      setError('Failed to generate notifications');
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const getUnreadCount = () => {
    return notifications.filter(notif => !notif.read).length;
  };

  const refreshNotifications = () => {
    generateNotifications();
  };

  const value = {
    notifications,
    loading,
    error,
    markAsRead,
    getUnreadCount,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
