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
    // First try to find employee in current data
    let employee = allEmployees.find(emp => emp._id === employeeId);
    
    if (employee) {
      setSelectedEmployee(employee);
      setShowProfileModal(true);
      
      // Fetch fresh employee data in the background to ensure we have latest info
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/employees/${employeeId}`);
        if (response.data.success) {
          const freshEmployee = response.data.data;
          console.log('Fresh employee data:', freshEmployee);
          setSelectedEmployee(freshEmployee);
        }
      } catch (error) {
        console.error('Error fetching fresh employee data:', error);
      }
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
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="All">All</option>
              <option value="Team">Team</option>
              <option value="Department">Department</option>
              <option value="Location">Location</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort by
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="First name (A - Z)">First name (A - Z)</option>
              <option value="First name (Z - A)">First name (Z - A)</option>
              <option value="Last name (A - Z)">Last name (A - Z)</option>
              <option value="Last name (Z - A)">Last name (Z - A)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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
              {/* Personal Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
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
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</label>
                          <p className="text-sm font-medium text-gray-900">{selectedEmployee.firstName || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                          <p className="text-sm text-gray-900">{selectedEmployee.email || '-'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</label>
                          <p className="text-sm text-gray-900">{selectedEmployee.employeeId || selectedEmployee._id?.slice(-6) || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Middle Name</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.middleName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedEmployee.startDate)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.lastName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Position</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.jobTitle || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.gender || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address Line 1</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.address1 || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address Line 2</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.address2 || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">ZIP Code</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.postcode || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">City</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.townCity || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">State</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.county || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Human Resource Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Human Resource Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.employeeId || selectedEmployee._id?.slice(-6) || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Department</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.department || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedEmployee.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Team</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.team || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Office Location</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.office || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Type</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.employmentType || '-'}</p>
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
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Work Location</label>
                    <p className="text-sm text-gray-900">{selectedEmployee.workLocation || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Name</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.emergencyContactName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.emergencyContactRelation || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Emergency Contact Email</label>
                      <p className="text-sm text-gray-900">{selectedEmployee.emergencyContactEmail || '-'}</p>
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
