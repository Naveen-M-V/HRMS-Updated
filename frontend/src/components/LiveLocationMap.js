import React, { useState, useEffect } from 'react';
import PureProtomapsComponent from './PureProtomapsComponent';
import useLiveLocation from '../hooks/useLiveLocation';
import { MapPinIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

/**
 * LiveLocationMap - Enhanced location component with Pure Protomaps
 * Uses only Pure Protomaps implementation for live tracking
 */
const LiveLocationMap = ({
  height = '400px',
  enableLiveTracking = false,
  showControls = true,
  style = 'light', // 'light', 'dark'
  onLocationUpdate = null,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Use live location hook
  const {
    location,
    isTracking,
    error: locationError,
    permission,
    isLoading: locationLoading,
    startTracking,
    stopTracking,
    getCurrentLocation,
    requestPermission
  } = useLiveLocation({
    autoStart: enableLiveTracking,
    onLocationUpdate: onLocationUpdate
  });

  // Handle location permission request
  const handleRequestPermission = async () => {
    try {
      await requestPermission();
      if (enableLiveTracking) {
        startTracking();
      } else {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Failed to request location permission:', error);
    }
  };

  // Toggle map visibility
  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  // Render permission request UI
  if (permission === 'denied' || (permission === 'prompt' && !location)) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-6 ${className}`} style={{ height }}>
        <div className="text-center">
          <MapPinIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Location Access Required
          </h3>
          <p className="text-blue-700 mb-4 text-sm">
            {permission === 'denied' 
              ? 'Location access was denied. Please enable location permissions in your browser settings.'
              : 'We need access to your location to show you on the map and enable live tracking features.'
            }
          </p>
          <button
            onClick={handleRequestPermission}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {permission === 'denied' ? 'Retry Location Access' : 'Enable Location'}
          </button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (locationLoading && !location) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Getting your location...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (locationError && !location) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`} style={{ height }}>
        <div className="text-center">
          <MapPinIcon className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Location Error</h3>
          <p className="text-red-700 mb-4 text-sm">{locationError}</p>
          <button
            onClick={getCurrentLocation}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Visibility Toggle */}
        <button
          onClick={toggleVisibility}
          className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-sm transition-colors"
          title={isVisible ? 'Hide Map' : 'Show Map'}
        >
          {isVisible ? (
            <EyeSlashIcon className="w-4 h-4 text-gray-600" />
          ) : (
            <EyeIcon className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* Pure Protomaps Label */}
        {isVisible && (
          <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm text-xs font-medium text-gray-700">
            Protomaps
          </div>
        )}

        {/* Live Tracking Toggle */}
        {isVisible && enableLiveTracking && (
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`border rounded-lg px-3 py-2 shadow-sm transition-colors text-xs font-medium ${
              isTracking
                ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title={isTracking ? 'Stop Live Tracking' : 'Start Live Tracking'}
          >
            {isTracking ? '🔴 Live' : '📍 Track'}
          </button>
        )}
      </div>

      {/* Status Badge */}
      {isVisible && location && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isTracking ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
              }`}></div>
              <span className="text-xs font-medium text-gray-700">
                {isTracking ? 'Live' : 'Located'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Map Component */}
      {isVisible && location && (
        <PureProtomapsComponent
          latitude={location.latitude}
          longitude={location.longitude}
          accuracy={location.accuracy}
          height={height}
          zoom={15}
          showAccuracyCircle={true}
          enableLiveTracking={isTracking}
          onLocationUpdate={onLocationUpdate}
          style={style}
          className="transition-opacity duration-300"
        />
      )}

      {/* Collapsed State */}
      {!isVisible && (
        <div 
          className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
          style={{ height }}
          onClick={toggleVisibility}
        >
          <div className="text-center text-gray-500">
            <MapPinIcon className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Map Hidden</p>
            <p className="text-xs">Click to show</p>
          </div>
        </div>
      )}

      {/* Location Info */}
      {isVisible && location && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              {location.accuracy && `±${Math.round(location.accuracy)}m`}
              {isTracking && <span className="ml-2 text-green-600">🔴 Live</span>}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Powered by Pure Protomaps</span>
            <span>Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveLocationMap;
