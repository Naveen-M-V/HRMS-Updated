import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentPosition, watchPosition, clearPositionWatch, requestLocationPermission } from '../utils/geolocation';

/**
 * Custom hook for live location tracking
 * Provides current location, live tracking, and permission management
 */
export const useLiveLocation = (options = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    autoStart = false,
    onLocationUpdate = null,
    onError = null
  } = options;

  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt');
  const [isLoading, setIsLoading] = useState(false);
  
  const watchIdRef = useRef(null);

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permissionState = await requestLocationPermission();
        setPermission(permissionState);
      } catch (err) {
        console.warn('Could not check location permission:', err);
      }
    };

    checkPermission();
  }, []);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (autoStart && permission === 'granted') {
      startTracking();
    }
  }, [autoStart, permission]);

  // Get current position once
  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const position = await getCurrentPosition();
      setLocation(position);
      setPermission('granted');
      
      if (onLocationUpdate) {
        onLocationUpdate(position);
      }
      
      return position;
    } catch (err) {
      setError(err.message);
      setPermission('denied');
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onLocationUpdate, onError]);

  // Start live tracking
  const startTracking = useCallback(() => {
    if (isTracking) return;
    
    setError(null);
    setIsTracking(true);

    const handleLocationUpdate = (position) => {
      setLocation(position);
      setPermission('granted');
      
      if (onLocationUpdate) {
        onLocationUpdate(position);
      }
    };

    const handleError = (err) => {
      setError(err.message);
      setIsTracking(false);
      setPermission('denied');
      
      if (onError) {
        onError(err);
      }
    };

    const watchId = watchPosition(handleLocationUpdate, handleError);
    watchIdRef.current = watchId;

    if (!watchId) {
      setIsTracking(false);
      setError('Failed to start location tracking');
    }
  }, [isTracking, onLocationUpdate, onError]);

  // Stop live tracking
  const stopTracking = useCallback(() => {
    if (!isTracking) return;
    
    if (watchIdRef.current) {
      clearPositionWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setIsTracking(false);
  }, [isTracking]);

  // Toggle tracking
  const toggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking]);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      const permissionState = await requestLocationPermission();
      setPermission(permissionState);
      return permissionState;
    } catch (err) {
      setError('Failed to request location permission');
      setPermission('denied');
      throw err;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        clearPositionWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    // State
    location,
    isTracking,
    error,
    permission,
    isLoading,
    
    // Actions
    getCurrentLocation,
    startTracking,
    stopTracking,
    toggleTracking,
    requestPermission,
    
    // Computed values
    hasLocation: !!location,
    isPermissionGranted: permission === 'granted',
    isPermissionDenied: permission === 'denied',
    coordinates: location ? [location.longitude, location.latitude] : null,
    
    // Helper methods
    clearError: () => setError(null),
    refreshLocation: getCurrentLocation
  };
};

export default useLiveLocation;
