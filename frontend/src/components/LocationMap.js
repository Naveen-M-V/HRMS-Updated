import React from 'react';
import PureProtomapsComponent from './PureProtomapsComponent';

/**
 * LocationMap Component
 * Wrapper component for backward compatibility
 * Now uses Pure Protomaps implementation
 */
const LocationMap = ({ latitude, longitude, accuracy }) => {

  return (
    <PureProtomapsComponent
      latitude={latitude}
      longitude={longitude}
      accuracy={accuracy}
      height="256px"
      zoom={15}
      showAccuracyCircle={true}
      enableLiveTracking={false}
      style="light"
    />
  );
};

export default LocationMap;
