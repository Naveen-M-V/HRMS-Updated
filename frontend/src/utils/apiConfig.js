/**
 * API Configuration Utility
 * Handles API URL construction to avoid duplicate /api paths
 */

/**
 * Get the base API URL without /api suffix
 * @returns {string} Base URL (e.g., 'https://talentshield.co.uk' or 'http://localhost:5003')
 */
export const getApiBaseUrl = () => {
  let baseUrl = process.env.REACT_APP_API_BASE_URL || 
                process.env.REACT_APP_API_URL || 
                'http://localhost:5003';
  
  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');
  
  // Remove /api suffix if present (we'll add it in buildApiUrl)
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  }
  
  return baseUrl;
};

/**
 * Build full API URL with path
 * @param {string} path - API path (e.g., '/Certificates' or 'Certificates')
 * @returns {string} Full API URL (e.g., 'https://talentshield.co.uk/api/Certificates')
 */
export const buildApiUrl = (path) => {
  const baseUrl = getApiBaseUrl();
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Build: baseUrl + /api + path
  return `${baseUrl}/api${cleanPath}`;
};

/**
 * Build API URL without /api prefix (for special endpoints)
 * @param {string} path - Path (e.g., '/health')
 * @returns {string} Full URL without /api
 */
export const buildDirectUrl = (path) => {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Get image URL for Profile pictures
 * @param {string} imagePath - Image path from profile.profilePicture
 * @returns {string} Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  const baseUrl = getApiBaseUrl();
  
  // Remove leading slash from imagePath if present
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  return `${baseUrl}/${cleanPath}`;
};

// Export default object with all utilities
export default {
  getApiBaseUrl,
  buildApiUrl,
  buildDirectUrl,
  getImageUrl
};
