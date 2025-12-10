import React, { useState } from 'react';
import ManagerCard from './ManagerCard';

// Sample manager data
const sampleManagers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "HR Manager",
    initials: "SJ"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Learning & Development Lead",
    initials: "MC"
  },
  {
    id: 3,
    name: "Emma Williams",
    role: "Department Head",
    initials: "EW"
  }
];

const PermissionsPage = () => {
  const [managers, setManagers] = useState(sampleManagers);

  const handleAddManager = () => {
    // Handle adding new manager
    console.log('Add new manager');
  };

  const handleRemoveManager = (managerId) => {
    setManagers(managers.filter(m => m.id !== managerId));
  };

  return (
    <div className="px-6 py-6">
      {/* Page Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Learning managers</h2>

      {/* Description Text */}
      <div className="text-gray-600 mb-8 space-y-2">
        <p>
          Learning managers can assign courses to employees and track their progress through the E-Learning platform.
        </p>
        <p>
          They have access to reporting features and can manage course completion records for their assigned teams.
        </p>
      </div>

      {/* Add Manager Button */}
      <button 
        onClick={handleAddManager}
        className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 mb-8"
      >
        Add learning manager
      </button>

      {/* Managers List */}
      <div className="space-y-4">
        {managers.map((manager) => (
          <ManagerCard 
            key={manager.id} 
            manager={manager} 
            onRemove={() => handleRemoveManager(manager.id)} 
          />
        ))}
      </div>

      {/* Empty State */}
      {managers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No learning managers assigned yet.</p>
          <button 
            onClick={handleAddManager}
            className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Add learning manager
          </button>
        </div>
      )}
    </div>
  );
};

export default PermissionsPage;
