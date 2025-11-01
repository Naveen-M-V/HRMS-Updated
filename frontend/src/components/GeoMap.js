import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPinIcon, 
  UserGroupIcon, 
  ClockIcon, 
  EyeIcon,
  RefreshIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getAllEmployeeLocations, findNearbyEmployees } from '../utils/locationApi';
import { toast } from 'react-toastify';

const GeoMap = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchLocation, setSearchLocation] = useState({ lat: '', lng: '', radius: 5 });
  const [nearbyEmployees, setNearbyEmployees] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lng: -0.1278 }); // Default to London
  const [zoom, setZoom] = useState(10);
  const mapRef = useRef(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsMapLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Google Maps');
        toast.error('Failed to load map. Please check your internet connection.');
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      initializeMap();
    }
  }, [isMapLoaded, employees]);

  // Fetch employee locations
  const fetchEmployeeLocations = async () => {
    try {
      setLoading(true);
      const response = await getAllEmployeeLocations();
      setEmployees(response.data || []);
      
      // Update map center to show all employees
      if (response.data && response.data.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        response.data.forEach(emp => {
          bounds.extend(new window.google.maps.LatLng(
            emp.coordinates.latitude, 
            emp.coordinates.longitude
          ));
        });
        
        if (mapRef.current && mapRef.current.map) {
          mapRef.current.map.fitBounds(bounds);
        }
      }
    } catch (error) {
      console.error('Failed to fetch employee locations:', error);
      toast.error('Failed to load employee locations');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Map
  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapRef.current.map = map;
    mapRef.current.markers = [];

    // Add markers for each employee
    employees.forEach(employee => {
      addEmployeeMarker(map, employee);
    });
  };

  // Add marker for employee
  const addEmployeeMarker = (map, employee) => {
    const marker = new window.google.maps.Marker({
      position: {
        lat: employee.coordinates.latitude,
        lng: employee.coordinates.longitude
      },
      map: map,
      title: employee.employeeName,
      icon: {
        url: getMarkerIcon(employee.workLocation),
        scaledSize: new window.google.maps.Size(32, 32)
      }
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: createInfoWindowContent(employee)
    });

    marker.addListener('click', () => {
      // Close other info windows
      if (mapRef.current.activeInfoWindow) {
        mapRef.current.activeInfoWindow.close();
      }
      
      infoWindow.open(map, marker);
      mapRef.current.activeInfoWindow = infoWindow;
      setSelectedEmployee(employee);
    });

    mapRef.current.markers.push(marker);
  };

  // Get marker icon based on work location
  const getMarkerIcon = (workLocation) => {
    const iconMap = {
      'Work From Office': 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6">
          <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
      `),
      'Work From Home': 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10B981">
          <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
      `),
      'Field': 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B">
          <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
      `),
      'Client Side': 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#EF4444">
          <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
      `)
    };
    
    return iconMap[workLocation] || iconMap['Work From Office'];
  };

  // Create info window content
  const createInfoWindowContent = (employee) => {
    const lastUpdate = new Date(employee.lastUpdate).toLocaleString();
    const accuracyText = employee.accuracy ? `±${employee.accuracy}m` : 'Unknown';
    
    return `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
          ${employee.employeeName}
        </h3>
        <div style="color: #6b7280; font-size: 14px; line-height: 1.4;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${employee.email}</p>
          <p style="margin: 4px 0;"><strong>VTID:</strong> ${employee.vtid || 'N/A'}</p>
          <p style="margin: 4px 0;"><strong>Location:</strong> ${employee.workLocation}</p>
          <p style="margin: 4px 0;"><strong>Address:</strong> ${employee.address || 'Not available'}</p>
          <p style="margin: 4px 0;"><strong>Accuracy:</strong> ${accuracyText}</p>
          <p style="margin: 4px 0;"><strong>Last Update:</strong> ${lastUpdate}</p>
        </div>
      </div>
    `;
  };

  // Search for nearby employees
  const handleNearbySearch = async () => {
    if (!searchLocation.lat || !searchLocation.lng) {
      toast.warning('Please enter latitude and longitude');
      return;
    }

    try {
      const response = await findNearbyEmployees(
        parseFloat(searchLocation.lat),
        parseFloat(searchLocation.lng),
        parseFloat(searchLocation.radius)
      );
      
      setNearbyEmployees(response.data.employees || []);
      
      if (response.data.employees.length === 0) {
        toast.info(`No employees found within ${searchLocation.radius}km of the specified location`);
      } else {
        toast.success(`Found ${response.data.employees.length} employees nearby`);
      }
    } catch (error) {
      console.error('Nearby search error:', error);
      toast.error('Failed to search for nearby employees');
    }
  };

  // Get location type color
  const getLocationTypeColor = (workLocation) => {
    const colorMap = {
      'Work From Office': 'bg-blue-100 text-blue-800',
      'Work From Home': 'bg-green-100 text-green-800',
      'Field': 'bg-yellow-100 text-yellow-800',
      'Client Side': 'bg-red-100 text-red-800'
    };
    return colorMap[workLocation] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    if (isMapLoaded) {
      fetchEmployeeLocations();
    }
  }, [isMapLoaded]);

  if (!isMapLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <MapPinIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Location Tracking</h2>
            <p className="text-gray-600">Real-time location monitoring for all employees</p>
          </div>
        </div>
        <button
          onClick={fetchEmployeeLocations}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <MapPinIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Office</p>
              <p className="text-2xl font-semibold text-gray-900">
                {employees.filter(emp => emp.workLocation === 'Work From Office').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Field</p>
              <p className="text-2xl font-semibold text-gray-900">
                {employees.filter(emp => emp.workLocation === 'Field').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Last Hour</p>
              <p className="text-2xl font-semibold text-gray-900">
                {employees.filter(emp => {
                  const lastUpdate = new Date(emp.lastUpdate);
                  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                  return lastUpdate > oneHourAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Live Map</h3>
            </div>
            <div 
              ref={mapRef}
              className="h-96 w-full"
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>

        {/* Employee List & Search */}
        <div className="space-y-6">
          {/* Nearby Search */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Find Nearby Employees</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={searchLocation.lat}
                  onChange={(e) => setSearchLocation(prev => ({ ...prev, lat: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="51.5074"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={searchLocation.lng}
                  onChange={(e) => setSearchLocation(prev => ({ ...prev, lng: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="-0.1278"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Radius (km)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={searchLocation.radius}
                  onChange={(e) => setSearchLocation(prev => ({ ...prev, radius: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleNearbySearch}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Search
              </button>
            </div>
          </div>

          {/* Employee List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Employee Locations</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : employees.length === 0 ? (
                <div className="p-4 text-center">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No employee locations found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {employees.map((employee, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {employee.employeeName}
                          </h4>
                          <p className="text-xs text-gray-500">{employee.email}</p>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLocationTypeColor(employee.workLocation)}`}>
                              {employee.workLocation}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Last update: {new Date(employee.lastUpdate).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedEmployee(employee)}
                          className="ml-2 p-2 text-gray-400 hover:text-gray-600"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Map Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Work From Office</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Work From Home</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Field Work</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Client Side</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoMap;
