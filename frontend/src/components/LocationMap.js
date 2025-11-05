import React from 'react';
import MapTilerMap from './MapTilerMap';

/**
 * LocationMap Component
 * Wrapper component for backward compatibility
 * Uses MapTiler with MapLibre GL JS for map rendering
 */
const LocationMap = ({ latitude, longitude, accuracy }) => {

  return (
    <MapTilerMap
      latitude={latitude}
      longitude={longitude}
      accuracy={accuracy}
      height="256px"
      zoom={15}
      showAccuracyCircle={true}
      enableLiveTracking={false}
    />
  );
};

export default LocationMap;
