import axios from 'axios';

// Configure axios to include credentials (cookies) with requests
axios.defaults.withCredentials = true;

// Add request interceptor to include Authorization header
axios.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    
    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.error('Authentication failed - clearing session');
      
      // Clear auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_session');
      
      // Optionally redirect to login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axios;
