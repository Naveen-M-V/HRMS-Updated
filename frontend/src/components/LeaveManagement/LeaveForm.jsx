import React, { useState, useEffect } from 'react';
import { User, Calendar, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const LeaveForm = () => {
  const [formData, setFormData] = useState({
    manager: '',
    leaveType: 'Sick Leave',
    startDate: null,
    endDate: null,
    reason: ''
  });

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      const response = await axios.get('/api/employees?status=Active');
      if (response.data.success) {
        // Filter for specific roles: manager, HR, admin, super-admin
        // Exclude employees and profiles (interns, trainees, external staff)
        const approvers = response.data.data.filter(emp =>
          ['admin', 'hr', 'super-admin', 'manager'].includes(emp.role) &&
          emp.status === 'Active'
        );
        setManagers(approvers);
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
      toast.error('Failed to load approvers');
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
    if (!formData.startDate) newErrors.startDate = 'Please select a start date';
    if (!formData.endDate) newErrors.endDate = 'Please select an end date';
    if (!formData.reason || formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        newErrors.dateRange = 'Start date must be before end date';
      }
      if (start < new Date()) {
        newErrors.dateRange = 'Cannot request leave for past dates';
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
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        status: 'pending'
      };

      const response = await axios.post('/api/leave/requests', payload);

      if (response.data.success) {
        toast.success('Leave request submitted successfully');
        setFormData({
          manager: '',
          leaveType: 'Sick Leave',
          startDate: null,
          endDate: null,
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
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-4 w-4 text-gray-400" />
          </div>
          <Select
            value={formData.manager}
            onValueChange={(value) => handleChange('manager', value)}
          >
            <SelectTrigger className={`block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${errors.manager ? "border-red-500 ring-red-500" : ""}`}>
              <SelectValue placeholder="Select a manager" />
            </SelectTrigger>
            <SelectContent>
              {managers.map(manager => {
                const roleDisplay = manager.role === 'hr' ? 'HR' : 
                                  manager.role === 'super-admin' ? 'Super Admin' :
                                  manager.role.charAt(0).toUpperCase() + manager.role.slice(1);
                return (
                  <SelectItem key={manager._id} value={manager._id}>
                    {manager.firstName} {manager.lastName} — {roleDisplay}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        {errors.manager && (
          <p className="mt-1 text-sm text-red-600">{errors.manager}</p>
        )}
      </div>

      {/* Leave Type Dropdown */}
      <div>
        <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
          Leave Type *
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <Select
            value={formData.leaveType}
            onValueChange={(value) => handleChange('leaveType', value)}
          >
            <SelectTrigger className={`block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${errors.leaveType ? "border-red-500 ring-red-500" : ""}`}>
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
        </div>
        {errors.leaveType && (
          <p className="mt-1 text-sm text-red-600">{errors.leaveType}</p>
        )}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            value={formData.startDate || ''}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className={`block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.startDate || errors.dateRange ? "border-red-500 ring-red-500" : ""}`}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            End Date *
          </label>
          <input
            type="date"
            id="endDate"
            value={formData.endDate || ''}
            onChange={(e) => handleChange('endDate', e.target.value)}
            min={formData.startDate || ''}
            className={`block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.endDate || errors.dateRange ? "border-red-500 ring-red-500" : ""}`}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
          )}
        </div>
      </div>

      {errors.dateRange && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{errors.dateRange}</p>
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
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </form>
  );
};

export default LeaveForm;
