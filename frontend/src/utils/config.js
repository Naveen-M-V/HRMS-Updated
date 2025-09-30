// API Configuration utility
// Normalized API base (no trailing '/api' or trailing slash)
const normalizeBase = (url) => {
  if (!url) return url;
  let normalized = url.replace(/\/+$/, '');
  normalized = normalized.replace(/\/api$/i, '');
  return normalized;
};

export const API_BASE_URL = normalizeBase(process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'https://talentshield.co.uk/api');

// Derive server base (remove any '/api' segment)
export const SERVER_BASE_URL = normalizeBase(process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'https://talentshield.co.uk');

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
