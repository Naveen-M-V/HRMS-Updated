// src/pages/ProfilesPage.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProfiles } from '../context/ProfileContext';
import { EyeIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAlert } from "../components/AlertNotification";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '../components/ui/pagination';

// Get API URL - same logic as ProfileContext
const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || "https://talentshield.co.uk";
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
  const { success, error } = useAlert();
  const { profiles, deleteProfile, fetchProfiles } = useProfiles();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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
    setCurrentPage(1);
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
      error('Invalid profile data. Please refresh the page and try again.');
      return;
    }

    // Check if deleteProfile function exists
    if (typeof deleteProfile !== 'function') {
      console.error('deleteProfile function not available');
      error('Delete function not available. Please refresh the page and try again.');
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

        success(successMessage);
        console.log(`Profile ${profileName} deleted successfully`, response);
        
        // Refresh the profiles list to ensure UI is updated
        console.log('Refreshing profiles list...');
        await fetchProfiles();
        console.log('Profiles refreshed');
        
      } catch (err) {
        console.error('Error deleting profile:', err);
        error(`Failed to delete profile: ${err.message || 'Please try again.'}`);
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
  }, []); // Remove fetchProfiles dependency to prevent infinite loop

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

  // Pagination logic
  const itemsPerPage = 10; // Fixed at 10 as per requirement
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedProfiles = filteredProfiles.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedRole, selectedStaffType, selectedCompany, selectedManager]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (start > 2) pages.push('ellipsis-start');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('ellipsis-end');
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profiles</h1>
                <p className="text-gray-600 mt-1">Manage and track all employee profiles</p>
              </div>
              {/*<button
                onClick={() => navigate("/dashboard/profilescreate")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                + Create Profile
              </button>*/}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Rows per page - Fixed at 10 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">10 entries per page</span>
              </div>
            </div>

            {/* Filters */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-5 gap-4">
                <select 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Roles</option>
                  {filterOptions.roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <select 
                  value={selectedStaffType} 
                  onChange={(e) => setSelectedStaffType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Staff Types</option>
                  {filterOptions.staffTypes.map(staffType => (
                    <option key={staffType} value={staffType}>{staffType}</option>
                  ))}
                </select>
                <select 
                  value={selectedCompany} 
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Companies</option>
                  {filterOptions.companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
                <select 
                  value={selectedManager} 
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Managers</option>
                  {filterOptions.managers.map(manager => (
                    <option key={manager} value={manager}>{manager}</option>
                  ))}
                </select>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-300"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">SI No.</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">VTID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">First name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Type</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedProfiles.map((p, index) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{generateVTID(p)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.firstName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.lastName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.staffType}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{p.company}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {(() => {
                        const jobRoles = Array.isArray(p.jobRole) ? p.jobRole : (p.jobRole ? [p.jobRole] : []);
                        return jobRoles.length > 0 ? jobRoles.join(', ') : "N/A";
                      })()
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(p.lastSeen)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/profiles/${p._id}`} 
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors font-medium"
                          title="View Profile"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            console.log('Edit clicked for profile:', p._id);
                            console.log('Navigating to:', `/profiles/edit/${p._id}`);
                            navigate(`/profiles/edit/${p._id}`);
                          }}
                          className="text-gray-600 hover:text-gray-800"
                          title="Edit Profile"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('Delete clicked for profile:', p._id, p.firstName, p.lastName);
                            handleDeleteProfile(p._id, `${p.firstName} ${p.lastName}`);
                          }}
                          className="text-red-600 hover:text-red-800"
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

          {/* Pagination */}
          {filteredProfiles.length > 0 && totalPages > 1 && (
            <div className="px-6 py-4 border-t">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((pageNum, index) => {
                    if (typeof pageNum === 'string' && pageNum.startsWith('ellipsis')) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={pageNum === currentPage}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              {/* Pagination Info */}
              <div className="mt-4 text-sm text-gray-600 text-center">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredProfiles.length)} of {filteredProfiles.length} entries
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
