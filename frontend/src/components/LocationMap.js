import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * LocationMap Component
 * Displays a simple map with user's location marker
 * Uses MapLibre GL JS for map rendering (open-source alternative to Mapbox GL)
 */
const LocationMap = ({ latitude, longitude, accuracy }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyLayerRef = useRef(null);

  useEffect(() => {
    // Only load map if we have valid coordinates
    if (!latitude || !longitude || !mapContainerRef.current) return;

    // Prevent duplicate map initialization
    if (mapInstanceRef.current) return;

    try {
      // Initialize MapLibre GL map
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://demotiles.maplibre.org/style.json', // Free MapLibre demo tiles
        center: [longitude, latitude],
        zoom: 15,
        attributionControl: true
      });

      // Add navigation controls (zoom buttons)
      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Wait for map to load before adding markers
      map.on('load', () => {
        // Add accuracy circle layer if accuracy is provided
        if (accuracy) {
          // Create a circle using turf-like calculation
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

          const circleCoords = createCircle([longitude, latitude], accuracy);

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
              'fill-color': '#3b82f6',
              'fill-opacity': 0.2
            }
          });

          map.addLayer({
            id: 'accuracy-circle-outline',
            type: 'line',
            source: 'accuracy-circle',
            paint: {
              'line-color': '#3b82f6',
              'line-width': 2,
              'line-opacity': 0.6
            }
          });

          accuracyLayerRef.current = true;
        }

        // Add marker for user location
        const marker = new maplibregl.Marker({ color: '#ef4444' })
          .setLngLat([longitude, latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 })
              .setHTML(`<b>Your Location</b><br>Accuracy: ${Math.round(accuracy || 0)}m`)
          )
          .addTo(map);

        marker.togglePopup(); // Open popup by default
        markerRef.current = marker;
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.error('Failed to initialize MapLibre GL map:', err);
    }

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      accuracyLayerRef.current = null;
    };
  }, [latitude, longitude, accuracy]);

  if (!latitude || !longitude) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>Location not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        ref={mapContainerRef} 
        className="w-full h-64 rounded-lg shadow-md border border-gray-200"
        style={{ zIndex: 1 }}
      />
      <div className="mt-2 text-sm text-gray-600 text-center">
        📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
    </div>
  );
};

export default LocationMap;
