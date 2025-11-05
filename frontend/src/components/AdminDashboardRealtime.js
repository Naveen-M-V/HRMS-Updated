import React, { useState, useEffect, useCallback } from 'react';
import useSocket from '../hooks/useSocket';
import { toast } from 'react-toastify';
import axios from 'axios';
import { buildApiUrl } from '../utils/apiConfig';

/**
 * Admin Dashboard with Real-time Updates
 * Demonstrates Socket.IO integration for live attendance tracking
 */
const AdminDashboardRealtime = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial attendance data
  const fetchAttendanceData = useCallback(async () => {
    try {
      const response = await axios.get(
        buildApiUrl('/clock/status?includeAdmins=true'),
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setAttendanceData(response.data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle real-time attendance updates
  const handleAttendanceUpdate = useCallback((data) => {
    console.log('Real-time update received:', data);
    
    // Show notification
    if (data.type === 'clock-in') {
      toast.info(`Employee clocked in`, {
        autoClose: 3000
      });
    } else if (data.type === 'clock-out') {
      toast.success(`Employee clocked out`, {
        autoClose: 3000
      });
    }
    
    // Refresh attendance data
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Initialize Socket.IO connection
  const socket = useSocket(
    process.env.REACT_APP_API_URL || 'http://localhost:5003',
    handleAttendanceUpdate,
    null, // No specific employee ID
    true  // Is admin
  );

  // Load initial data
  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading attendance data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>Live Attendance Dashboard</h2>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '8px 16px',
          background: '#10b981',
          color: 'white',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: 'white',
            animation: 'pulse 2s infinite'
          }} />
          Live Updates Active
        </div>
      </div>

      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Employee</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Clock In</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Clock Out</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  No attendance records for today
                </td>
              </tr>
            ) : (
              attendanceData.map((entry, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>
                    {entry.employeeName || 'Unknown'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: entry.status === 'clocked_in' ? '#dcfce7' : '#e0e7ff',
                      color: entry.status === 'clocked_in' ? '#166534' : '#3730a3'
                    }}>
                      {entry.status === 'clocked_in' ? 'Clocked In' : 'Clocked Out'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {entry.clockIn || '--'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {entry.clockOut || '--'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {entry.totalHours ? `${entry.totalHours.toFixed(2)} hrs` : '--'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardRealtime;
