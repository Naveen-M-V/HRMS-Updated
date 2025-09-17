import React, { useState, useEffect } from 'react';

const JobRoleDropdown = ({ 
  value, 
  onChange, 
  name = "jobRole",
  placeholder = "Select or add job role",
  className = "",
  required = false 
}) => {
  const [jobRoles, setJobRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newJobRole, setNewJobRole] = useState('');

  const getApiUrl = () => {
    if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    return process.env.REACT_APP_API_URL || 'https://talentshield.co.uk';
  };

  // Fetch job roles on component mount
  useEffect(() => {
    fetchJobRoles();
  }, []);

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

  const handleJobRoleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      fetchJobRoles();
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/job-roles/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setJobRoles(data);
      }
    } catch (error) {
      console.error('Error searching job roles:', error);
    }
  };

  const handleAddJobRole = async (jobRoleName) => {
    if (!jobRoleName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/job-roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: jobRoleName.trim() }),
      });

      if (response.ok) {
        const newJobRoleData = await response.json();
        
        // Update the job roles list
        setJobRoles(prev => {
          const exists = prev.find(role => role._id === newJobRoleData._id);
          if (exists) return prev;
          return [newJobRoleData, ...prev];
        });

        // Select the new job role
        onChange({ target: { name, value: newJobRoleData.name } });
        setSearchTerm(newJobRoleData.name);
        setNewJobRole('');
        setShowAddForm(false);
        setIsDropdownOpen(false);
      }
    } catch (error) {
      console.error('Error adding job role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);
    onChange({ target: { name, value: inputValue } });
    
    if (inputValue.length > 0) {
      setIsDropdownOpen(true);
      handleJobRoleSearch(inputValue);
    } else {
      setIsDropdownOpen(false);
      fetchJobRoles();
    }
  };

  const handleSelectJobRole = (jobRole) => {
    setSearchTerm(jobRole.name);
    onChange({ target: { name, value: jobRole.name } });
    setIsDropdownOpen(false);
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
    if (!searchTerm) {
      fetchJobRoles();
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow for clicks on dropdown items
    setTimeout(() => {
      if (!showAddForm) {
        setIsDropdownOpen(false);
      }
    }, 200);
  };

  const filteredJobRoles = jobRoles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exactMatch = filteredJobRoles.find(role => 
    role.name.toLowerCase() === searchTerm.toLowerCase()
  );

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        name={name}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        required={required}
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoComplete="off"
      />

      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredJobRoles.length > 0 ? (
            <>
              {filteredJobRoles.map((jobRole) => (
                <div
                  key={jobRole._id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onMouseDown={() => handleSelectJobRole(jobRole)}
                >
                  <div className="font-medium">{jobRole.name}</div>
                  {jobRole.description && (
                    <div className="text-xs text-gray-500">{jobRole.description}</div>
                  )}
                </div>
              ))}
            </>
          ) : searchTerm && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No job roles found
            </div>
          )}

          {searchTerm && !exactMatch && (
            <div className="border-t border-gray-200">
              {!showAddForm ? (
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 focus:outline-none"
                  onMouseDown={() => setShowAddForm(true)}
                >
                  + Add "{searchTerm}" as new job role
                </button>
              ) : (
                <div className="p-3 border-t">
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={newJobRole}
                      onChange={(e) => setNewJobRole(e.target.value)}
                      placeholder="Enter job role name"
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddJobRole(newJobRole || searchTerm)}
                        disabled={isLoading}
                        className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Adding...' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewJobRole('');
                        }}
                        className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobRoleDropdown;
