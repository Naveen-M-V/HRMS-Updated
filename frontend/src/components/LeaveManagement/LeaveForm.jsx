import React, { useState, useEffect } from 'react';
import { User, Calendar, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const LeaveForm = ({ selectedDates }) => {
  const [formData, setFormData] = useState({
    manager: '',
    leaveType: '',
    reason: ''
  });

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [managersLoading, setManagersLoading] = useState(true);

  const leaveTypes = [
    'Sick Leave',
    'Casual Leave', 
    'Paid Leave',
    'Unpaid Leave',
    'Maternity Leave',
    'Paternity Leave',
    'Bereavement Leave'
  ];

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      setManagersLoading(true);
      // Fetch admin and super-admin users from User collection
      const response = await axios.get('/api/auth/approvers');
      console.log('API Response:', response.data); // Debug log
      if (response.data.success) {
        console.log('Fetched approvers:', response.data.data); // Debug log
        setManagers(response.data.data);
        if (response.data.data.length === 0) {
          console.warn('⚠️ No approvers found. Ensure admin/super-admin users exist and are approved.');
          toast.warning('No approvers available. Please contact your administrator.');
        }
      } else {
        console.error('Failed to fetch approvers:', response.data);
        toast.error(response.data.message || 'Failed to load approvers');
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to load approvers');
    } finally {
      setManagersLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.manager) newErrors.manager = 'Please select an approver';
    if (!formData.leaveType) newErrors.leaveType = 'Please select a leave type';
    if (!selectedDates.start) newErrors.dates = 'Please select start date from calendar';
    if (!selectedDates.end) newErrors.dates = 'Please select end date from calendar';
    if (!formData.reason || formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    if (selectedDates.start && selectedDates.end) {
      const start = new Date(selectedDates.start);
      const end = new Date(selectedDates.end);
      if (start > end) {
        newErrors.dates = 'Start date must be before end date';
      }
      if (start < new Date()) {
        newErrors.dates = 'Cannot request leave for past dates';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      // Get current user from localStorage or auth context
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const payload = {
        employeeId: currentUser._id || currentUser.id, // Logged-in employee
        approverId: formData.manager,
        leaveType: formData.leaveType,
        startDate: selectedDates.start,
        endDate: selectedDates.end,
        reason: formData.reason,
        status: 'pending'
      };

      const response = await axios.post('/api/leave/requests', payload);

      if (response.data.success) {
        toast.success('Leave request submitted successfully');
        setFormData({
          manager: '',
          leaveType: '',
          reason: ''
        });
        setErrors({});
      } else {
        toast.error(response.data.message || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      const errorMsg = error.response?.data?.message || 'Failed to submit leave request';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Manager Dropdown */}
      <div>
        <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1">
          Approval Manager *
        </label>
        <Select
          value={formData.manager}
          onValueChange={(value) => handleChange('manager', value)}
        >
          <SelectTrigger className={`w-full ${errors.manager ? "border-red-500 ring-red-500" : ""}`}>
            <SelectValue placeholder={managersLoading ? "Loading managers..." : "Select a manager"} />
          </SelectTrigger>
          <SelectContent>
            {managersLoading ? (
              <div className="p-2 text-sm text-gray-500">Loading approvers...</div>
            ) : managers.length === 0 ? (
              <div className="p-2 text-sm text-gray-500">No approvers available</div>
            ) : (
              managers.map(manager => {
                const roleDisplay = manager.role === 'super-admin' ? 'Super Admin' :
                                  manager.role === 'admin' ? 'Admin' :
                                  manager.role.charAt(0).toUpperCase() + manager.role.slice(1);
                
                // Handle cases where firstName/lastName might be empty
                const displayName = manager.firstName && manager.lastName 
                  ? `${manager.firstName} ${manager.lastName}`
                  : manager.firstName || manager.lastName || manager.email;
                
                return (
                  <SelectItem key={manager._id} value={manager._id}>
                    {displayName} — {roleDisplay}
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
        {errors.manager && (
          <p className="mt-1 text-sm text-red-600">{errors.manager}</p>
        )}
        {managers.length === 0 && !managersLoading && (
          <p className="mt-1 text-sm text-gray-500">No approvers available. Contact your administrator.</p>
        )}
      </div>

      {/* Leave Type Dropdown */}
      <div>
        <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
          Leave Type *
        </label>
        <Select
          value={formData.leaveType}
          onValueChange={(value) => handleChange('leaveType', value)}
        >
          <SelectTrigger className={`w-full ${errors.leaveType ? "border-red-500 ring-red-500" : ""}`}>
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent>
            {leaveTypes.map((type, index) => (
              <SelectItem key={index} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.leaveType && (
          <p className="mt-1 text-sm text-red-600">{errors.leaveType}</p>
        )}
      </div>

      {/* Date Validation Error */}
      {errors.dates && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{errors.dates}</p>
        </div>
      )}

      {/* Reason Textarea */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
          Reason for leave *
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute top-3 left-3">
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </div>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            value={formData.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            placeholder="Please provide a detailed reason for your leave request (minimum 10 characters)"
            className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.reason ? "border-red-500 ring-red-500" : ""}`}
          />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">
            {formData.reason.length} / 500 characters
          </p>
          {errors.reason && (
            <p className="text-sm text-red-600">{errors.reason}</p>
          )}
        </div>
      </div>

      {/* Send Request Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !formData.manager || !selectedDates.start || !selectedDates.end}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </form>
  );
};

export default LeaveForm;
