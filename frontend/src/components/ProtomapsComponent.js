import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { leafletLayer, paintRules } from 'protomaps-leaflet';
import { getCurrentPosition, watchPosition, clearPositionWatch } from '../utils/geolocation';

/**
 * ProtomapsComponent - Modern vector tile mapping with live geolocation
 * Uses pure Protomaps with Leaflet for high-performance mapping
 */
const ProtomapsComponent = ({
  latitude,
  longitude,
  accuracy,
  height = '400px',
  zoom = 14,
  showAccuracyCircle = true,
  enableLiveTracking = false,
  onLocationUpdate = null,
  style = 'light', // 'light', 'dark'
  showControls = true,
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const watchIdRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Fix Leaflet default marker icons
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      // Default coordinates (London, UK)
      const defaultLat = 51.5074;
      const defaultLng = -0.1278;
      
      const initialLat = latitude || defaultLat;
      const initialLng = longitude || defaultLng;

      // Protomaps style configurations
      const styleConfigs = {
        light: {
          version: 8,
          sources: {
            protomaps: {
              type: 'vector',
              url: 'pmtiles://https://build.protomaps.com/20240219.pmtiles',
              attribution: '© <a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
            }
          },
          layers: [
            {
              id: 'background',
              type: 'background',
              paint: { 'background-color': '#f8f9fa' }
            },
            {
              id: 'earth',
              type: 'fill',
              source: 'protomaps',
              'source-layer': 'earth',
              paint: { 'fill-color': '#e9ecef' }
            },
            {
              id: 'natural_areas',
              type: 'fill',
              source: 'protomaps',
              'source-layer': 'natural',
              filter: ['==', ['get', 'pmap:kind'], 'forest'],
              paint: { 'fill-color': '#d4e6d4' }
            },
            {
              id: 'water',
              type: 'fill',
              source: 'protomaps',
              'source-layer': 'water',
              paint: { 'fill-color': '#74c0fc' }
            },
            {
              id: 'roads',
              type: 'line',
              source: 'protomaps',
              'source-layer': 'roads',
              paint: {
                'line-color': '#ffffff',
                'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 4]
              }
            },
            {
              id: 'buildings',
              type: 'fill',
              source: 'protomaps',
              'source-layer': 'buildings',
              paint: { 'fill-color': '#dee2e6', 'fill-opacity': 0.8 }
            },
            {
              id: 'places',
              type: 'symbol',
              source: 'protomaps',
              'source-layer': 'places',
              filter: ['==', ['get', 'pmap:kind'], 'locality'],
              layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 12
              },
              paint: { 'text-color': '#495057' }
            }
          ]
        },
        dark: {
          version: 8,
          sources: {
            protomaps: {
              type: 'vector',
              url: 'pmtiles://https://build.protomaps.com/20240219.pmtiles',
              attribution: '© <a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
            }
          },
          layers: [
            {
              id: 'background',
              type: 'background',
              paint: { 'background-color': '#1a1a1a' }
            },
            {
              id: 'earth',
              type: 'fill',
              source: 'protomaps',
              'source-layer': 'earth',
              paint: { 'fill-color': '#2d2d2d' }
            },
            {
              id: 'natural_areas',
              type: 'fill',
              source: 'protomaps',
              'source-layer': 'natural',
              filter: ['==', ['get', 'pmap:kind'], 'forest'],
              paint: { 'fill-color': '#1a4d1a' }
            },
            {
              id: 'water',
              type: 'fill',
              source: 'protomaps',
              'source-layer': 'water',
              paint: { 'fill-color': '#1a365d' }
            },
            {
              id: 'roads',
              type: 'line',
              source: 'protomaps',
              'source-layer': 'roads',
              paint: {
                'line-color': '#404040',
                'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 4]
              }
            },
            {
              id: 'buildings',
              type: 'fill',
              source: 'protomaps',
              'source-layer': 'buildings',
              paint: { 'fill-color': '#404040', 'fill-opacity': 0.8 }
            },
            {
              id: 'places',
              type: 'symbol',
              source: 'protomaps',
              'source-layer': 'places',
              filter: ['==', ['get', 'pmap:kind'], 'locality'],
              layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 12
              },
              paint: { 'text-color': '#e9ecef' }
            }
          ]
        }
      };

      // Initialize MapLibre GL map with Protomaps style
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: styleConfigs[style] || styleConfigs.light,
        center: [initialLng, initialLat],
        zoom: zoom,
        attributionControl: true
      });

      // Add controls if enabled
      if (showControls) {
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.addControl(new maplibregl.FullscreenControl(), 'top-right');
        
        // Add geolocate control
        const geolocateControl = new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: enableLiveTracking,
          showUserHeading: true
        });
        map.addControl(geolocateControl, 'top-right');
      }

      // Wait for map to load
      map.on('load', () => {
        setIsLoading(false);
        
        // Add accuracy circle if enabled and accuracy is provided
        if (showAccuracyCircle && accuracy) {
          addAccuracyCircle(map, initialLng, initialLat, accuracy);
        }

        // Add custom marker
        const marker = new maplibregl.Marker({ 
          color: '#EF4444',
          draggable: false 
        })
          .setLngLat([initialLng, initialLat])
          .addTo(map);

        // Add popup to marker
        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(createPopupHTML(initialLat, initialLng, accuracy, enableLiveTracking));
        
        marker.setPopup(popup);
        popup.addTo(map);

        markerRef.current = marker;
        mapInstanceRef.current = map;

        // Enable live tracking if requested
        if (enableLiveTracking) {
          startLiveTracking();
        }
      });

      map.on('error', (e) => {
        console.error('Protomaps error:', e);
        setError('Failed to load map. Please check your internet connection.');
        setIsLoading(false);
      });

    } catch (err) {
      console.error('Failed to initialize Protomaps:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (watchIdRef.current) {
        clearPositionWatch(watchIdRef.current);
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
      .setHTML(createPopupHTML(latitude, longitude, accuracy, enableLiveTracking));
    
    markerRef.current.setPopup(popup);

    // Update current location state
    setCurrentLocation({ latitude, longitude, accuracy });

    // Trigger callback
    if (onLocationUpdate) {
      onLocationUpdate({ latitude, longitude, accuracy });
    }
  }, [latitude, longitude, accuracy, zoom, showAccuracyCircle, enableLiveTracking, onLocationUpdate]);

  // Function to create popup HTML
  const createPopupHTML = (lat, lng, acc, isLive) => {
    return `
      <div style="padding: 12px; font-family: system-ui, sans-serif; min-width: 200px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="width: 8px; height: 8px; background-color: ${isLive ? '#10b981' : '#3B82F6'}; border-radius: 50%;"></div>
          <strong style="font-size: 14px; color: #111827;">
            ${isLive ? 'Live Location' : 'Your Location'}
          </strong>
        </div>
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
          📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}
        </div>
        ${acc ? `<div style="font-size: 11px; color: #9ca3af;">🎯 Accuracy: ${Math.round(acc)}m</div>` : ''}
        <div style="font-size: 10px; color: #6b7280; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          Powered by Protomaps
        </div>
      </div>
    `;
  };

  // Function to start live tracking
  const startLiveTracking = async () => {
    try {
      console.log('🔴 Starting Protomaps live GPS tracking...');
      
      const watchId = watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position;
          console.log('📍 Protomaps live position update:', { latitude, longitude, accuracy });

          if (markerRef.current && mapInstanceRef.current) {
            // Update marker position
            markerRef.current.setLngLat([longitude, latitude]);

            // Fly to new position
            mapInstanceRef.current.flyTo({ 
              center: [longitude, latitude], 
              zoom: 15,
              essential: true 
            });

            // Update accuracy circle
            if (showAccuracyCircle && mapInstanceRef.current.getSource('accuracy-circle')) {
              updateAccuracyCircle(mapInstanceRef.current, longitude, latitude, accuracy);
            } else if (showAccuracyCircle) {
              addAccuracyCircle(mapInstanceRef.current, longitude, latitude, accuracy);
            }

            // Update popup
            const popup = new maplibregl.Popup({ offset: 25 })
              .setHTML(createPopupHTML(latitude, longitude, accuracy, true));
            
            markerRef.current.setPopup(popup);

            // Update state
            setCurrentLocation({ latitude, longitude, accuracy });

            // Trigger callback
            if (onLocationUpdate) {
              onLocationUpdate({ latitude, longitude, accuracy });
            }
          }
        },
        (error) => {
          console.error('Protomaps GPS tracking error:', error);
          setError(`GPS tracking failed: ${error.message}`);
        }
      );

      watchIdRef.current = watchId;
    } catch (error) {
      console.error('Failed to start live tracking:', error);
      setError(`Failed to start live tracking: ${error.message}`);
    }
  };

  // Function to add accuracy circle
  const addAccuracyCircle = (map, lng, lat, accuracyMeters) => {
    if (!map || !accuracyMeters) return;

    const circleCoords = createCircle([lng, lat], accuracyMeters);

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

    map.addLayer({
      id: 'accuracy-circle-fill',
      type: 'fill',
      source: 'accuracy-circle',
      paint: {
        'fill-color': '#3B82F6',
        'fill-opacity': 0.2
      }
    });

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
    ret.push(ret[0]);
    return ret;
  };

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
        style={{ height }}
      >
        <div className="text-center text-red-600 p-6">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-semibold mb-1">Map Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading Protomaps...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full rounded-lg shadow-lg border border-gray-200"
        style={{ height }}
      />
      
      {currentLocation && (
        <div className="mt-2 text-xs text-gray-600 text-center font-mono">
          📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          {currentLocation.accuracy && ` • ±${Math.round(currentLocation.accuracy)}m`}
          {enableLiveTracking && <span className="text-green-600 ml-2">🔴 Live</span>}
        </div>
      )}
    </div>
  );
};

export default ProtomapsComponent;
