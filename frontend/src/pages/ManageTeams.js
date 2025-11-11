import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function ManageTeams() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");

  // Mock data - replace with actual API call
  const [teams, setTeams] = useState([
    {
      id: 1,
      name: "Office",
      description: "Main office team",
      memberCount: 3,
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      name: "Operations",
      description: "Operations department",
      memberCount: 5,
      createdAt: "2024-01-20",
    },
    {
      id: 3,
      name: "Management",
      description: "Management team",
      memberCount: 2,
      createdAt: "2024-02-01",
    },
  ]);

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      const newTeam = {
        id: teams.length + 1,
        name: newTeamName,
        description: newTeamDescription,
        memberCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setTeams([...teams, newTeam]);
      setNewTeamName("");
      setNewTeamDescription("");
      setShowCreateModal(false);
    }
  };

  const handleDeleteTeam = (teamId) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      setTeams(teams.filter((team) => team.id !== teamId));
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Teams</h1>
            <p className="text-gray-600 mt-1">
              Create and manage your organization's teams
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create Team
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Team Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {team.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {team.memberCount} members
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditTeam(team.id)}
                  className="p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                  title="Edit team"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete team"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Team Description */}
            <p className="text-sm text-gray-600 mb-4">{team.description}</p>

            {/* Team Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                Created: {new Date(team.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => navigate(`/employee-hub?team=${team.name}`)}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                View Members
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No teams found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? "Try adjusting your search"
              : "Get started by creating your first team"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Create Team
            </button>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Create New Team
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="Enter team description"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim()}
                className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Create Team
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTeamName("");
                  setNewTeamDescription("");
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
