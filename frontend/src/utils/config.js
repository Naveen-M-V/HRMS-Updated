// API Configuration utility
const getApiUrl = () => {
  // In development, use localhost URL
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // In production or when API_BASE_URL is relative, use relative path
  if (process.env.REACT_APP_API_BASE_URL?.startsWith('/')) {
    return '';
  }
  // Fallback to localhost for development, production URL for production
  return process.env.REACT_APP_API_URL || 'https://talentshield.co.uk';
};

export const API_BASE_URL = `${getApiUrl()}/api`;

// Remove '/api' from base URL to get server URL for file uploads
export const SERVER_BASE_URL = getApiUrl();

// Helper function to get full image URL (works for PDFs and other files too)
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If the path already starts with http/https, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If the path starts with /uploads, use it directly
  if (imagePath.startsWith('/uploads/')) {
    return `${SERVER_BASE_URL}${imagePath}`;
  }
  
  // If the path doesn't start with /, add /uploads/ prefix
  if (!imagePath.startsWith('/')) {
    return `${SERVER_BASE_URL}/uploads/${imagePath}`;
  }
  
  // Default case - use the path as provided
  return `${SERVER_BASE_URL}${imagePath}`;
};
