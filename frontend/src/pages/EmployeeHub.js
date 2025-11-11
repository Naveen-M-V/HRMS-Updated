import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

export default function EmployeeHub() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("All");
  const [sortBy, setSortBy] = useState("First name (A - Z)");
  const [status, setStatus] = useState("All");
  const [expandedTeams, setExpandedTeams] = useState({ Office: true });

  // Mock data - replace with actual API call
  const [employees, setEmployees] = useState([
    {
      id: 1,
      firstName: "Darren",
      lastName: "Jones",
      jobTitle: "Operation Manager",
      team: "Office",
      office: "SCB Office",
      avatar: null,
      initials: "DJ",
      color: "#3B82F6",
    },
    {
      id: 2,
      firstName: "Gareth",
      lastName: "Leonard",
      jobTitle: "Operations Director",
      team: "Office",
      office: "SCB Group Office",
      avatar: null,
      initials: "GL",
      color: "#3B82F6",
    },
    {
      id: 3,
      firstName: "Stefan",
      lastName: "Bond",
      jobTitle: "Managing Director",
      team: "Office",
      office: "SCB Office",
      avatar: null,
      initials: "SB",
      color: "#3B82F6",
    },
  ]);

  const [teams, setTeams] = useState([
    {
      name: "Office",
      count: 3,
      employees: [1, 2, 3],
    },
  ]);

  const toggleTeam = (teamName) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamName]: !prev[teamName],
    }));
  };

  const handleViewProfile = (employeeId) => {
    navigate(`/profiles/${employeeId}`);
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
    const team = teams.find((t) => t.name === teamName);
    if (!team) return [];
    return filteredEmployees.filter((emp) => team.employees.includes(emp.id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/add-employee")}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Add employees
          </button>

          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
            <span className="text-sm text-gray-700">
              <span className="font-semibold">1 employee</span> not registered
              for BrightHR
            </span>
            <button className="text-pink-600 hover:text-pink-700 border border-pink-600 hover:border-pink-700 px-4 py-1 rounded text-sm font-medium transition-colors">
              View
            </button>
          </div>
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

      {/* Teams Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Your teams
        </h2>

        {teams.map((team) => (
          <div key={team.name} className="mb-6">
            {/* Team Header */}
            <button
              onClick={() => toggleTeam(team.name)}
              className="flex items-center justify-between w-full text-left mb-4 group"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-gray-900">
                  {team.name} ({team.count})
                </span>
              </div>
              {expandedTeams[team.name] ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
              )}
            </button>

            {/* Employee Cards */}
            {expandedTeams[team.name] && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getTeamEmployees(team.name).map((employee) => (
                  <div
                    key={employee.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Employee Header */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div
                        className="h-16 w-16 rounded-full flex items-center justify-center text-white font-semibold text-xl flex-shrink-0"
                        style={{ backgroundColor: employee.color }}
                      >
                        {employee.initials}
                      </div>

                      {/* Employee Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {employee.firstName} {employee.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {employee.jobTitle}
                        </p>
                        <button
                          onClick={() => handleViewProfile(employee.id)}
                          className="text-sm text-pink-600 hover:text-pink-700 font-medium mt-1"
                        >
                          View full profile
                        </button>
                      </div>

                      {/* Quick View Button */}
                      <button
                        onClick={() => handleQuickView(employee)}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span className="hidden lg:inline">Quick view</span>
                      </button>
                    </div>

                    {/* Office Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      <span>{employee.office}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
