/**
 * Geolocation Utilities for Live Location Tracking
 * Provides functions for getting current location and watching position changes
 */

/**
 * Get current position with high accuracy
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({ latitude, longitude, accuracy });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      }
    );
  });
};

/**
 * Watch position changes with callback
 * @param {Function} onLocationUpdate - Callback function for location updates
 * @param {Function} onError - Callback function for errors
 * @returns {number} Watch ID for clearing the watch
 */
export const watchPosition = (onLocationUpdate, onError) => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by this browser'));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      const timestamp = position.timestamp;
      
      onLocationUpdate({
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        timestamp
      });
    },
    (error) => {
      let errorMessage = 'Failed to watch location';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }
      onError(new Error(errorMessage));
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0 // Always get fresh location for live tracking
    }
  );

  return watchId;
};

/**
 * Clear position watch
 * @param {number} watchId - Watch ID returned by watchPosition
 */
export const clearPositionWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Check if geolocation is available
 * @returns {boolean}
 */
export const isGeolocationAvailable = () => {
  return 'geolocation' in navigator;
};

/**
 * Request location permission
 * @returns {Promise<string>} Permission state: 'granted', 'denied', 'prompt'
 */
export const requestLocationPermission = async () => {
  if (!navigator.permissions) {
    // Fallback: try to get location to trigger permission prompt
    try {
      await getCurrentPosition();
      return 'granted';
    } catch (error) {
      return 'denied';
    }
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state;
  } catch (error) {
    console.warn('Could not query geolocation permission:', error);
    return 'prompt';
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude  
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Format coordinates for display
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} precision - Decimal places (default: 6)
 * @returns {string} Formatted coordinates
 */
export const formatCoordinates = (latitude, longitude, precision = 6) => {
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
};
