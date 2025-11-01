import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

// Configure axios for location API
const locationApi = axios.create({
  baseURL: `${API_BASE_URL}/api/location`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for error handling
locationApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Location API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Get current user's GPS coordinates
 * @param {Object} options - Geolocation options
 * @returns {Promise<Object>} GPS coordinates and accuracy
 */
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        });
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
          default:
            errorMessage = 'Unknown location error';
            break;
        }
        reject(new Error(errorMessage));
      },
      { ...defaultOptions, ...options }
    );
  });
};

/**
 * Get address from coordinates using reverse geocoding
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} Address string
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    // Using a free geocoding service (you can replace with your preferred service)
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get address');
    }
    
    const data = await response.json();
    return data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.warn('Failed to get address:', error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

/**
 * Update user location
 * @param {Object} locationData - Location data to update
 * @returns {Promise<Object>} API response
 */
export const updateUserLocation = async (locationData) => {
  try {
    const response = await locationApi.post('/update', locationData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update location');
  }
};

/**
 * Get current user's latest location
 * @returns {Promise<Object>} User's latest location
 */
export const getMyLocation = async () => {
  try {
    const response = await locationApi.get('/my-location');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get location');
  }
};

/**
 * Get all employee locations (Admin only)
 * @returns {Promise<Object>} All employee locations
 */
export const getAllEmployeeLocations = async () => {
  try {
    const response = await locationApi.get('/all-locations');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get employee locations');
  }
};

/**
 * Get location history for specific employee (Admin only)
 * @param {string} employeeId - Employee ID
 * @param {Object} params - Query parameters (limit, page, startDate, endDate)
 * @returns {Promise<Object>} Employee location history
 */
export const getEmployeeLocationHistory = async (employeeId, params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await locationApi.get(`/employee/${employeeId}/history?${queryString}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get location history');
  }
};

/**
 * Find employees near a specific location (Admin only)
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} radius - Radius in kilometers
 * @returns {Promise<Object>} Nearby employees
 */
export const findNearbyEmployees = async (latitude, longitude, radius = 5) => {
  try {
    const response = await locationApi.get('/nearby-employees', {
      params: { latitude, longitude, radius }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to find nearby employees');
  }
};

/**
 * Clear user's location history
 * @returns {Promise<Object>} API response
 */
export const clearLocationHistory = async () => {
  try {
    const response = await locationApi.delete('/clear-history');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to clear location history');
  }
};

/**
 * Get location with address for clock-in
 * @param {Object} options - Geolocation options
 * @returns {Promise<Object>} Location data with address
 */
export const getLocationForClockIn = async (options = {}) => {
  try {
    // Get GPS coordinates
    const coordinates = await getCurrentPosition(options);
    
    // Get address from coordinates
    const address = await getAddressFromCoordinates(
      coordinates.latitude, 
      coordinates.longitude
    );
    
    return {
      gpsCoordinates: coordinates,
      address
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate distance between two coordinates
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
