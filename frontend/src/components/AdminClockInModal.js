import React, { useState, useEffect } from 'react';
import { userClockIn, getUserClockStatus } from '../utils/clockApi';
import { toast } from 'react-toastify';

/**
 * Admin Clock-In Floating Modal
 * Shows on login, prompts admin to clock in
 */

const AdminClockInModal = ({ user, onClose, onClockIn }) => {
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('Work From Office');
  const [workType, setWorkType] = useState('Regular');
  const [alreadyClockedIn, setAlreadyClockedIn] = useState(false);
  const [clockStatus, setClockStatus] = useState(null);

  useEffect(() => {
    checkClockStatus();
  }, []);

  const checkClockStatus = async () => {
    try {
      const response = await getUserClockStatus();
      console.log('Clock status response:', response);
      if (response.success && response.data) {
        const status = response.data.status;
        console.log('Current clock status:', status);
        // Check if already clocked in or on break
        if (status === 'clocked_in' || status === 'on_break') {
          setAlreadyClockedIn(true);
          setClockStatus(response.data);
        }
        // If clocked out, user can clock in again (don't set alreadyClockedIn)
      }
    } catch (error) {
      console.error('Error checking clock status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const response = await userClockIn({ location, workType });
      
      if (response.success) {
        toast.success('You have successfully clocked in!');
        if (onClockIn) onClockIn(response.data);
        setTimeout(() => onClose(), 1500);
      } else {
        toast.error(response.message || 'Failed to clock in');
      }
    } catch (error) {
      console.error('Admin clock in error:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Failed to clock in';
      toast.error(errorMessage);
      
      // If already clocked in, update state
      if (errorMessage.includes('already clocked in')) {
        setAlreadyClockedIn(true);
        await checkClockStatus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast.info('You can clock in later from the Clock-ins page');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideDown 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '8px'
          }}>
            Welcome Back, {user?.firstName || 'Admin'}!
          </h2>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.5'
          }}>
            {new Date().toLocaleString('en-GB', {
              timeZone: 'Europe/London',
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} (UK Time)
          </p>
        </div>

        {/* Clock In Form */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <p style={{ color: '#6b7280' }}>Checking clock status...</p>
            </div>
          ) : alreadyClockedIn ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <span style={{ fontSize: '32px' }}>✓</span>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px'
              }}>
                You're Already Clocked In!
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '20px'
              }}>
                Clocked in at: {clockStatus?.clockIn || 'N/A'}<br />
                Status: {clockStatus?.status === 'on_break' ? 'On Break' : 'Working'}
              </p>
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Continue to Dashboard
              </button>
            </div>
          ) : (
            <>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                Ready to start your day?
              </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Work Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="Work From Office">Work From Office</option>
              <option value="Work From Home">Work From Home</option>
              <option value="Field">Field</option>
              <option value="Client Side">Client Side</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Work Type
            </label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            >
              <option value="Regular">Regular</option>
              <option value="Overtime">Overtime</option>
              <option value="Weekend Overtime">Weekend Overtime</option>
              <option value="Client-side Overtime">Client-side Overtime</option>
            </select>
          </div>

          <button
            onClick={handleClockIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.3s',
              transform: loading ? 'scale(1)' : 'scale(1)',
              marginBottom: '12px'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.transform = 'scale(1)';
            }}
          >
            {loading ? 'Clocking In...' : 'Clock In Now'}
          </button>

          <button
            onClick={handleSkip}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 24px',
              background: 'transparent',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.borderColor = '#9ca3af';
                e.target.style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.color = '#6b7280';
              }
            }}
          >
            I'll clock in later
          </button>
            </>
          )}
        </div>

        {/* Info */}
        <p style={{
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.8)',
          textAlign: 'center',
          lineHeight: '1.6'
        }}>
          Your work hours will be tracked automatically.<br />
          Remember to clock out at the end of your shift!
        </p>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminClockInModal;
