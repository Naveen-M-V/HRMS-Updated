// src/pages/ProfilesPage.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProfiles } from '../context/ProfileContext';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Get API URL - same logic as ProfileContext
const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL 
};

// Safely get VTID for a profile row
function generateVTID(profile) {
  if (!profile) return "N/A";
  // If backend has assigned a VTID, use it
  if (profile.vtid) return profile.vtid;
  // Otherwise, show placeholder
  return "N/A";
}

export default function ProfilesPage() {
  const { profiles, deleteProfile, fetchProfiles } = useProfiles();
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStaffType, setSelectedStaffType] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!Array.isArray(profiles)) {
      console.error("Profiles data is not an array:", profiles);
      return { roles: [], staffTypes: [], companies: [], managers: [] };
    }

    const roles = [...new Set(profiles.map(p => p.role).filter(Boolean))].sort();
    const staffTypes = [...new Set(profiles.map(p => p.staffType).filter(Boolean))].sort();
    const companies = [...new Set(profiles.map(p => p.company).filter(Boolean))].sort();
    const managers = [...new Set(profiles.map(p => p.poc).filter(Boolean))].sort();
    
    return { roles, staffTypes, companies, managers };
  }, [profiles]);

  // Format date helper function
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearch("");
    setRowsPerPage(10);
    setSelectedRole("");
    setSelectedStaffType("");
    setSelectedCompany("");
    setSelectedManager("");
  }, []);

  // Handle profile deletion
  const handleDeleteProfile = useCallback(async (profileId, profileName) => {
    console.log('handleDeleteProfile called with:', { profileId, profileName });
    
    // Validate inputs
    if (!profileId || !profileName) {
      console.error('Invalid profile data:', { profileId, profileName });
      alert('Invalid profile data. Please refresh the page and try again.');
      return;
    }

    // Check if deleteProfile function exists
    if (typeof deleteProfile !== 'function') {
      console.error('deleteProfile function not available');
      alert('Delete function not available. Please refresh the page and try again.');
      return;
    }

    // Simple confirmation without fetching certificate count first
    const confirmMessage = `Are you sure you want to delete the profile for ${profileName}?

This will also delete any associated certificates and user account. This action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      console.log('User confirmed deletion');
      setLoading(true);
      
      try {
        console.log('Calling deleteProfile function...');
        const response = await deleteProfile(profileId);
        console.log('Delete response:', response);

        // Show detailed success message based on backend response
        let successMessage = `Profile for ${profileName} deleted successfully!`;
        
        if (response && response.details) {
          const details = [];
          if (response.details.certificatesDeleted > 0) {
            details.push(`${response.details.certificatesDeleted} certificate(s)`);
          }
          if (response.details.userAccountDeleted) {
            details.push('user account');
          }
          
          if (details.length > 0) {
            successMessage += `\n\nAlso deleted: ${details.join(' and ')}`;
          }
        }

        alert(successMessage);
        console.log(`Profile ${profileName} deleted successfully`, response);
        
        // Refresh the profiles list to ensure UI is updated
        console.log('Refreshing profiles list...');
        await fetchProfiles();
        console.log('Profiles refreshed');
        
      } catch (error) {
        console.error('Error deleting profile:', error);
        alert(`Failed to delete profile: ${error.message || 'Please try again.'}`);
      } finally {
        setLoading(false);
      }
    } else {
      console.log('User cancelled deletion');
    }
  }, [deleteProfile, profiles, fetchProfiles]);

  // Load profiles on mount and refresh when component becomes visible
  useEffect(() => {
    fetchProfiles();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProfiles();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfiles]);

  // Filtered profiles with memoization for performance
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch = `${p.firstName} ${p.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesRole = !selectedRole || p.role === selectedRole;
      const matchesStaffType = !selectedStaffType || p.staffType === selectedStaffType;
      const matchesCompany = !selectedCompany || p.company === selectedCompany;
      const matchesManager = !selectedManager || p.poc === selectedManager;

      return matchesSearch && matchesRole && matchesStaffType && matchesCompany && matchesManager;
    });
  }, [profiles, search, selectedRole, selectedStaffType, selectedCompany, selectedManager]);

  return (
    <div className="p-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold">Profiles</h1>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                console.log('Testing API connection...');
                const response = await fetch(`${getApiUrl()}/api/test`, {
                  credentials: 'include'
                });
                console.log('Test response status:', response.status);
                const data = await response.json();
                console.log('Test response data:', data);
                alert(`API Test: ${data.message}`);
              } catch (error) {
                console.error('API Test failed:', error);
                alert(`API Test Failed: ${error.message}`);
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-sm"
          >
            Test API
          </button>
          <button
            onClick={() => navigate("/dashboard/profilescreate")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
          >
            + Create Profile
          </button>
        </div>
      </div>

      {/* Search + Rows selector */}
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-1/3"
        />

        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm">entries</span>
        </div>
      </div>

      {/* Filters + Clear button */}
      <div className="flex gap-4 mb-4">
        <select 
          value={selectedRole} 
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Roles</option>
          {filterOptions.roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select 
          value={selectedStaffType} 
          onChange={(e) => setSelectedStaffType(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Staff Types</option>
          {filterOptions.staffTypes.map(staffType => (
            <option key={staffType} value={staffType}>{staffType}</option>
          ))}
        </select>
        <select 
          value={selectedCompany} 
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Companies</option>
          {filterOptions.companies.map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>
        <select 
          value={selectedManager} 
          onChange={(e) => setSelectedManager(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Managers</option>
          {filterOptions.managers.map(manager => (
            <option key={manager} value={manager}>{manager}</option>
          ))}
        </select>

        <button
          onClick={clearAllFilters}
          className="ml-auto text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
          Clear All Filters
        </button>
      </div>

      {/* Table */}
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">VTID</th>
            <th className="border px-2 py-1">Role</th>
            <th className="border px-2 py-1">First name</th>
            <th className="border px-2 py-1">Last name</th>
            <th className="border px-2 py-1">Staff Type</th>
            <th className="border px-2 py-1">Company</th>
            <th className="border px-2 py-1">Job Title</th>
            <th className="border px-2 py-1">Last Seen</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProfiles.slice(0, rowsPerPage).map((p) => (
            <tr key={p._id}>
              <td className="border px-2 py-1">{generateVTID(p)}</td>
              <td className="border px-2 py-1">{p.role}</td>
              <td className="border px-2 py-1">{p.firstName}</td>
              <td className="border px-2 py-1">{p.lastName}</td>
              <td className="border px-2 py-1">{p.staffType}</td>
              <td className="border px-2 py-1">{p.company}</td>
              <td className="border px-2 py-1">
                {(() => {
                  // Try jobTitle first, then jobRole as fallback
                  const jobTitles = Array.isArray(p.jobTitle) ? p.jobTitle : (p.jobTitle ? [p.jobTitle] : []);
                  const jobRoles = Array.isArray(p.jobRole) ? p.jobRole : (p.jobRole ? [p.jobRole] : []);
                  
                  // Use jobTitle if available, otherwise use jobRole
                  const displayRoles = jobTitles.length > 0 ? jobTitles : jobRoles;
                  
                  return displayRoles.length > 0 ? displayRoles.join(', ') : "N/A";
                })()
                }
              </td>
              <td className="border px-2 py-1">{formatDate(p.lastSeen)}</td>
              <td className="border px-2 py-1 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Link 
                    to={`/profiles/${p._id}`} 
                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50" 
                    title="View Profile"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    to={`/dashboard/profiles/edit/${profile._id}`} 
                    className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                    title="Edit Profile">                    
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Delete clicked for profile:', p._id, p.firstName, p.lastName);
                      handleDeleteProfile(p._id, `${p.firstName} ${p.lastName}`);
                    }}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                    title="Delete Profile"
                    disabled={loading}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
