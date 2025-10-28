import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserClockStatus } from '../utils/clockApi';
import AdminClockInModal from './AdminClockInModal';

/**
 * Wrapper component that shows clock-in modal after admin login
 * Checks if admin is already clocked in
 */

const AdminClockInWrapper = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once when user logs in
    if (isAuthenticated && user && !hasChecked) {
      checkAndShowClockInModal();
      setHasChecked(true);
    }
    
    // Reset when user logs out
    if (!isAuthenticated) {
      setHasChecked(false);
      setShowClockInModal(false);
    }
  }, [isAuthenticated, user, hasChecked]);

  const checkAndShowClockInModal = async () => {
    try {
      // Wait a bit for UI to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const statusRes = await getUserClockStatus();
      
      if (statusRes.success && statusRes.data) {
        const currentStatus = statusRes.data.status;
        
        // Show modal if not clocked in yet
        if (currentStatus === 'not_clocked_in' || currentStatus === 'clocked_out') {
          console.log('⏰ User not clocked in, showing clock-in modal');
          setShowClockInModal(true);
        } else {
          console.log(`✅ User already ${currentStatus}`);
        }
      }
    } catch (error) {
      console.error('Check clock status error:', error);
      // Show modal anyway if we can't check
      setShowClockInModal(true);
    }
  };

  const handleClockIn = (data) => {
    console.log('✅ Admin clocked in:', data);
    localStorage.setItem('admin_clocked_in', 'true');
    localStorage.setItem('admin_clock_in_time', new Date().toISOString());
  };

  const handleCloseModal = () => {
    setShowClockInModal(false);
  };

  return (
    <>
      {children}
      
      {showClockInModal && isAuthenticated && user && (
        <AdminClockInModal
          user={user}
          onClose={handleCloseModal}
          onClockIn={handleClockIn}
        />
      )}
    </>
  );
};

export default AdminClockInWrapper;
