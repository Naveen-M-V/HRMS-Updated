import React, { useState, useEffect } from 'react';

const MultiJobRoleSelector = ({ value = [], onChange, name = "jobRole" }) => {
  const [jobRoles, setJobRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);

  const getApiUrl = () => {
    if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  useEffect(() => {
    fetchJobRoles();
  }, []);

  useEffect(() => {
    // Handle both array and string values
    if (Array.isArray(value)) {
      setSelectedRoles(value);
    } else if (typeof value === 'string' && value) {
      const roles = value.split(',').map(r => r.trim()).filter(Boolean);
      setSelectedRoles(roles);
    } else {
      setSelectedRoles([]);
    }
  }, [value]);

  const fetchJobRoles = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/job-roles`);
      if (response.ok) {
        const data = await response.json();
        setJobRoles(data);
      }
    } catch (error) {
      console.error('Error fetching job roles:', error);
    }
  };

  const handleToggleRole = (roleName) => {
    const isSelected = selectedRoles.includes(roleName);
    let updatedRoles;
    
    if (isSelected) {
      updatedRoles = selectedRoles.filter(r => r !== roleName);
    } else {
      updatedRoles = [...selectedRoles, roleName];
    }
    
    setSelectedRoles(updatedRoles);
    
    if (onChange) {
      onChange({
        target: {
          name,
          value: updatedRoles // Return as array, not string
        }
      });
    }
  };

  const filteredRoles = jobRoles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="border rounded p-3">
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search job roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border rounded p-2"
        />
      </div>
      
      {selectedRoles.length > 0 && (
        <div className="mb-3">
          <div className="text-sm font-medium mb-2">Selected ({selectedRoles.length}):</div>
          <div className="flex flex-wrap gap-2">
            {selectedRoles.map(role => (
              <span
                key={role}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {role}
                <button
                  type="button"
                  onClick={() => handleToggleRole(role)}
                  className="hover:text-red-600 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="max-h-60 overflow-y-auto border rounded p-2">
        {filteredRoles.length > 0 ? (
          <div className="space-y-1">
            {filteredRoles.map(role => {
              const isSelected = selectedRoles.includes(role.name);
              return (
                <label
                  key={role._id}
                  className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-green-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleRole(role.name)}
                    className="mr-3 h-4 w-4"
                  />
                  <span className={isSelected ? 'font-medium text-green-700' : ''}>
                    {role.name}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            {searchTerm ? 'No matching job roles found' : 'No job roles available'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiJobRoleSelector;
