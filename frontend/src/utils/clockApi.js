import axios from 'axios';
import { buildApiUrl } from './apiConfig';

/**
 * Clock In/Out API Service
 * Handles all API calls related to time tracking and attendance
 */

const CLOCK_BASE = '/clock';

/**
 * Clock in an employee
 * @param {Object} clockData - Clock in data
 * @returns {Promise} API response
 */
export const clockIn = async (clockData) => {
  try {
    const response = await axios.post(
      buildApiUrl(`${CLOCK_BASE}/in`),
      clockData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to clock in' };
  }
};

/**
 * Clock out an employee
 * @param {Object} clockData - Clock out data
 * @returns {Promise} API response
 */
export const clockOut = async (clockData) => {
  try {
    const response = await axios.post(
      buildApiUrl(`${CLOCK_BASE}/out`),
      clockData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to clock out' };
  }
};

/**
 * Get current clock status for all employees
 * @returns {Promise} API response with clock status
 */
export const getClockStatus = async () => {
  try {
    const response = await axios.get(
      buildApiUrl(`${CLOCK_BASE}/status`),
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch clock status' };
  }
};

/**
 * Get time entries (history)
 * @param {String} startDate - Optional start date filter
 * @param {String} endDate - Optional end date filter
 * @param {String} employeeId - Optional employee filter
 * @returns {Promise} API response with time entries
 */
export const getTimeEntries = async (startDate = null, endDate = null, employeeId = null) => {
  try {
    let url = buildApiUrl(`${CLOCK_BASE}/entries`);
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (employeeId) params.append('employeeId', employeeId);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch time entries' };
  }
};

/**
 * Add manual time entry
 * @param {Object} entryData - Time entry data
 * @returns {Promise} API response
 */
export const addTimeEntry = async (entryData) => {
  try {
    const response = await axios.post(
      buildApiUrl(`${CLOCK_BASE}/entry`),
      entryData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to add time entry' };
  }
};

/**
 * Update time entry
 * @param {String} entryId - Time entry ID
 * @param {Object} updateData - Data to update
 * @returns {Promise} API response
 */
export const updateTimeEntry = async (entryId, updateData) => {
  try {
    const response = await axios.put(
      buildApiUrl(`${CLOCK_BASE}/entry/${entryId}`),
      updateData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update time entry' };
  }
};

/**
 * Delete time entry
 * @param {String} entryId - Time entry ID
 * @returns {Promise} API response
 */
export const deleteTimeEntry = async (entryId) => {
  try {
    const response = await axios.delete(
      buildApiUrl(`${CLOCK_BASE}/entry/${entryId}`),
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete time entry' };
  }
};

/**
 * Add break to time entry
 * @param {String} entryId - Time entry ID
 * @param {Object} breakData - Break data
 * @returns {Promise} API response
 */
export const addBreak = async (entryId, breakData) => {
  try {
    const response = await axios.post(
      buildApiUrl(`${CLOCK_BASE}/entry/${entryId}/break`),
      breakData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to add break' };
  }
};

/**
 * Export time entries to CSV
 * @param {String} startDate - Start date filter
 * @param {String} endDate - End date filter
 * @returns {Promise} CSV data
 */
export const exportTimeEntries = async (startDate, endDate) => {
  try {
    const response = await axios.get(
      buildApiUrl(`${CLOCK_BASE}/export?startDate=${startDate}&endDate=${endDate}`),
      { 
        withCredentials: true,
        responseType: 'blob'
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to export time entries' };
  }
};

// User-specific clock functions
export const getUserClockStatus = async () => {
  try {
    const response = await axios.get(
      buildApiUrl('/clock/user/status'),
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to get user clock status' };
  }
};

export const userClockIn = async (clockData) => {
  try {
    const response = await axios.post(
      buildApiUrl('/clock/user/in'),
      clockData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to clock in' };
  }
};

export const userClockOut = async () => {
  try {
    const response = await axios.post(
      buildApiUrl('/clock/user/out'),
      {},
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to clock out' };
  }
};

export const addUserBreak = async (breakData = {}) => {
  try {
    const response = await axios.post(
      buildApiUrl('/clock/user/break'),
      breakData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to add break' };
  }
};

export const getUserTimeEntries = async (startDate, endDate) => {
  try {
    let url = buildApiUrl('/clock/user/entries');
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user time entries' };
  }
};
