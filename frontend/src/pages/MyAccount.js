import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfiles } from "../context/ProfileContext";
import { getImageUrl } from "../utils/config";

export default function MyAccount() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const { uploadProfilePicture, getProfileById } = useProfiles();

  const [profile, setProfile] = useState({});
  const [savingImage, setSavingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Authentication required');
        }
        const response = await fetch('https://talentshield.co.uk/api/my-profile', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch profile data');
        }
        
        const profileData = data;
        console.log('Profile data loaded:', profileData);
        
        // If we have a valid profile data
        if (profileData) {
          setProfile({
            ...user,
            ...profileData,
            fullName: `${profileData.firstName || user.firstName || ''} ${profileData.lastName || user.lastName || ''}`.trim(),
            jobTitle: Array.isArray(profileData.jobTitle) ? profileData.jobTitle.join(', ') : profileData.jobTitle || user.jobTitle,
            address: profileData.address || user.address || {},
            emergencyContact: profileData.emergencyContact || user.emergencyContact || {},
          });
        } else {
          // If we don't have profile data, use user data
          setProfile({
            ...user,
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            jobTitle: user.jobTitle || '',
            address: user.address || {},
            emergencyContact: user.emergencyContact || {},
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
        // Set profile with user data even if fetch fails
        setProfile({
          ...user,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Handle profile picture change - persist to backend
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    const profileId = profile?._id || user?._id;
    
    if (!file || !profileId) {
      console.error('Missing file or profile ID:', { file: !!file, profileId });
      alert('Unable to upload: Missing profile information. Please try refreshing the page.');
      return;
    }

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit (matching backend)
      alert('File size should be less than 10MB');
      return;
    }

    try {
      setSavingImage(true);
      console.log('Uploading profile picture for profile ID:', profileId);

      // Use the context's uploadProfilePicture function
      const profilePicturePath = await uploadProfilePicture(profileId, file);
      console.log('Profile picture uploaded:', profilePicturePath);

      // Update local profile state with new picture URL
      setProfile(prev => ({
        ...prev,
        profilePicture: profilePicturePath || `/api/profiles/${profileId}/picture`
      }));

      alert("Profile picture updated successfully!");
      
      // Force page refresh after 500ms to show new image
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      alert("Failed to upload profile picture: " + (err.message || "Please try again."));
    } finally {
      setSavingImage(false);
      e.target.value = "";
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading profile: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header row with title + buttons */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (loading || !user) {
                return;
              }
                navigate('/dashboard/admin-details');
            }}
            className="text-sm border px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={loading || !user}
            title={loading ? 'Loading your profile...' : !user ? 'Please log in to edit your profile' : 'Edit your profile'}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            disabled={authLoading}
            className="text-sm border px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Logging out...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
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
      {loading ? (
        <div className="bg-white shadow rounded-lg p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : error ? (
        <div className="bg-white shadow rounded-lg p-6 text-center text-red-600">
          {error}
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm border px-3 py-1 rounded bg-red-50 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-12">
            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-4xl overflow-hidden relative">
                {savingImage && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
                {profile.profilePicture ? (
                  <img
                    src={`${getImageUrl(profile.profilePicture)}?t=${Date.now()}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "👤"
                )}
              </div>

              <input
                type="file"
                id="profileUpload"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />

              <button
                onClick={() => !savingImage && document.getElementById("profileUpload").click()}
                className="mt-2 text-sm border px-3 py-1 rounded bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                disabled={savingImage}
              >
                {savingImage ? "Saving..." : "Change"}
              </button>
            </div>

            {/* Name + Role */}
            <div className="flex-1">
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
            <div className="text-sm space-y-4 w-full md:w-1/3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Email</span>
                <span>{profile.email || "Not provided"}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Mobile</span>
                <span className="text-gray-500">{profile.mobile || "Not provided"}</span>
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
      )}
    </div>
  );
}
