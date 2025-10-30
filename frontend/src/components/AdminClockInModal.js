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
        // If clocked out or not clocked in, user can clock in (don't set alreadyClockedIn)
        // This allows multiple clock-ins per day for split shifts
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
      background: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(8px)',
      padding: '20px'
    }}>
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          color: '#ffffff',
          fontSize: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        ✕
      </button>

      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '0',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        animation: 'modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}>
        {/* Header with Gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '48px 40px 40px',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Decorative Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            backdropFilter: 'blur(10px)',
            border: '3px solid rgba(255, 255, 255, 0.3)'
          }}>
            <span style={{ fontSize: '40px' }}>👋</span>
          </div>

          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '12px',
            letterSpacing: '-0.5px'
          }}>
            Welcome Back!
          </h2>
          <p style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: '8px'
          }}>
            {user?.firstName || 'Admin'}
          </p>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.6'
          }}>
            {new Date().toLocaleString('en-GB', {
              timeZone: 'Europe/London',
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}<br />
            {new Date().toLocaleString('en-GB', {
              timeZone: 'Europe/London',
              hour: '2-digit',
              minute: '2-digit'
            })} UK Time
          </p>
        </div>

        {/* Clock In Form */}
        <div style={{
          padding: '40px',
          background: '#ffffff'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}></div>
              <p style={{ color: '#6b7280', fontSize: '15px', fontWeight: '500' }}>Checking your status...</p>
            </div>
          ) : alreadyClockedIn ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
              }}>
                <span style={{ fontSize: '40px' }}>✓</span>
              </div>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '12px',
                letterSpacing: '-0.3px'
              }}>
                You're All Set!
              </h3>
              <p style={{
                fontSize: '15px',
                color: '#6b7280',
                marginBottom: '8px',
                lineHeight: '1.6'
              }}>
                Clocked in at <strong style={{ color: '#111827' }}>{clockStatus?.clockIn || 'N/A'}</strong>
              </p>
              <div style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: clockStatus?.status === 'on_break' ? '#fef3c7' : '#d1fae5',
                color: clockStatus?.status === 'on_break' ? '#92400e' : '#065f46',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '32px'
              }}>
                {clockStatus?.status === 'on_break' ? '☕ On Break' : '💼 Working'}
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 14px rgba(102, 126, 234, 0.4)';
                }}
              >
                Continue to Dashboard
              </button>
            </div>
          ) : (
            <>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '8px',
                textAlign: 'center',
                letterSpacing: '-0.3px'
              }}>
                Ready to Start Your Day?
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '32px',
                textAlign: 'center'
              }}>
                Let us know where you'll be working today
              </p>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '10px',
              letterSpacing: '0.3px',
              textTransform: 'uppercase'
            }}>
              📍 Work Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '500',
                background: '#f9fafb',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#111827'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = '#ffffff';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.background = '#f9fafb';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="Work From Office">Work From Office</option>
              <option value="Work From Home">Work From Home</option>
              <option value="Field">Field</option>
              <option value="Client Side">Client Side</option>
            </select>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '10px',
              letterSpacing: '0.3px',
              textTransform: 'uppercase'
            }}>
              💼 Work Type
            </label>
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '500',
                background: '#f9fafb',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#111827'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.background = '#ffffff';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.background = '#f9fafb';
                e.target.style.boxShadow = 'none';
              }}
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
              padding: '16px 24px',
              background: loading ? '#d1d5db' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s',
              marginBottom: '12px',
              letterSpacing: '0.3px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px rgba(16, 185, 129, 0.4)';
              }
            }}
          >
            {loading ? '⏳ Clocking In...' : '✓ Clock In Now'}
          </button>

          <button
            onClick={handleSkip}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: '#f9fafb',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = '#ffffff';
                e.target.style.borderColor = '#d1d5db';
                e.target.style.color = '#374151';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = '#f9fafb';
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

        {/* Footer Info */}
        <div style={{
          padding: '24px 40px',
          background: '#f9fafb',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: '1.7',
            margin: 0
          }}>
            💡 <strong style={{ color: '#374151' }}>Tip:</strong> Your work hours will be tracked automatically. Remember to clock out at the end of your shift!
          </p>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
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
