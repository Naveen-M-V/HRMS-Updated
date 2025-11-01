import React, { useState, useEffect } from 'react';
import { MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const LocationUpdate = ({ onLocationUpdate, showCurrentLocation = true }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (showCurrentLocation) {
      getCurrentLocation();
    }
  }, [showCurrentLocation]);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        setCurrentLocation(locationData);
        setLoading(false);
        if (onLocationUpdate) {
          onLocationUpdate(locationData);
        }
      },
      (error) => {
        setError(`Error getting location: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <MapPinIcon className="h-6 w-6 mr-2 text-blue-600" />
          Location Tracking
        </h3>
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Getting Location...' : 'Update Location'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {currentLocation && (
        <div className="space-y-4">
          <div className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Current Location</p>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Latitude:</span>
                  <span className="text-gray-900 font-mono">{currentLocation.latitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Longitude:</span>
                  <span className="text-gray-900 font-mono">{currentLocation.longitude.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Accuracy:</span>
                  <span className="text-gray-900">{Math.round(currentLocation.accuracy)} meters</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="text-gray-900">
                    {new Date(currentLocation.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your location is tracked for attendance and security purposes. 
              Location data is stored securely and used only for work-related activities.
            </p>
          </div>
        </div>
      )}

      {!currentLocation && !loading && !error && (
        <div className="text-center py-8">
          <MapPinIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            Click "Update Location" to get your current position
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationUpdate;
