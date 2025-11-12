import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function ManageTeams() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});

  // Employees data from API
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Teams data from API
  const [teams, setTeams] = useState([]);

  // Fetch employees and teams from API
  useEffect(() => {
    fetchEmployees();
    fetchTeams();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/employees`);
      if (response.data.success) {
        // Transform API data to match component structure
        const transformedEmployees = response.data.data.map(emp => ({
          id: emp._id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          jobTitle: emp.jobTitle,
          currentTeam: emp.team || null
        }));
        setAllEmployees(transformedEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/teams`);
      if (response.data.success) {
        // Transform API data to match component structure
        const transformedTeams = response.data.data.map(team => ({
          id: team._id,
          name: team.name,
          initials: team.initials,
          memberCount: team.memberCount,
          color: team.color
        }));
        setTeams(transformedTeams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleOpenAssignModal = () => {
    if (newTeamName.trim()) {
      setShowCreateModal(false);
      setShowAssignModal(true);
      // Initialize expanded groups
      const groups = {};
      teams.forEach(team => {
        groups[team.name] = true;
      });
      groups["No group"] = true;
      setExpandedGroups(groups);
    }
  };

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const selectGroup = (groupName) => {
    const groupEmployees = allEmployees
      .filter((emp) => emp.currentTeam === groupName || (groupName === "No group" && !emp.currentTeam))
      .map((emp) => emp.id);
    setSelectedEmployees((prev) => [...new Set([...prev, ...groupEmployees])]);
  };

  const deselectGroup = (groupName) => {
    const groupEmployees = allEmployees
      .filter((emp) => emp.currentTeam === groupName || (groupName === "No group" && !emp.currentTeam))
      .map((emp) => emp.id);
    setSelectedEmployees((prev) => prev.filter((id) => !groupEmployees.includes(id)));
  };

  const handleCreateTeam = async () => {
    if (newTeamName.trim()) {
      try {
        // Generate initials from team name
        const words = newTeamName.trim().split(" ");
        const initials = words.length > 1 
          ? words.map(w => w[0]).join("").toUpperCase()
          : newTeamName.substring(0, 2).toUpperCase();
        
        const teamData = {
          name: newTeamName,
          initials: initials,
          members: selectedEmployees,
          color: "#3B82F6",
        };

        const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/employees`, teamData);
        
        if (response.data.success) {
          // Refresh teams and employees
          await fetchTeams();
          await fetchEmployees();
          
          // Reset states
          setNewTeamName("");
          setSelectedEmployees([]);
          setShowAssignModal(false);
        }
      } catch (error) {
        console.error('Error creating team:', error);
        alert('Failed to create team. Please try again.');
      }
    }
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowAssignModal(false);
    setNewTeamName("");
    setSelectedEmployees([]);
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        const response = await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/teams/${teamId}`);
        if (response.data.success) {
          await fetchTeams();
          await fetchEmployees();
        }
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Failed to delete team. Please try again.');
      }
    }
  };

  const handleEditTeam = (teamId) => {
    // Implement edit logic
    console.log("Edit team:", teamId);
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Team Management</h1>

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors mb-6"
        >
          Add a new team
        </button>

        {/* Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Find
          </label>
          <input
            type="text"
            placeholder="Team name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              {/* Team Info */}
              <div className="flex items-center gap-3">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: team.color }}
                >
                  {team.initials}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {team.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditTeam(team.id)}
                  className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit team"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  className="p-2 text-blue-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete team"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No teams found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? "Try adjusting your search"
              : "Get started by creating your first team"}
          </p>
        </div>
      )}

      {/* Step 1: Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold">Add a new team</h2>
              <button
                onClick={handleCloseModals}
                className="text-white hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Please enter a team name..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleCloseModals}
                  className="border-2 border-pink-600 text-pink-600 hover:bg-pink-50 px-6 py-2 rounded font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleOpenAssignModal}
                  disabled={!newTeamName.trim()}
                  className="bg-gray-300 hover:bg-green-600 hover:text-white disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-600 disabled:text-gray-400 px-6 py-2 rounded font-medium transition-colors"
                >
                  Select employees
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Assign Employees Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h2 className="text-xl font-bold">Assign employees to "{newTeamName}"</h2>
              <button
                onClick={handleCloseModals}
                className="text-white hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Group by existing teams */}
              {teams.map((team) => {
                const teamEmployees = allEmployees.filter((emp) => emp.currentTeam === team.name);
                if (teamEmployees.length === 0) return null;

                const teamSelectedCount = teamEmployees.filter((emp) =>
                  selectedEmployees.includes(emp.id)
                ).length;

                return (
                  <div key={team.name} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleGroup(team.name)}
                          className="text-pink-600 hover:text-pink-700"
                        >
                          <svg
                            className={`h-6 w-6 transform transition-transform ${
                              expandedGroups[team.name] ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <span className="font-semibold text-gray-900">{team.name}</span>
                        <span className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                          {teamSelectedCount}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => selectGroup(team.name)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Select group
                        </button>
                        <button
                          onClick={() => deselectGroup(team.name)}
                          className="text-gray-500 hover:text-gray-700 font-medium text-sm"
                        >
                          Deselect group
                        </button>
                      </div>
                    </div>

                    {expandedGroups[team.name] && (
                      <div className="grid grid-cols-2 gap-4">
                        {teamEmployees.map((employee) => (
                          <button
                            key={employee.id}
                            onClick={() => toggleEmployeeSelection(employee.id)}
                            className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                              selectedEmployees.includes(employee.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="font-semibold text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{employee.jobTitle}</div>
                            {selectedEmployees.includes(employee.id) && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* No group section */}
              {(() => {
                const noGroupEmployees = allEmployees.filter((emp) => !emp.currentTeam);
                if (noGroupEmployees.length === 0) return null;

                const noGroupSelectedCount = noGroupEmployees.filter((emp) =>
                  selectedEmployees.includes(emp.id)
                ).length;

                return (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleGroup("No group")}
                          className="text-pink-600 hover:text-pink-700"
                        >
                          <svg
                            className={`h-6 w-6 transform transition-transform ${
                              expandedGroups["No group"] ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <span className="font-semibold text-gray-900">No group</span>
                        <span className="bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                          {noGroupSelectedCount}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => selectGroup("No group")}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Select group
                        </button>
                        <button
                          onClick={() => deselectGroup("No group")}
                          className="text-gray-500 hover:text-gray-700 font-medium text-sm"
                        >
                          Deselect group
                        </button>
                      </div>
                    </div>

                    {expandedGroups["No group"] && (
                      <div className="grid grid-cols-2 gap-4">
                        {noGroupEmployees.map((employee) => (
                          <button
                            key={employee.id}
                            onClick={() => toggleEmployeeSelection(employee.id)}
                            className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                              selectedEmployees.includes(employee.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="font-semibold text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{employee.jobTitle}</div>
                            {selectedEmployees.includes(employee.id) && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setShowCreateModal(true);
                }}
                className="border-2 border-pink-600 text-pink-600 hover:bg-pink-50 px-6 py-2 rounded font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateTeam}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded font-medium transition-colors"
              >
                Save ({selectedEmployees.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
