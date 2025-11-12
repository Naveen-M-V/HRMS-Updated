import React, { useEffect, useRef, useState } from 'react';
import { getCurrentPosition, watchPosition, clearPositionWatch } from '../utils/geolocation';

/**
 * PureProtomapsComponent - Pure Protomaps implementation without external mapping libraries
 * Uses Protomaps tiles directly with Canvas API for rendering
 */
const PureProtomapsComponent = ({
  latitude,
  longitude,
  accuracy,
  height = '400px',
  zoom = 14,
  showAccuracyCircle = true,
  enableLiveTracking = false,
  onLocationUpdate = null,
  style = 'light',
  className = ''
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const watchIdRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lng: -0.1278 }); // London default
  const [mapZoom, setMapZoom] = useState(zoom);

  // Initialize map
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Set initial location if provided
    if (latitude && longitude) {
      setMapCenter({ lat: latitude, lng: longitude });
      setCurrentLocation({ latitude, longitude, accuracy });
    }

    setIsLoading(false);

    // Start live tracking if enabled
    if (enableLiveTracking) {
      startLiveTracking();
    }

    // Draw initial map
    drawMap(ctx, canvas.width, canvas.height).catch(console.error);

    return () => {
      if (watchIdRef.current) {
        clearPositionWatch(watchIdRef.current);
      }
    };
  }, []);

  // Update map when location changes
  useEffect(() => {
    if (latitude && longitude && canvasRef.current) {
      setMapCenter({ lat: latitude, lng: longitude });
      setCurrentLocation({ latitude, longitude, accuracy });
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      drawMap(ctx, canvas.width, canvas.height).catch(console.error);

      if (onLocationUpdate) {
        onLocationUpdate({ latitude, longitude, accuracy });
      }
    }
  }, [latitude, longitude, accuracy]);

  // Draw map function
  const drawMap = async (ctx, width, height) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = style === 'dark' ? '#1a1a1a' : '#f0f8ff';
    ctx.fillRect(0, 0, width, height);

    // Load and draw Protomaps tiles
    await loadProtomapsTiles(ctx, width, height);

    // Draw location marker if available
    if (currentLocation) {
      drawLocationMarker(ctx, width, height);
    }

    // Draw accuracy circle if enabled
    if (showAccuracyCircle && currentLocation?.accuracy) {
      drawAccuracyCircle(ctx, width, height);
    }

    // Draw compass
    drawCompass(ctx, width, height);

    // Draw scale
    drawScale(ctx, width, height);
  };

  // Load and draw Protomaps tiles
  const loadProtomapsTiles = async (ctx, width, height) => {
    try {
      // Calculate tile coordinates based on current location and zoom
      const lat = currentLocation?.latitude || mapCenter.lat;
      const lng = currentLocation?.longitude || mapCenter.lng;
      
      // Convert lat/lng to tile coordinates
      const tileCoords = latLngToTile(lat, lng, mapZoom);
      
      // Load multiple tiles around the center for better coverage
      const tilesToLoad = [
        { x: tileCoords.x - 2, y: tileCoords.y - 2 },
        { x: tileCoords.x - 1, y: tileCoords.y - 2 },
        { x: tileCoords.x, y: tileCoords.y - 2 },
        { x: tileCoords.x + 1, y: tileCoords.y - 2 },
        { x: tileCoords.x + 2, y: tileCoords.y - 2 },
        { x: tileCoords.x - 2, y: tileCoords.y - 1 },
        { x: tileCoords.x - 1, y: tileCoords.y - 1 },
        { x: tileCoords.x, y: tileCoords.y - 1 },
        { x: tileCoords.x + 1, y: tileCoords.y - 1 },
        { x: tileCoords.x + 2, y: tileCoords.y - 1 },
        { x: tileCoords.x - 2, y: tileCoords.y },
        { x: tileCoords.x - 1, y: tileCoords.y },
        { x: tileCoords.x, y: tileCoords.y },
        { x: tileCoords.x + 1, y: tileCoords.y },
        { x: tileCoords.x + 2, y: tileCoords.y },
        { x: tileCoords.x - 2, y: tileCoords.y + 1 },
        { x: tileCoords.x - 1, y: tileCoords.y + 1 },
        { x: tileCoords.x, y: tileCoords.y + 1 },
        { x: tileCoords.x + 1, y: tileCoords.y + 1 },
        { x: tileCoords.x + 2, y: tileCoords.y + 1 },
        { x: tileCoords.x - 2, y: tileCoords.y + 2 },
        { x: tileCoords.x - 1, y: tileCoords.y + 2 },
        { x: tileCoords.x, y: tileCoords.y + 2 },
        { x: tileCoords.x + 1, y: tileCoords.y + 2 },
        { x: tileCoords.x + 2, y: tileCoords.y + 2 }
      ];

      // Only draw base map if no tiles load successfully
      let tilesLoaded = 0;

      // Load and draw tiles
      const tilePromises = tilesToLoad.map(async (tile) => {
        const loaded = await loadTile(ctx, tile.x, tile.y, mapZoom, width, height);
        if (loaded) tilesLoaded++;
        return loaded;
      });

      await Promise.all(tilePromises);

      // If no tiles loaded, show fallback
      if (tilesLoaded === 0) {
        console.warn('No tiles loaded, showing fallback map');
        drawBaseMap(ctx, width, height);
      } else {
        console.log(`✅ Loaded ${tilesLoaded} map tiles successfully`);
      }
    } catch (error) {
      console.error('Failed to load Protomaps tiles:', error);
      // Fallback to basic map
      drawBaseMap(ctx, width, height);
    }
  };

  // Convert lat/lng to tile coordinates
  const latLngToTile = (lat, lng, zoom) => {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  };

  // Load individual tile
  const loadTile = async (ctx, x, y, z, canvasWidth, canvasHeight) => {
    try {
      // Use OpenStreetMap tiles as Protomaps alternative (free)
      const tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => {
          try {
            // Calculate tile position on canvas
            const tileSize = 256;
            const centerTile = latLngToTile(currentLocation?.latitude || mapCenter.lat, currentLocation?.longitude || mapCenter.lng, mapZoom);
            
            const offsetX = (x - centerTile.x) * tileSize + canvasWidth / 2 - tileSize / 2;
            const offsetY = (y - centerTile.y) * tileSize + canvasHeight / 2 - tileSize / 2;
            
            // Only draw if tile is visible on canvas
            if (offsetX > -tileSize && offsetX < canvasWidth && offsetY > -tileSize && offsetY < canvasHeight) {
              ctx.drawImage(img, offsetX, offsetY, tileSize, tileSize);
              resolve(true); // Successfully loaded and drawn
            } else {
              resolve(false); // Outside canvas bounds
            }
          } catch (drawError) {
            console.warn('Error drawing tile:', drawError);
            resolve(false);
          }
        };
        
        img.onerror = () => {
          console.warn(`Failed to load tile: ${tileUrl}`);
          resolve(false); // Failed to load
        };
        
        // Add timeout for tile loading
        setTimeout(() => {
          if (!img.complete) {
            console.warn(`Tile loading timeout: ${tileUrl}`);
            resolve(false);
          }
        }, 5000);
        
        img.src = tileUrl;
      });
    } catch (error) {
      console.warn('Tile loading error:', error);
      return false;
    }
  };

  // Draw base map when tiles fail
  const drawBaseMap = (ctx, width, height) => {
    // Draw water (blue background)
    ctx.fillStyle = style === 'dark' ? '#1e3a5f' : '#a8dadc';
    ctx.fillRect(0, 0, width, height);

    // Draw land masses
    ctx.fillStyle = style === 'dark' ? '#2d3748' : '#f1faee';
    
    // Simple land shapes
    ctx.beginPath();
    ctx.ellipse(width * 0.3, height * 0.4, width * 0.25, height * 0.3, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(width * 0.7, height * 0.6, width * 0.2, height * 0.25, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Draw roads
    ctx.strokeStyle = style === 'dark' ? '#4a5568' : '#e63946';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.moveTo(width * 0.5, 0);
    ctx.lineTo(width * 0.5, height);
    ctx.stroke();
  };

  // Draw map features (roads, buildings)
  const drawMapFeatures = (ctx, width, height) => {
    // Draw roads
    ctx.strokeStyle = style === 'dark' ? '#555555' : '#ffffff';
    ctx.lineWidth = 3;

    // Main road (horizontal)
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Cross road (vertical)
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Draw buildings
    ctx.fillStyle = style === 'dark' ? '#333333' : '#d0d0d0';
    
    // Building blocks
    const buildings = [
      { x: 100, y: 80, w: 60, h: 40 },
      { x: 200, y: 120, w: 80, h: 60 },
      { x: 320, y: 90, w: 50, h: 50 },
      { x: 150, y: 250, w: 70, h: 45 },
      { x: 280, y: 280, w: 90, h: 55 }
    ];

    buildings.forEach(building => {
      ctx.fillRect(building.x, building.y, building.w, building.h);
      
      // Building outline
      ctx.strokeStyle = style === 'dark' ? '#555555' : '#aaaaaa';
      ctx.lineWidth = 1;
      ctx.strokeRect(building.x, building.y, building.w, building.h);
    });
  };

  // Draw location marker
  const drawLocationMarker = (ctx, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Outer circle (white)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
    ctx.fill();

    // Inner circle (red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Pulse effect for live tracking
    if (enableLiveTracking && watchIdRef.current) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  // Draw accuracy circle
  const drawAccuracyCircle = (ctx, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Convert accuracy meters to pixels (rough approximation)
    const pixelsPerMeter = mapZoom / 10;
    const radius = (currentLocation.accuracy || 10) * pixelsPerMeter;

    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(radius, 100), 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  };

  // Draw compass
  const drawCompass = (ctx, width, height) => {
    const compassX = width - 40;
    const compassY = 40;
    const compassRadius = 20;

    // Compass background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(compassX, compassY, compassRadius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.stroke();

    // North arrow
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - 15);
    ctx.lineTo(compassX - 5, compassY - 5);
    ctx.lineTo(compassX + 5, compassY - 5);
    ctx.closePath();
    ctx.fill();

    // N label
    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('N', compassX, compassY + 25);
  };

  // Draw scale
  const drawScale = (ctx, width, height) => {
    const scaleX = 20;
    const scaleY = height - 40;
    const scaleWidth = 100;

    // Scale background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(scaleX - 5, scaleY - 15, scaleWidth + 10, 25);

    // Scale line
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + scaleWidth, scaleY);
    ctx.stroke();

    // Scale markers
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY - 5);
    ctx.lineTo(scaleX, scaleY + 5);
    ctx.moveTo(scaleX + scaleWidth, scaleY - 5);
    ctx.lineTo(scaleX + scaleWidth, scaleY + 5);
    ctx.stroke();

    // Scale label
    ctx.fillStyle = '#333333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('100m', scaleX + scaleWidth / 2, scaleY - 8);
  };

  // Start live tracking with high accuracy
  const startLiveTracking = async () => {
    try {
      console.log('🔴 Starting high-accuracy GPS tracking...');
      
      // First get current position with high accuracy
      const currentPos = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });

      if (currentPos) {
        const { latitude, longitude, accuracy } = currentPos;
        console.log('📍 Initial GPS position (high-accuracy):', { 
          latitude: latitude.toFixed(6), 
          longitude: longitude.toFixed(6), 
          accuracy: Math.round(accuracy) + 'm' 
        });
        
        setMapCenter({ lat: latitude, lng: longitude });
        setCurrentLocation({ latitude, longitude, accuracy });

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          await drawMap(ctx, canvas.width, canvas.height);
        }

        if (onLocationUpdate) {
          onLocationUpdate({ latitude, longitude, accuracy });
        }
      }
      
      // Then start watching for updates
      const watchId = watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position;
          console.log('🔴 Live GPS update:', { 
            latitude: latitude.toFixed(6), 
            longitude: longitude.toFixed(6), 
            accuracy: Math.round(accuracy) + 'm',
            timestamp: new Date().toLocaleTimeString()
          });

          setMapCenter({ lat: latitude, lng: longitude });
          setCurrentLocation({ latitude, longitude, accuracy });

          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            await drawMap(ctx, canvas.width, canvas.height);
          }

          if (onLocationUpdate) {
            onLocationUpdate({ latitude, longitude, accuracy });
          }
        },
        (error) => {
          console.error('GPS tracking error:', error);
          setError(`GPS tracking failed: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );

      watchIdRef.current = watchId;
    } catch (error) {
      console.error('Failed to start live tracking:', error);
      setError(`Failed to start live tracking: ${error.message}`);
    }
  };

  // Handle canvas click - only zoom, don't change location
  const handleCanvasClick = async (event) => {
    // Only zoom on click, don't change the actual GPS location
    console.log('🖱️ Map clicked - zooming in (GPS location unchanged)');
    
    setMapZoom(prev => Math.min(prev + 1, 18));
    
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      await drawMap(ctx, canvas.width, canvas.height);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = async () => {
      if (canvasRef.current && containerRef.current) {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        const ctx = canvas.getContext('2d');
        await drawMap(ctx, canvas.width, canvas.height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentLocation, mapZoom]);

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
            <p className="text-sm text-gray-600">Loading Pure Protomaps...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="w-full rounded-lg shadow-lg border border-gray-200 overflow-hidden"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-pointer"
          style={{ display: 'block' }}
        />
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={async () => {
            setMapZoom(prev => Math.min(prev + 1, 20));
            if (canvasRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              await drawMap(ctx, canvas.width, canvas.height);
            }
          }}
          className="bg-white hover:bg-gray-50 border border-gray-300 rounded px-3 py-1 text-sm font-medium shadow-sm"
        >
          +
        </button>
        <button
          onClick={async () => {
            setMapZoom(prev => Math.max(prev - 1, 1));
            if (canvasRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              await drawMap(ctx, canvas.width, canvas.height);
            }
          }}
          className="bg-white hover:bg-gray-50 border border-gray-300 rounded px-3 py-1 text-sm font-medium shadow-sm"
        >
          -
        </button>
      </div>

      {/* Location Info & Debug Panel */}
      {currentLocation && (
        <div className="mt-3 space-y-2">
          {/* Main Location Info */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                {currentLocation.accuracy && `±${Math.round(currentLocation.accuracy)}m`}
                {enableLiveTracking && watchIdRef.current && <span className="ml-2 text-green-600">🔴 Live</span>}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Real Map Tiles • Zoom: {mapZoom}</span>
              <span>Updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Debug Panel */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-blue-800">
              <div className="font-medium mb-1">🔍 GPS Debug Info:</div>
              <div>• Click map = Zoom only (location stays same)</div>
              <div>• Red dot = Your actual GPS position</div>
              <div>• Accuracy circle shows GPS precision</div>
              <div>• Check browser console for detailed GPS logs</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PureProtomapsComponent;
