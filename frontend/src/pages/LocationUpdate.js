import React, { useState, useEffect } from 'react';
import { 
  MapPinIcon, 
  GlobeAltIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  getCurrentPosition, 
  getAddressFromCoordinates, 
  updateUserLocation, 
  getMyLocation 
} from '../utils/locationApi';
import { toast } from 'react-toastify';

const LocationUpdate = ({ onLocationUpdate, showCurrentLocation = true }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [workLocation, setWorkLocation] = useState('Work From Office');
  const [address, setAddress] = useState('');
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Check location permission status
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
        
        result.addEventListener('change', () => {
          setLocationPermission(result.state);
        });
      });
    }
  }, []);

  // Load current location on component mount
  useEffect(() => {
    if (showCurrentLocation) {
      loadCurrentLocation();
    }
  }, [showCurrentLocation]);

  // Load user's current location from server
  const loadCurrentLocation = async () => {
    try {
      const response = await getMyLocation();
      if (response.data) {
        setLastUpdate(response.data);
        setWorkLocation(response.data.workLocation);
        setAddress(response.data.address);
      }
    } catch (error) {
      console.error('Failed to load current location:', error);
    }
  };

  // Get GPS coordinates
  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      // Get GPS coordinates
      const coordinates = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000 // 1 minute
      });

      setCurrentLocation(coordinates);
      
      // Get address from coordinates
      try {
        const addressText = await getAddressFromCoordinates(
          coordinates.latitude, 
          coordinates.longitude
        );
        setAddress(addressText);
      } catch (addressError) {
        console.warn('Failed to get address:', addressError);
        setAddress(`${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`);
      }

      toast.success('Location obtained successfully!');
      
    } catch (error) {
      console.error('Location error:', error);
      toast.error(error.message || 'Failed to get location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Update location on server
  const handleUpdateLocation = async () => {
    if (!currentLocation) {
      toast.warning('Please get your current location first');
      return;
    }

    setIsUpdatingLocation(true);
    
    try {
      const locationData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        address: address,
        workLocation: workLocation,
        updateType: 'manual_update'
      };

      const response = await updateUserLocation(locationData);
      
      if (response.success) {
        toast.success('Location updated successfully!');
        setLastUpdate({
          coordinates: currentLocation,
          address: address,
          workLocation: workLocation,
          timestamp: new Date().toISOString()
        });
        
        // Call callback if provided
        if (onLocationUpdate) {
          onLocationUpdate(locationData);
        }
      }
      
    } catch (error) {
      console.error('Update location error:', error);
      toast.error(error.message || 'Failed to update location');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // Get location permission status color
  const getPermissionStatusColor = () => {
    switch (locationPermission) {
      case 'granted':
        return 'text-green-600 bg-green-50';
      case 'denied':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  // Get location permission status text
  const getPermissionStatusText = () => {
    switch (locationPermission) {
      case 'granted':
        return 'Location access granted';
      case 'denied':
        return 'Location access denied';
      default:
        return 'Location permission required';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-4">
        <MapPinIcon className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">Update Location</h3>
      </div>

      {/* Permission Status */}
      <div className={`mb-4 p-3 rounded-lg ${getPermissionStatusColor()}`}>
        <div className="flex items-center">
          {locationPermission === 'granted' ? (
            <CheckCircleIcon className="h-5 w-5 mr-2" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          )}
          <span className="text-sm font-medium">{getPermissionStatusText()}</span>
        </div>
        {locationPermission === 'denied' && (
          <p className="text-xs mt-1">
            Please enable location access in your browser settings to use this feature.
          </p>
        )}
      </div>

      {/* Current Location Display */}
      {showCurrentLocation && lastUpdate && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Current Location</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Work Location:</strong> {lastUpdate.workLocation}</p>
            <p><strong>Address:</strong> {lastUpdate.address || 'Not available'}</p>
            {lastUpdate.coordinates && (
              <p>
                <strong>Coordinates:</strong> {lastUpdate.coordinates.latitude?.toFixed(6)}, {lastUpdate.coordinates.longitude?.toFixed(6)}
              </p>
            )}
            <p><strong>Last Updated:</strong> {new Date(lastUpdate.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Work Location Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Work Location Type
        </label>
        <select
          value={workLocation}
          onChange={(e) => setWorkLocation(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="Work From Office">Work From Office</option>
          <option value="Work From Home">Work From Home</option>
          <option value="Field">Field Work</option>
          <option value="Client Side">Client Side</option>
        </select>
      </div>

      {/* Get Location Button */}
      <div className="mb-4">
        <button
          onClick={handleGetLocation}
          disabled={isGettingLocation || locationPermission === 'denied'}
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGettingLocation ? (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Getting Location...
            </>
          ) : (
            <>
              <GlobeAltIcon className="h-5 w-5 mr-2" />
              Get Current Location
            </>
          )}
        </button>
      </div>

      {/* Current GPS Location Display */}
      {currentLocation && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">GPS Location Obtained</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p><strong>Latitude:</strong> {currentLocation.latitude.toFixed(6)}</p>
            <p><strong>Longitude:</strong> {currentLocation.longitude.toFixed(6)}</p>
            <p><strong>Accuracy:</strong> ±{currentLocation.accuracy?.toFixed(0)}m</p>
            {address && <p><strong>Address:</strong> {address}</p>}
          </div>
        </div>
      )}

      {/* Address Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address (Optional)
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter or edit address..."
        />
      </div>

      {/* Update Location Button */}
      <button
        onClick={handleUpdateLocation}
        disabled={!currentLocation || isUpdatingLocation}
        className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdatingLocation ? (
          <>
            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            Updating Location...
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Update Location
          </>
        )}
      </button>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Your location will be used for attendance tracking and administrative purposes. 
          The GPS coordinates help verify your work location and ensure accurate time tracking.
        </p>
      </div>
    </div>
  );
};

export default LocationUpdate;
