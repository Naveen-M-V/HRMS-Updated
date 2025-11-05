import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook for Socket.IO real-time updates
 * @param {string} serverUrl - Backend server URL
 * @param {function} onAttendanceUpdate - Callback when attendance is updated
 * @param {string} employeeId - Optional employee ID to join specific room
 * @param {boolean} isAdmin - Whether user is admin (joins admin room)
 */
const useSocket = (serverUrl, onAttendanceUpdate, employeeId = null, isAdmin = false) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket.id);
      
      // Join appropriate rooms
      if (isAdmin) {
        socket.emit('join-admin-room');
      }
      
      if (employeeId) {
        socket.emit('join-employee-room', employeeId);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    // Listen for attendance updates
    socket.on('attendance-updated', (data) => {
      console.log('📡 Attendance update received:', data);
      if (onAttendanceUpdate) {
        onAttendanceUpdate(data);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [serverUrl, employeeId, isAdmin, onAttendanceUpdate]);

  return socketRef.current;
};

export default useSocket;
