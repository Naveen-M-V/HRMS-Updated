import React, { useState, useEffect } from 'react';
import { User, Calendar, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const LeaveForm = () => {
  const [formData, setFormData] = useState({
    manager: '',
    leaveType: 'Sick Leave',
    reason: ''
  });

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);

  const leaveTypes = [
    'Sick Leave',
    'Casual Leave',
    'Paid Leave',
    'Maternity/Paternity Leave',
    'Bereavement Leave'
  ];

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const response = await axios.get('/api/employees?status=Active');
      if (response.data.success) {
        const activeManagers = response.data.data.filter(emp =>
          ['admin', 'hr', 'super-admin', 'manager'].includes(emp.role)
        );
        setManagers(activeManagers);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('Failed to load managers');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.manager) {
      toast.error('Please select an approval manager');
      return false;
    }
    if (!formData.leaveType) {
      toast.error('Please select a leave type');
      return false;
    }
    if (!formData.reason || formData.reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        approverId: formData.manager,
        leaveType: formData.leaveType,
        startDate: new Date().toISOString().split('T')[0], // Today's date as placeholder
        endDate: new Date().toISOString().split('T')[0], // Today's date as placeholder
        reason: formData.reason,
        status: 'Pending'
      };

      const response = await axios.post('/api/leave-requests', payload);

      if (response.data.success) {
        toast.success('Leave request submitted successfully');
        setFormData({
          manager: '',
          leaveType: 'Sick Leave',
          reason: ''
        });
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
          Approval Manager
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-4 w-4 text-gray-400" />
          </div>
          <Select
            value={formData.manager}
            onValueChange={(value) => handleChange('manager', value)}
          >
            <SelectTrigger className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
              <SelectValue placeholder="Select a manager" />
            </SelectTrigger>
            <SelectContent>
              {managers.map(manager => (
                <SelectItem key={manager._id} value={manager._id}>
                  {manager.firstName} {manager.lastName} — {manager.role.charAt(0).toUpperCase() + manager.role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leave Type Dropdown */}
      <div>
        <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
          Leave Type
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <Select
            value={formData.leaveType}
            onValueChange={(value) => handleChange('leaveType', value)}
          >
            <SelectTrigger className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
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
      </div>

      {/* Reason Textarea */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
          Reason for leave
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
            placeholder="Type your reason"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
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
