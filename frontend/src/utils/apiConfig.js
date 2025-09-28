export const getApiUrl = () => {
  // Use production API URL from environment variables
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const apiUrl = process.env.REACT_APP_API_URL;
  
  // Prefer API_BASE_URL if it includes /api path, otherwise use API_URL
  if (apiBaseUrl) {
    return apiBaseUrl.replace(/\/$/, ""); // Remove trailing slash
  }
  
  if (apiUrl) {
    return apiUrl.replace(/\/$/, ""); // Remove trailing slash
  }
  
  // Fallback for local development
  return "http://localhost:5000";
};