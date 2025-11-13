import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPinIcon, 
  UserGroupIcon, 
  RefreshIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

/**
 * EnhancedTouristMap - Tourist-style map with search, maximize/minimize, and location chooser
 */
const EnhancedTouristMap = ({
  height = '600px',
  style = 'light',
  autoRefresh = true,
  refreshInterval = 30000,
  onEmployeeClick = null,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lng: -0.1278 }); // London
  const [mapZoom, setMapZoom] = useState(12);
  
  // New tourist map features
  const [isMaximized, setIsMaximized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Rome, Italy');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Predefined locations for the dropdown
  const predefinedLocations = [
    'Rome, Italy',
    'London, UK', 
    'Paris, France',
    'New York, USA',
    'Tokyo, Japan',
    'Sydney, Australia',
    'Berlin, Germany',
    'Barcelona, Spain',
    'Amsterdam, Netherlands',
    'Dubai, UAE'
  ];

  // Mock search locations
  const mockSearchLocations = [
    'Colosseum, Rome',
    'Vatican City, Rome', 
    'Trevi Fountain, Rome',
    'Spanish Steps, Rome',
    'Pantheon, Rome',
    'Roman Forum, Rome',
    'Piazza Navona, Rome',
    'Castel Sant\'Angelo, Rome'
  ];

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;

    setLoading(false);
    fetchEmployeeLocations();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Setup auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchEmployeeLocations();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval]);

  // Fetch employee locations
  const fetchEmployeeLocations = async () => {
    try {
      // Mock data for demonstration (replace with your API)
      const mockEmployees = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          department: 'Engineering',
          status: 'active',
          location: {
            latitude: 51.5074,
            longitude: -0.1278,
            accuracy: 10,
            timestamp: new Date().toISOString()
          },
          clockStatus: 'clocked-in'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          department: 'Design',
          status: 'on-break',
          location: {
            latitude: 51.5154,
            longitude: -0.1425,
            accuracy: 15,
            timestamp: new Date().toISOString()
          },
          clockStatus: 'on-break'
        },
        {
          id: '3',
          name: 'Mike Johnson',
          email: 'mike@example.com',
          department: 'Marketing',
          status: 'active',
          location: {
            latitude: 51.5020,
            longitude: -0.1200,
            accuracy: 8,
            timestamp: new Date().toISOString()
          },
          clockStatus: 'clocked-in'
        }
      ];

      setEmployees(mockEmployees);
      setLastUpdate(new Date());
      
      if (canvasRef.current) {
        drawMap();
      }
    } catch (err) {
      console.error('Failed to fetch employee locations:', err);
      setError('Failed to fetch employee locations');
    }
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const results = mockSearchLocations.filter(location => 
        location.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
    // Here you would typically update the map center based on the selected location
  };

  // Handle search result selection
  const handleSearchResultSelect = (result) => {
    setSearchQuery(result);
    setShowSearchResults(false);
    // Here you would typically center the map on the selected search result
  };

  // Toggle maximize/minimize
  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Draw the map (same as before)
  const drawMap = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background with tourist map style
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#e8f4f8');
    gradient.addColorStop(1, '#f0f8ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw map grid
    drawMapGrid(ctx, width, height);

    // Draw map features
    drawMapFeatures(ctx, width, height);

    // Filter and draw employees
    const filteredEmployees = employees.filter(emp => {
      if (filterStatus === 'all') return true;
      return emp.status === filterStatus;
    });

    filteredEmployees.forEach((employee, index) => {
      if (employee.location) {
        drawEmployeeMarker(ctx, employee, width, height, index);
      }
    });

    // Draw legend
    drawLegend(ctx, width, height, filteredEmployees);
  };

  // Draw map grid
  const drawMapGrid = (ctx, width, height) => {
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 0.5;

    const gridSize = 50;
    
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Draw map features with tourist style
  const drawMapFeatures = (ctx, width, height) => {
    // Draw water bodies
    ctx.fillStyle = '#3b82f6';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(width * 0.1, height * 0.6, width * 0.3, height * 0.15);
    ctx.fillRect(width * 0.6, height * 0.2, width * 0.25, height * 0.2);
    ctx.globalAlpha = 1;

    // Draw parks/green areas
    ctx.fillStyle = '#10b981';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(width * 0.05, height * 0.1, width * 0.2, height * 0.25);
    ctx.fillRect(width * 0.7, height * 0.5, width * 0.25, height * 0.3);
    ctx.globalAlpha = 1;

    // Draw roads
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Main roads
    ctx.beginPath();
    ctx.moveTo(0, height * 0.3);
    ctx.lineTo(width, height * 0.3);
    ctx.moveTo(0, height * 0.7);
    ctx.lineTo(width, height * 0.7);
    ctx.moveTo(width * 0.25, 0);
    ctx.lineTo(width * 0.25, height);
    ctx.moveTo(width * 0.75, 0);
    ctx.lineTo(width * 0.75, height);
    ctx.stroke();

    // Draw buildings with tourist style
    ctx.fillStyle = '#6b7280';
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    const buildings = [
      { x: width * 0.15, y: height * 0.4, w: width * 0.08, h: height * 0.15 },
      { x: width * 0.35, y: height * 0.05, w: width * 0.12, h: height * 0.2 },
      { x: width * 0.55, y: height * 0.45, w: width * 0.1, h: height * 0.15 },
      { x: width * 0.8, y: height * 0.08, w: width * 0.15, h: height * 0.18 },
    ];

    buildings.forEach(building => {
      ctx.fillRect(building.x, building.y, building.w, building.h);
      ctx.strokeRect(building.x, building.y, building.w, building.h);
    });

    // Draw tourist attractions (monuments)
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2;
    
    // Monument markers
    const monuments = [
      { x: width * 0.4, y: height * 0.3 },
      { x: width * 0.6, y: height * 0.6 },
      { x: width * 0.2, y: height * 0.5 }
    ];

    monuments.forEach(monument => {
      // Draw monument base
      ctx.fillRect(monument.x - 8, monument.y - 8, 16, 16);
      ctx.strokeRect(monument.x - 8, monument.y - 8, 16, 16);
      
      // Draw monument top
      ctx.beginPath();
      ctx.moveTo(monument.x, monument.y - 20);
      ctx.lineTo(monument.x - 6, monument.y - 8);
      ctx.lineTo(monument.x + 6, monument.y - 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  };

  // Draw employee marker (same as before)
  const drawEmployeeMarker = (ctx, employee, width, height, index) => {
    const x = (width * 0.3) + (index * width * 0.15) + Math.random() * width * 0.1;
    const y = (height * 0.4) + (index * height * 0.1) + Math.random() * height * 0.2;

    const statusColor = getStatusColor(employee.status);
    
    // Draw marker shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, 18, 0, 2 * Math.PI);
    ctx.fill();

    // Draw marker background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, 2 * Math.PI);
    ctx.fill();

    // Draw marker color
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    ctx.fill();

    // Draw initials
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = employee.name.split(' ').map(n => n[0]).join('').toUpperCase();
    ctx.fillText(initials, x, y);

    // Draw pulse effect for active employees
    if (employee.status === 'active') {
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    employee._markerPos = { x, y, radius: 16 };
  };

  // Draw legend (same as before)
  const drawLegend = (ctx, width, height, employees) => {
    const legendX = 20;
    const legendY = height - 120;
    const legendWidth = 200;
    const legendHeight = 100;

    // Legend background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    // Legend title
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Employee Status', legendX + 10, legendY + 20);

    // Status counts
    const statusCounts = {
      active: employees.filter(e => e.status === 'active').length,
      'on-break': employees.filter(e => e.status === 'on-break').length,
      offline: employees.filter(e => e.status === 'offline').length
    };

    let yOffset = 35;
    Object.entries(statusCounts).forEach(([status, count]) => {
      // Status dot
      ctx.fillStyle = getStatusColor(status);
      ctx.beginPath();
      ctx.arc(legendX + 20, legendY + yOffset, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Status text
      ctx.fillStyle = '#333333';
      ctx.font = '11px Arial';
      ctx.fillText(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`, legendX + 35, legendY + yOffset + 4);
      
      yOffset += 20;
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'on-break': return '#f59e0b';
      case 'offline': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  // Handle canvas click
  const handleCanvasClick = (event) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedEmployee = employees.find(emp => {
      if (!emp._markerPos) return false;
      const distance = Math.sqrt(
        Math.pow(x - emp._markerPos.x, 2) + Math.pow(y - emp._markerPos.y, 2)
      );
      return distance <= emp._markerPos.radius;
    });

    if (clickedEmployee) {
      setSelectedEmployee(clickedEmployee);
      if (onEmployeeClick) {
        onEmployeeClick(clickedEmployee);
      }
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        drawMap();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [employees, filterStatus, style]);

  // Redraw when dependencies change
  useEffect(() => {
    if (canvasRef.current && employees.length > 0) {
      drawMap();
    }
  }, [employees, filterStatus, style, mapZoom]);

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`} style={{ height }}>
        <div className="text-center text-red-600">
          <MapPinIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Map Error</h3>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={fetchEmployeeLocations}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredEmployees = employees.filter(emp => {
    if (filterStatus === 'all') return true;
    return emp.status === filterStatus;
  });

  const mapHeight = isMaximized ? '90vh' : height;

  return (
    <div className={`relative ${className} ${isMaximized ? 'fixed inset-4 z-50 bg-white rounded-lg shadow-2xl' : ''}`}>
      {/* Tourist Map Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Tourist Map</h1>
            <div className="text-sm opacity-90">
              {filteredEmployees.length} employees • {selectedLocation}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMaximize}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              title={isMaximized ? "Minimize" : "Maximize"}
            >
              {isMaximized ? (
                <ArrowsPointingInIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              )}
            </button>
            
            {isMaximized && (
              <button
                onClick={() => setIsMaximized(false)}
                className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Location Chooser */}
          <div className="relative">
            <button
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border border-gray-300 transition-colors min-w-[200px] justify-between"
            >
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Chosen Location: {selectedLocation}</span>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-gray-600 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showLocationDropdown && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {predefinedLocations.map((location) => (
                  <button
                    key={location}
                    onClick={() => handleLocationSelect(location)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
                  >
                    {location}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search or Choose Map..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchResultSelect(result)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-gray-400" />
                      {result}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on-break">On Break</option>
            <option value="offline">Offline</option>
          </select>
          
          {/* Refresh Button */}
          <button
            onClick={fetchEmployeeLocations}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshIcon className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div 
          className="bg-gray-50 border border-gray-200 flex items-center justify-center"
          style={{ height: mapHeight }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tourist map...</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      {!loading && (
        <div 
          ref={containerRef}
          className="w-full overflow-hidden"
          style={{ height: mapHeight }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-pointer"
            style={{ display: 'block' }}
          />
        </div>
      )}

      {/* Selected Employee Info */}
      {selectedEmployee && (
        <div className="bg-blue-50 border-t border-blue-200 p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Selected Employee</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Name:</span> {selectedEmployee.name}
            </div>
            <div>
              <span className="font-medium">Department:</span> {selectedEmployee.department}
            </div>
            <div>
              <span className="font-medium">Status:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                selectedEmployee.status === 'active' ? 'bg-green-100 text-green-800' :
                selectedEmployee.status === 'on-break' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedEmployee.status.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="font-medium">Clock Status:</span> {selectedEmployee.clockStatus}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTouristMap;
