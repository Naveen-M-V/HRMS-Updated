// src/pages/ProfilesPage.js
import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "../context/ProfileContext";
import { Link } from "react-router-dom";
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { generateVTID } from '../utils/vtid'; // Import VTID utility
import { getApiUrl } from '../utils/api'; // Adjust path as needed


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
    // Check how many certificates are associated with this profile
    const profile = profiles.find(p => p._id === profileId);
    const certificateCount = await fetch(`${getApiUrl()}/api/profiles/${profileId}/stats`)
      .then(res => res.json())
      .then(data => data.certificates?.total || 0)
      .catch(() => 0);
    
    const confirmMessage = certificateCount > 0 
      ? `Are you sure you want to delete the profile for ${profileName}? 

This will also delete ${certificateCount} associated certificate(s). This action cannot be undone.`
      : `Are you sure you want to delete the profile for ${profileName}? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      setLoading(true);
      try {
        const response = await deleteProfile(profileId);
        
        // Show detailed success message
        const certCount = response.details?.certificatesDeleted || certificateCount;
        if (certCount > 0) {
          alert(`Profile and ${certCount} associated certificate(s) deleted successfully!`);
        } else {
          alert('Profile deleted successfully!');
        }
        
        console.log(`Profile ${profileName} deleted successfully`);
      } catch (error) {
        console.error('Error deleting profile:', error);
        alert('Failed to delete profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }, [deleteProfile, profiles]);

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
        <button
          onClick={() => navigate("/dashboard/profilescreate")}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
        >
          + Create Profile
        </button>
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
                    to={`/profiles/edit/${p._id}`} 
                    className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50" 
                    title="Edit Profile"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteProfile(p._id, `${p.firstName} ${p.lastName}`)}
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
