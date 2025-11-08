import axios from 'axios';
import { buildApiUrl } from './apiConfig';

const ROTA_BASE = '/rota';

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

export const assignShift = async (data) => {
  try {
    const response = await axios.post(
      buildApiUrl(`${ROTA_BASE}/shift-assignments`),
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to assign shift' };
  }
};

export const bulkCreateShifts = async (shifts) => {
  try {
    const response = await axios.post(
      buildApiUrl(`${ROTA_BASE}/shift-assignments/bulk`),
      { shifts },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to bulk create shifts' };
  }
};

export const getAllShiftAssignments = async (filters = {}) => {
  try {
    let url = buildApiUrl(`${ROTA_BASE}/shift-assignments/all`);
    
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    // Only add location and workType if they're not 'all'
    if (filters.location && filters.location !== 'all') params.append('location', filters.location);
    if (filters.workType && filters.workType !== 'all') params.append('workType', filters.workType);
    if (filters.status) params.append('status', filters.status);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch shift assignments' };
  }
};

export const getEmployeeShifts = async (employeeId, startDate = null, endDate = null) => {
  try {
    let url = buildApiUrl(`${ROTA_BASE}/shift-assignments/employee/${employeeId}`);
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch employee shifts' };
  }
};

export const getShiftsByLocation = async (location, startDate = null, endDate = null) => {
  try {
    let url = buildApiUrl(`${ROTA_BASE}/shift-assignments/location/${location}`);
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch shifts by location' };
  }
};

export const getShiftStatistics = async (startDate = null, endDate = null) => {
  try {
    let url = buildApiUrl(`${ROTA_BASE}/shift-assignments/statistics`);
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch shift statistics' };
  }
};

export const updateShiftAssignment = async (shiftId, updateData) => {
  try {
    const response = await axios.put(
      buildApiUrl(`${ROTA_BASE}/shift-assignments/${shiftId}`),
      updateData,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update shift' };
  }
};

export const deleteShiftAssignment = async (shiftId) => {
  try {
    const response = await axios.delete(
      buildApiUrl(`${ROTA_BASE}/shift-assignments/${shiftId}`),
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete shift' };
  }
};

export const requestShiftSwap = async (shiftId, swapWithEmployeeId, reason) => {
  try {
    const response = await axios.post(
      buildApiUrl(`${ROTA_BASE}/shift-assignments/${shiftId}/swap-request`),
      { shiftId, swapWithEmployeeId, reason },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to request shift swap' };
  }
};

export const approveShiftSwap = async (shiftId, status) => {
  try {
    const response = await axios.post(
      buildApiUrl(`${ROTA_BASE}/shift-assignments/${shiftId}/swap-approve`),
      { status },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to approve shift swap' };
  }
};

export const detectConflicts = async (employeeId, startTime, endTime, date) => {
  try {
    const response = await axios.post(
      buildApiUrl(`${ROTA_BASE}/shift-assignments/detect-conflicts`),
      { employeeId, startTime, endTime, date },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to detect conflicts' };
  }
};
