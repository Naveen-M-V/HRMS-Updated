// API Configuration utility - SAFE version that prevents TDZ errors
// Initialize with fallback values that don't require window
let _apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 
                  process.env.REACT_APP_API_URL || 
                  'https://talentshield.co.uk/api';

let _serverBaseUrl = process.env.REACT_APP_SERVER_BASE_URL || 
                     (process.env.REACT_APP_API_BASE_URL?.replace('/api', '')) || 
                     (process.env.REACT_APP_API_URL?.replace('/api', '')) || 
                     'https://talentshield.co.uk';

let _initialized = false;

// Safe initialization that checks window after module load
const safeInit = () => {
  if (_initialized) return;
  
  try {
    // Only access window if it exists and is fully initialized
    if (typeof window !== 'undefined' && window.location) {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      
      const isDev = process.env.NODE_ENV === 'development';
      
      if (isDev || isLocalhost) {
        _apiBaseUrl = 'http://localhost:5003/api';
        _serverBaseUrl = 'http://localhost:5003';
      }
    }
    _initialized = true;
  } catch (error) {
    // If anything fails, keep the fallback values
    console.warn('Config initialization warning:', error.message);
    _initialized = true;
  }
};

// Initialize on next tick to avoid TDZ issues
if (typeof window !== 'undefined') {
  // Use setTimeout to defer until after module loading
  setTimeout(safeInit, 0);
}

// Getter functions
export const getApiBaseUrl = () => {
  if (!_initialized) safeInit();
  return _apiBaseUrl;
};

export const getServerBaseUrl = () => {
  if (!_initialized) safeInit();
  return _serverBaseUrl;
};

// Export constants - these will use fallback values initially,
// then update after safeInit runs
export const API_BASE_URL = _apiBaseUrl;
export const SERVER_BASE_URL = _serverBaseUrl;

// Helper function to get full image URL (works for PDFs and other files too)
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If the path already starts with http/https, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If the path starts with /uploads, use it directly
  if (imagePath.startsWith('/uploads/')) {
    return `${getServerBaseUrl()}${imagePath}`;
  }
  
  // If the path doesn't start with /, add /uploads/ prefix
  if (!imagePath.startsWith('/')) {
    return `${getServerBaseUrl()}/uploads/${imagePath}`;
  }
  
  // Default case - use the path as provided
  return `${getServerBaseUrl()}${imagePath}`;
};
