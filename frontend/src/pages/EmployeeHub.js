import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export default function EmployeeHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("All");
  const [sortBy, setSortBy] = useState("First name (A - Z)");
  const [status, setStatus] = useState("All");
  const [expandedTeams, setExpandedTeams] = useState({});
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Employees data from API
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Teams data from API
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Fetch employees from EmployeesHub schema
  const fetchAllEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/employees`);
      if (response.data.success) {
        const employees = response.data.data;
        
        // Debug: Check if profile photos are being loaded
        console.log('Fetched employees:', employees);
        const employeesWithPhotos = employees.filter(emp => emp.profilePhoto);
        console.log(`${employeesWithPhotos.length} employees have profile photos out of ${employees.length} total`);
        
        setAllEmployees(employees);
        setEmployees(employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load employees and teams on component mount
  useEffect(() => {
    fetchAllEmployees();
    fetchTeams();
  }, []);

  // Listen for refresh parameter to reload data after edits
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam) {
      console.log('Refreshing employee data after edit/create');
      fetchAllEmployees();
      // Clean up the URL parameter
      navigate('/employee-hub', { replace: true });
    }
  }, [searchParams, navigate]);


  // Fetch teams from API
  const fetchTeams = async () => {
    setTeamsLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/teams`);
      if (response.data.success) {
        setTeams(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setTeamsLoading(false);
    }
  };

  const toggleTeam = (teamName) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamName]: !prev[teamName],
    }));
  };

  const handleViewProfile = async (employeeId) => {
    console.log('handleViewProfile called with ID:', employeeId);
    
    // First try to find employee in current data
    let employee = allEmployees.find(emp => emp._id === employeeId);
    
    if (employee) {
      console.log('Found employee in local data:', employee);
      setSelectedEmployee(employee);
      setShowProfileModal(true);
      
      // Fetch fresh employee data in the background to ensure we have latest info
      try {
        const url = `${process.env.REACT_APP_API_BASE_URL}/employees/${employeeId}`;
        console.log('Fetching fresh employee data from:', url);
        const response = await axios.get(url);
        if (response.data.success) {
          const freshEmployee = response.data.data;
          console.log('Fresh employee data received:', freshEmployee);
          setSelectedEmployee(freshEmployee);
        }
      } catch (error) {
        console.error('Error fetching fresh employee data:', error);
        console.error('Error response:', error.response?.data);
        console.error('Employee ID that caused error:', employeeId);
        // Keep showing the cached employee data even if API call fails
      }
    } else {
      console.error('Employee not found in local data for ID:', employeeId);
    }
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedEmployee(null);
  };

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return "-";
    }
  };

  const handleQuickView = (employee) => {
    // Implement quick view modal logic
    console.log("Quick view for:", employee);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getTeamEmployees = (teamName) => {
    // Filter employees by team name from their team field
    return allEmployees.filter((emp) => emp.team === teamName);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Employees</h1>

      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/add-employee")}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Add employees
          </button>

        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Find
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name, job title"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by
            </label>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Team">Team</SelectItem>
                <SelectItem value="Department">Department</SelectItem>
                <SelectItem value="Location">Location</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort by
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="First name (A - Z)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="First name (A - Z)">First name (A - Z)</SelectItem>
                <SelectItem value="First name (Z - A)">First name (Z - A)</SelectItem>
                <SelectItem value="Last name (A - Z)">Last name (A - Z)</SelectItem>
                <SelectItem value="Last name (Z - A)">Last name (Z - A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Employee List Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowEmployeeList(!showEmployeeList)}
          className="flex items-center justify-between w-full text-left mb-4 group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">
              List of Employees ({allEmployees.length})
            </span>
          </div>
          {showEmployeeList ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
          )}
        </button>

        {/* View Toggle Buttons */}
        {showEmployeeList && (
          <div className="flex items-center justify-end gap-2 mb-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-9-8h9m-9 4h9" />
                </svg>
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </button>
            </div>
          </div>
        )}

        {/* Employee Table/Grid */}
        {showEmployeeList && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading employees...</p>
              </div>
            ) : allEmployees.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No employees found
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Job Role</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allEmployees.map((employee, index) => (
                      <tr 
                        key={employee._id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewProfile(employee._id)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                              {employee.profilePhoto ? (
                                <img
                                  src={employee.profilePhoto}
                                  alt={`${employee.firstName} ${employee.lastName}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div
                                  className="h-full w-full flex items-center justify-center text-white font-medium text-sm"
                                  style={{ backgroundColor: employee.color || '#3B82F6' }}
                                >
                                  {employee.initials || `${employee.firstName?.charAt(0) || ''}${employee.lastName?.charAt(0) || ''}`}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {employee.firstName || '-'} {employee.lastName || '-'}
                              </div>
                              <div className="text-xs text-gray-500">{employee.email || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{employee.team || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{employee.jobTitle || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{employee.department || '-'}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(employee._id);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors font-medium"
                            title="View Profile"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {allEmployees.map((employee) => (
                  <div
                    key={employee._id}
                    onClick={() => handleViewProfile(employee._id)}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer hover:border-gray-300"
                  >
                    {/* Employee Avatar */}
                    <div className="flex flex-col items-center text-center">
                      <div className="h-16 w-16 rounded-full overflow-hidden mb-3">
                        {employee.profilePhoto ? (
                          <img
                            src={employee.profilePhoto}
                            alt={`${employee.firstName} ${employee.lastName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="h-full w-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: employee.color || '#3B82F6' }}
                          >
                            {employee.initials || `${employee.firstName?.charAt(0) || ''}${employee.lastName?.charAt(0) || ''}`}
                          </div>
                        )}
                      </div>
                      
                      {/* Employee Info */}
                      <div className="w-full">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {employee.firstName || '-'} {employee.lastName || '-'}
                        </h3>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {employee.jobTitle || '-'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {employee.department || '-'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {employee.team || 'No team'}
                        </p>
                      </div>

                      {/* View Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(employee._id);
                        }}
                        className="mt-3 w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors font-medium"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teams Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Your teams
        </h2>

        {teamsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No teams found
            </h3>
            <p className="text-gray-600 mb-4">
              Teams will appear here once they are created
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {teams.map((team) => (
              <div
                key={team._id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all hover:border-gray-300"
              >
                {/* Team Header */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Team Avatar */}
                  <div
                    className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: team.color || '#3B82F6' }}
                  >
                    {team.initials || team.name.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {team.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {team.memberCount || 0} member{(team.memberCount || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Team Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleTeam(team.name)}
                    className="flex-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded transition-colors font-medium"
                  >
                    {expandedTeams[team.name] ? 'Hide Members' : 'View Members'}
                  </button>
                  <button
                    onClick={() => handleQuickView(team)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                    title="Team details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Team Members - Expandable */}
                {expandedTeams[team.name] && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      {getTeamEmployees(team.name).length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">
                          No members assigned
                        </p>
                      ) : (
                        getTeamEmployees(team.name).slice(0, 3).map((employee) => (
                          <div key={employee.id} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                              {employee.profilePhoto ? (
                                <img
                                  src={employee.profilePhoto}
                                  alt={`${employee.firstName} ${employee.lastName}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div
                                  className="h-full w-full flex items-center justify-center text-white font-medium text-sm"
                                  style={{ backgroundColor: employee.color || '#3B82F6' }}
                                >
                                  {employee.initials || `${employee.firstName?.charAt(0) || ''}${employee.lastName?.charAt(0) || ''}`}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {employee.firstName} {employee.lastName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {employee.jobTitle || '-'}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {getTeamEmployees(team.name).length > 3 && (
                        <div className="text-xs text-gray-500 text-center pt-2">
                          +{getTeamEmployees(team.name).length - 3} more members
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employee Profile Modal */}
      {showProfileModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden">
                  {selectedEmployee.profilePhoto ? (
                    <img
                      src={selectedEmployee.profilePhoto}
                      alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: selectedEmployee.color || '#3B82F6' }}
                    >
                      {selectedEmployee.initials || `${selectedEmployee.firstName?.charAt(0) || ''}${selectedEmployee.lastName?.charAt(0) || ''}`}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Personal Details</h2>
                  <p className="text-sm text-gray-600">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate(`/add-employee?edit=${selectedEmployee._id}`)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors font-medium"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Details
                </button>
                <button
                  onClick={handleCloseProfileModal}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Basic Details */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-lg flex-shrink-0 overflow-hidden">
                      {selectedEmployee.profilePhoto ? (
                        <img
                          src={selectedEmployee.profilePhoto}
                          alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className="h-full w-full flex items-center justify-center text-white font-bold text-xl"
                          style={{ backgroundColor: selectedEmployee.color || '#3B82F6' }}
                        >
                          {selectedEmployee.initials || `${selectedEmployee.firstName?.charAt(0) || ''}${selectedEmployee.lastName?.charAt(0) || ''}`}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Title</label>
                          <p className="text-sm font-medium text-gray-900">{selectedEmployee.title || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</label>
                          <p className="text-sm font-medium text-gray-900">{selectedEmployee.firstName || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Middle Name</label>
                          <p className="text-sm text-gray-900">{selectedEmployee.middleName || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</label>
                          <p className="text-sm text-gray-900">{selectedEmployee.lastName || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.gender || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ethnicity</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.ethnicity || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedEmployee.dateOfBirth) || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.email || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile Number</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Work Phone</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.workPhone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.employeeId || selectedEmployee._id?.slice(-6) || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Start Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedEmployee.startDate) || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6" />
                  </svg>
                  Job Details
                </h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</label>
                      <p className="text-sm font-medium text-gray-900">{selectedEmployee.jobTitle || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Department</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.department || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Team</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.team || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Office</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.office || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Type</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.employmentType || 'Full-time'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                      <p className="text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          selectedEmployee.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedEmployee.status || 'Active'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Probation End Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedEmployee.probationEndDate) || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Address Information
                </h3>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address Line 1</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.address1 || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address Line 2</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.address2 || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address Line 3</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.address3 || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Town/City</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.townCity || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">County</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.county || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Postcode</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.postcode || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>


              {/* Emergency Contact Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Emergency Contact Information
                </h3>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Name</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.emergencyContactName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.emergencyContactRelation || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.emergencyContactPhone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.emergencyContactEmail || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary & Payment Details */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Salary & Payment Details
                </h3>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</label>
                      <p className="text-sm font-medium text-gray-900">£{selectedEmployee.salary || '0'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.rate || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Frequency</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.paymentFrequency || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedEmployee.effectiveFrom) || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.reason || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payroll Number</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.payrollNumber || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Bank Details
                </h3>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.accountName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.bankName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Branch</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.bankBranch || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.accountNumber ? '****' + selectedEmployee.accountNumber.slice(-4) : '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sort Code</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.sortCode || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax & National Insurance */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Tax & National Insurance
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Code</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.taxCode || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">National Insurance Number</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.niNumber ? selectedEmployee.niNumber.substring(0, 2) + '****' + selectedEmployee.niNumber.slice(-2) : '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Document Information
                </h3>
                <div className="bg-teal-50 rounded-lg p-4">
                  <div className="space-y-6">
                    {/* Passport */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Passport</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Passport Number</label>
                          <p className="text-sm text-gray-900">{selectedEmployee.passportNumber || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Country</label>
                          <p className="text-sm text-gray-900">{selectedEmployee.passportCountry || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</label>
                          <p className="text-sm text-gray-900">{formatDate(selectedEmployee.passportExpiryDate) || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Driving Licence */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Driving Licence</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Licence Number</label>
                          <p className="text-sm text-gray-900">{selectedEmployee.licenceNumber || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Country</label>
                          <p className="text-sm text-gray-900">{selectedEmployee.licenceCountry || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Class</label>
                          <p className="text-sm text-gray-900">{selectedEmployee.licenceClass || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</label>
                          <p className="text-sm text-gray-900">{formatDate(selectedEmployee.licenceExpiryDate) || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Visa */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Visa</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Visa Number</label>
                          <p className="text-sm text-gray-900">{selectedEmployee.visaNumber || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</label>
                          <p className="text-sm text-gray-900">{formatDate(selectedEmployee.visaExpiryDate) || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
