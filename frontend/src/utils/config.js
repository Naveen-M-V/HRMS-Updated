// API Configuration utility
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Remove '/api' from base URL to get server URL for file uploads
export const SERVER_BASE_URL = API_BASE_URL;
// export const SERVER_BASE_URL = API_BASE_URL.replace('/api', '');
// Helper function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  return `${SERVER_BASE_URL}${imagePath}`;
};
