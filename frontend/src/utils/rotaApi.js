import axios from 'axios';
import { buildApiUrl } from './apiConfig';

/**
 * Rota API Service
 * Handles all API calls related to rota/shift management
 */

const ROTA_BASE = '/rota';

/**
 * Generate rota for a date range
 * @param {String} startDate - Start date (YYYY-MM-DD)
 * @param {String} endDate - End date (YYYY-MM-DD)
 * @returns {Promise} API response
 */
export const generateRota = async (startDate, endDate) => {
  try {
    const response = await axios.post(
      buildApiUrl(`${ROTA_BASE}/generate`),
      { startDate, endDate },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to generate rota' };
  }
};

/**
 * Get all rota entries (Admin view)
 * @param {String} startDate - Optional start date filter
 * @param {String} endDate - Optional end date filter
 * @returns {Promise} API response with rota data
 */
export const getAllRota = async (startDate = null, endDate = null) => {
  try {
    let url = buildApiUrl(ROTA_BASE);
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch rota' };
  }
};

/**
 * Get specific employee's rota
 * @param {String} employeeId - Employee ID
 * @param {String} startDate - Optional start date filter
 * @param {String} endDate - Optional end date filter
 * @returns {Promise} API response with employee rota
 */
export const getEmployeeRota = async (employeeId, startDate = null, endDate = null) => {
  try {
    let url = buildApiUrl(`${ROTA_BASE}/${employeeId}`);
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch employee rota' };
  }
};

/**
 * Update a rota entry
 * @param {String} rotaId - Rota entry ID
 * @param {Object} updateData - Data to update (shift, status, notes)
 * @returns {Promise} API response
 */
export const updateRota = async (rotaId, updateData) => {
  try {
    const response = await axios.put(
      buildApiUrl(`${ROTA_BASE}/${rotaId}`),
      updateData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update rota' };
  }
};

/**
 * Delete a rota entry
 * @param {String} rotaId - Rota entry ID
 * @returns {Promise} API response
 */
export const deleteRota = async (rotaId) => {
  try {
    const response = await axios.delete(
      buildApiUrl(`${ROTA_BASE}/${rotaId}`),
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete rota' };
  }
};

/**
 * Initialize default shifts
 * @returns {Promise} API response
 */
export const initializeShifts = async () => {
  try {
    const response = await axios.post(
      buildApiUrl(`${ROTA_BASE}/init-shifts`),
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to initialize shifts' };
  }
};
