import React, { useEffect, useRef } from 'react';

/**
 * LocationMap Component
 * Displays a simple map with user's location marker
 * Uses Leaflet.js for map rendering (lightweight alternative to Google Maps)
 */
const LocationMap = ({ latitude, longitude, accuracy }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // Only load map if we have valid coordinates
    if (!latitude || !longitude || !mapRef.current) return;

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      // Add Leaflet CSS if not already added
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Initialize map
      if (window.L && mapRef.current && !mapInstanceRef.current) {
        const map = window.L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([latitude, longitude], 15);

        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        // Add marker for user location
        const marker = window.L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup(`<b>Your Location</b><br>Accuracy: ${Math.round(accuracy || 0)}m`).openPopup();

        // Add accuracy circle
        if (accuracy) {
          window.L.circle([latitude, longitude], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
            radius: accuracy
          }).addTo(map);
        }

        mapInstanceRef.current = map;
      }
    };

    loadLeaflet().catch(err => {
      console.error('Failed to load map:', err);
    });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
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
        ref={mapRef} 
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
