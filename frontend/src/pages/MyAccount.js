import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MyAccount() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  
  const [profile, setProfile] = useState({});

  // Update profile with actual user data only
  useEffect(() => {
    if (user) {
      setProfile(user);
    }
  }, [user]);

  // handle profile picture change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, photo: imageUrl }));
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate to login even if logout fails
      navigate("/login");
    }
  };

  return (
    <div className="p-6">
      {/* Header row with title + buttons */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/editprofile")}
            className="text-sm border px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 shadow"
          >
            Edit
          </button>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="text-sm border px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging out...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <button className="px-4 py-2 border-b-2 border-green-600 font-medium text-gray-700">
          Profile
        </button>
      </div>

      {/* Profile Row */}
      <div className="bg-white shadow rounded-lg p-6 relative">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-12">
          {/* Profile Image */}
          <div className="flex flex-col ml-10 items-center">
            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-4xl overflow-hidden">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                "👤"
              )}
            </div>

            {/* Hidden input */}
            <input
              type="file"
              id="profileUpload"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />

            <button
              onClick={() => document.getElementById("profileUpload").click()}
              className="mt-2 text-sm border px-3 py-1 rounded bg-gray-50 hover:bg-gray-100"
            >
              Change
            </button>
          </div>

          {/* Name + Role */}
          <div className="flex-1 ml-20">
            <h2 className="text-xl font-semibold">
              {profile.firstName ? `${profile.firstName} ${profile.lastName || ''}` : 'Loading...'}
            </h2>
            <p className="text-gray-600">{profile.jobTitle || 'No job title specified'}</p>
            <p className="text-green-600 text-sm mt-1">
              {profile.company || 'No company specified'} • {profile.staffType || 'Staff'} Staff
            </p>

            {/* Bio */}
            <div className="mt-6">
              <p className="text-gray-500 text-sm font-medium">Bio</p>
              <p className="text-sm">{profile.bio || "No bio information available"}</p>
            </div>
          </div>

          {/* Details Section */}
          <div className="text-sm space-y-4 w-full md:w-1/3 md:ml-12">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Email</span>
              <span>
                {profile.email || "Not provided"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Mobile</span>
              <span className="text-gray-500">
                {profile.mobile || "Not provided"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-700">D.O.B.</span>
              <span>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB') : "Not provided"}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Department</span>
              <span>{profile.department || "Not specified"}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Staff Type</span>
              <span>{profile.staffType || "Not specified"}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Address</span>
              <span>{profile.address?.country || "Not provided"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
