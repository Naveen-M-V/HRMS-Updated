import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function ManageTeams() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  // Mock data - replace with actual API call
  const [teams, setTeams] = useState([
    {
      id: 1,
      name: "Office",
      initials: "O",
      memberCount: 3,
      color: "#3B82F6",
    },
    {
      id: 2,
      name: "Site Work",
      initials: "SW",
      memberCount: 2,
      color: "#3B82F6",
    },
    {
      id: 3,
      name: "WES",
      initials: "W",
      memberCount: 2,
      color: "#3B82F6",
    },
    {
      id: 4,
      name: "Work From Home",
      initials: "WFH",
      memberCount: 1,
      color: "#3B82F6",
    },
  ]);

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      // Generate initials from team name
      const words = newTeamName.trim().split(" ");
      const initials = words.length > 1 
        ? words.map(w => w[0]).join("").toUpperCase()
        : newTeamName.substring(0, 2).toUpperCase();
      
      const newTeam = {
        id: teams.length + 1,
        name: newTeamName,
        initials: initials,
        memberCount: 0,
        color: "#3B82F6",
      };
      setTeams([...teams, newTeam]);
      setNewTeamName("");
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
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors mb-6"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
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
