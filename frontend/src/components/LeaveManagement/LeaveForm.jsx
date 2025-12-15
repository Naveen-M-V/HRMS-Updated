import React, { useState } from 'react';
import { User, Calendar, MessageSquare } from 'lucide-react';

const LeaveForm = () => {
  const [formData, setFormData] = useState({
    manager: 'Jack Jensen',
    leaveType: 'Sick Leave',
    reason: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const managers = [
    { id: 1, name: 'Jack Jensen' },
    { id: 2, name: 'Sarah Wilson' },
    { id: 3, name: 'Michael Brown' },
  ];

  const leaveTypes = [
    'Sick Leave',
    'Casual Leave',
    'Paid Leave',
    'Maternity/Paternity Leave',
    'Bereavement Leave'
  ];

  return (
    <div className="space-y-4">
      {/* Manager Dropdown */}
      <div>
        <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1">
          Approval Manager
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-4 w-4 text-gray-400" />
          </div>
          <select
            id="manager"
            name="manager"
            value={formData.manager}
            onChange={handleChange}
            className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {managers.map(manager => (
              <option key={manager.id} value={manager.name}>
                {manager.name}
              </option>
            ))}
          </select>
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
          <select
            id="leaveType"
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
            className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            {leaveTypes.map((type, index) => (
              <option key={index} value={type}>
                {type}
              </option>
            ))}
          </select>
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
            onChange={handleChange}
            placeholder="Type your reason"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default LeaveForm;
