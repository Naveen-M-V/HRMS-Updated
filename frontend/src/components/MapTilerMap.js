import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * MapTilerMap Component
 * Reusable map component using MapTiler and MapLibre GL JS
 * Features: Real-time geolocation tracking, dynamic markers, accuracy circle
 */
const MapTilerMap = ({ 
  latitude, 
  longitude, 
  accuracy,
  height = '400px',
  zoom = 14,
  showAccuracyCircle = true,
  enableLiveTracking = false,
  onLocationUpdate = null
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Prevent duplicate map initialization
    if (mapInstanceRef.current) return;

    try {
      // Get MapTiler API key from environment
      const apiKey = process.env.REACT_APP_MAPTILER_API_KEY || 'YOUR_MAPTILER_API_KEY';
      
      // Default coordinates (Chennai, India)
      const defaultLat = 13.0827;
      const defaultLng = 80.2707;
      
      const initialLat = latitude || defaultLat;
      const initialLng = longitude || defaultLng;

      // Initialize MapLibre GL map with MapTiler style
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
        center: [initialLng, initialLat],
        zoom: zoom,
        attributionControl: true
      });

      // Add navigation controls (zoom buttons)
      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Add fullscreen control
      map.addControl(new maplibregl.FullscreenControl(), 'top-right');

      // Wait for map to load
      map.on('load', () => {
        // Add accuracy circle if enabled and accuracy is provided
        if (showAccuracyCircle && accuracy) {
          addAccuracyCircle(map, initialLng, initialLat, accuracy);
        }

        // Add marker
        const marker = new maplibregl.Marker({ 
          color: '#EF4444', // Red marker
          draggable: false 
        })
          .setLngLat([initialLng, initialLat])
          .addTo(map);

        // Add popup to marker
        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 8px; font-family: system-ui, sans-serif;">
              <strong style="font-size: 14px; color: #111827;">Your Location</strong>
              <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">
                ${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}
              </div>
              ${accuracy ? `<div style="margin-top: 4px; font-size: 11px; color: #9ca3af;">Accuracy: ${Math.round(accuracy)}m</div>` : ''}
            </div>
          `);
        
        marker.setPopup(popup);
        popup.addTo(map);

        markerRef.current = marker;
        mapInstanceRef.current = map;

        // Enable live tracking if requested
        if (enableLiveTracking && navigator.geolocation) {
          startLiveTracking(map, marker);
        }
      });

      map.on('error', (e) => {
        console.error('MapTiler error:', e);
        setError('Failed to load map. Please check your MapTiler API key.');
      });

    } catch (err) {
      console.error('Failed to initialize MapTiler map:', err);
      setError('Failed to initialize map');
    }

    // Cleanup
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (!latitude || !longitude) return;

    const newPosition = [longitude, latitude];
    
    // Update marker position
    markerRef.current.setLngLat(newPosition);
    
    // Update map center with smooth animation
    mapInstanceRef.current.flyTo({ 
      center: newPosition, 
      zoom: zoom,
      essential: true 
    });

    // Update accuracy circle if enabled
    if (showAccuracyCircle && accuracy && mapInstanceRef.current.getSource('accuracy-circle')) {
      updateAccuracyCircle(mapInstanceRef.current, longitude, latitude, accuracy);
    } else if (showAccuracyCircle && accuracy) {
      addAccuracyCircle(mapInstanceRef.current, longitude, latitude, accuracy);
    }

    // Update popup
    const popup = new maplibregl.Popup({ offset: 25 })
      .setHTML(`
        <div style="padding: 8px; font-family: system-ui, sans-serif;">
          <strong style="font-size: 14px; color: #111827;">Your Location</strong>
          <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">
            ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
          </div>
          ${accuracy ? `<div style="margin-top: 4px; font-size: 11px; color: #9ca3af;">Accuracy: ${Math.round(accuracy)}m</div>` : ''}
        </div>
      `);
    
    markerRef.current.setPopup(popup);

    // Trigger callback
    if (onLocationUpdate) {
      onLocationUpdate({ latitude, longitude, accuracy });
    }
  }, [latitude, longitude, accuracy, zoom, showAccuracyCircle, onLocationUpdate]);

  // Function to add accuracy circle
  const addAccuracyCircle = (map, lng, lat, accuracyMeters) => {
    if (!map || !accuracyMeters) return;

    // Create circle coordinates
    const circleCoords = createCircle([lng, lat], accuracyMeters);

    // Add source
    map.addSource('accuracy-circle', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [circleCoords]
        }
      }
    });

    // Add fill layer
    map.addLayer({
      id: 'accuracy-circle-fill',
      type: 'fill',
      source: 'accuracy-circle',
      paint: {
        'fill-color': '#3B82F6',
        'fill-opacity': 0.2
      }
    });

    // Add outline layer
    map.addLayer({
      id: 'accuracy-circle-outline',
      type: 'line',
      source: 'accuracy-circle',
      paint: {
        'line-color': '#3B82F6',
        'line-width': 2,
        'line-opacity': 0.6
      }
    });
  };

  // Function to update accuracy circle
  const updateAccuracyCircle = (map, lng, lat, accuracyMeters) => {
    if (!map || !accuracyMeters) return;

    const source = map.getSource('accuracy-circle');
    if (source) {
      const circleCoords = createCircle([lng, lat], accuracyMeters);
      source.setData({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [circleCoords]
        }
      });
    }
  };

  // Function to create circle coordinates
  const createCircle = (center, radiusInMeters, points = 64) => {
    const coords = {
      latitude: center[1],
      longitude: center[0]
    };
    
    const km = radiusInMeters / 1000;
    const ret = [];
    const distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]); // Close the circle
    return ret;
  };

  // Function to start live tracking
  const startLiveTracking = (map, marker) => {
    console.log('🔴 Starting live GPS tracking...');
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('📍 Live position update:', { latitude, longitude, accuracy });

        // Update marker position
        marker.setLngLat([longitude, latitude]);

        // Fly to new position
        map.flyTo({ 
          center: [longitude, latitude], 
          zoom: 15,
          essential: true 
        });

        // Update accuracy circle
        if (showAccuracyCircle && map.getSource('accuracy-circle')) {
          updateAccuracyCircle(map, longitude, latitude, accuracy);
        } else if (showAccuracyCircle) {
          addAccuracyCircle(map, longitude, latitude, accuracy);
        }

        // Update popup
        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 8px; font-family: system-ui, sans-serif;">
              <strong style="font-size: 14px; color: #111827;">Your Location</strong>
              <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">
                ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
              </div>
              <div style="margin-top: 4px; font-size: 11px; color: #9ca3af;">Accuracy: ${Math.round(accuracy)}m</div>
              <div style="margin-top: 4px; font-size: 10px; color: #10b981;">🔴 Live Tracking</div>
            </div>
          `);
        
        marker.setPopup(popup);

        // Trigger callback
        if (onLocationUpdate) {
          onLocationUpdate({ latitude, longitude, accuracy });
        }
      },
      (err) => {
        console.error('GPS tracking error:', err);
        setError('GPS tracking failed. Please enable location permissions.');
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    watchIdRef.current = watchId;
  };

  if (error) {
    return (
      <div 
        style={{
          width: '100%',
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FEE2E2',
          borderRadius: '10px',
          border: '1px solid #FCA5A5'
        }}
      >
        <div style={{ textAlign: 'center', color: '#DC2626', padding: '20px' }}>
          <svg 
            style={{ width: '48px', height: '48px', margin: '0 auto 12px' }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <p style={{ fontWeight: '600', marginBottom: '4px' }}>Map Error</p>
          <p style={{ fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div 
        ref={mapRef} 
        style={{
          width: '100%',
          height: height,
          borderRadius: '10px',
          boxShadow: '0 0 10px rgba(0,0,0,0.15)',
          border: '1px solid #E5E7EB'
        }}
      />
      {(latitude && longitude) && (
        <div 
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: '#6B7280',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
          {accuracy && ` • Accuracy: ${Math.round(accuracy)}m`}
          {enableLiveTracking && <span style={{ color: '#10b981', marginLeft: '8px' }}>🔴 Live</span>}
        </div>
      )}
    </div>
  );
};

export default MapTilerMap;
