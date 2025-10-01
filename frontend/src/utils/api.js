// API utility to ensure all fetch calls include credentials
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

/**
 * Wrapper for fetch() that automatically includes credentials
 * @param {string} url - API endpoint (relative or absolute)
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export const fetchWithCredentials = async (url, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  return fetch(fullUrl, {
    ...options,
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};

/**
 * Helper for GET requests
 */
export const get = async (url, options = {}) => {
  return fetchWithCredentials(url, {
    method: 'GET',
    ...options
  });
};

/**
 * Helper for POST requests
 */
export const post = async (url, data, options = {}) => {
  return fetchWithCredentials(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
};

/**
 * Helper for PUT requests
 */
export const put = async (url, data, options = {}) => {
  return fetchWithCredentials(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options
  });
};

/**
 * Helper for DELETE requests
 */
export const del = async (url, options = {}) => {
  return fetchWithCredentials(url, {
    method: 'DELETE',
    ...options
  });
};

/**
 * Helper for FormData uploads (multipart/form-data)
 */
export const uploadFile = async (url, formData, options = {}) => {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  return fetch(fullUrl, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    ...options,
    // Don't set Content-Type - browser will set it with boundary
    headers: {
      ...options.headers
    }
  });
};

export default {
  fetchWithCredentials,
  get,
  post,
  put,
  del,
  uploadFile
};
