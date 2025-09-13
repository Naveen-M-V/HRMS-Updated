// src/pages/ProfilesPage.js
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "../context/ProfileContext";
import { Link } from "react-router-dom";

export default function ProfilesPage() {
  const { profiles } = useProfiles();
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStaffType, setSelectedStaffType] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedManager, setSelectedManager] = useState("");

  const navigate = useNavigate();

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
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
  const clearAllFilters = () => {
    setSearch("");
    setRowsPerPage(10);
    setSelectedRole("");
    setSelectedStaffType("");
    setSelectedCompany("");
    setSelectedManager("");
  };

  // ✅ Filtered profiles
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch = `${p.firstName} ${p.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesRole = !selectedRole || p.role === selectedRole;
    const matchesStaffType = !selectedStaffType || p.staffType === selectedStaffType;
    const matchesCompany = !selectedCompany || p.company === selectedCompany;
    const matchesManager = !selectedManager || p.poc === selectedManager;
    
    return matchesSearch && matchesRole && matchesStaffType && matchesCompany && matchesManager;
  });

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

      {/* Search + Row selector */}
      <div className="flex items-center justify-between mb-4">
        {/* Search box */}
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-1/3"
        />

        {/* Rows per page selector */}
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

        {/* Clear filters button */}
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
              <td className="border px-2 py-1">{p.skillkoId || p._id}</td>
              <td className="border px-2 py-1">{p.role}</td>
              <td className="border px-2 py-1">{p.firstName}</td>
              <td className="border px-2 py-1">{p.lastName}</td>
              <td className="border px-2 py-1">{p.staffType}</td>
              <td className="border px-2 py-1">{p.company}</td>
              <td className="border px-2 py-1">{p.jobTitle}</td>
              <td className="border px-2 py-1">{formatDate(p.lastSeen)}</td>
              <td className="border px-2 py-1 text-center">
                <Link to={`/profiles/${p._id}`} className="text-blue-600 mr-2" title="View Profile">👁</Link>
                <Link to={`/profiles/edit/${p._id}`} className="text-gray-600" title="Edit Profile">⚙</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
