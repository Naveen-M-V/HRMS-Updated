import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfiles } from "../context/ProfileContext";
import { getImageUrl, API_BASE_URL } from "../utils/config";

export default function MyAccount() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const { uploadProfilePicture } = useProfiles();

  const [profile, setProfile] = useState({});
  const [savingImage, setSavingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear any cached errors on component mount
  useEffect(() => {
    setError(null);
  }, []);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token || !user) {
        setLoading(false);
        setError('Authentication required. Please login again.');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
        return;
      }

      // For admin users, validate we have necessary user data
      if (user.role === 'admin' && !user.email) {
        setLoading(false);
        setError('User session invalid. Please login again.');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/my-profile`, {
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
        
        // Set profile data
        if (profileData) {
          setProfile({
            ...profileData,
            fullName: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
            jobTitle: Array.isArray(profileData.jobTitle) ? profileData.jobTitle.join(', ') : profileData.jobTitle || '',
            address: profileData.address || {},
            emergencyContact: profileData.emergencyContact || {},
          });
        } else {
          throw new Error('No profile data received from server');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        
        // Handle specific error cases
        if (err.message.includes('Authentication required') || err.message.includes('401')) {
          setError('Please login again to view your profile.');
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 2000);
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('Unable to connect to server. Please check your connection.');
        } else {
          setError(err.message);
        }
        
        // For admin users, fallback to user data from auth context
        if (user && user.role === 'admin') {
          setProfile({
            ...user,
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            jobTitle: user.jobTitle || 'Administrator',
            address: user.address || {},
            emergencyContact: user.emergencyContact || {},
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && user.email) {
      fetchUserProfile();
    }
  }, [user, logout, navigate]);

  // Handle profile picture change - persist to backend
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check for user authentication
    const token = localStorage.getItem('auth_token');
    if (!token || !user) {
      alert('Authentication required. Please login again.');
      logout();
      navigate('/login');
      return;
    }

    // Validate that we have the required user data for admin
    if (user.role === 'admin' && !user.email) {
      alert('User session invalid. Please login again.');
      logout();
      navigate('/login');
      return;
    }

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size should be less than 5MB');
      return;
    }

    try {
      setSavingImage(true);
      
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch(`${API_BASE_URL}/admin/upload-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }

      const data = await response.json();
      setProfile(prev => ({ ...prev, profilePicture: data.profilePicture }));
      alert("Profile picture updated successfully!");
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      
      // Handle specific error cases
      if (err.message.includes('Authentication required') || err.message.includes('User session invalid')) {
        logout();
        navigate('/login');
      } else {
        alert("Failed to upload profile picture: " + err.message);
      }
    } finally {
      setSavingImage(false);
      e.target.value = "";
    }
  };

  // Handle edit navigation
  const handleEditProfile = () => {
    // Check if we have a valid token and user
    const token = localStorage.getItem('auth_token');
    if (!token || !user) {
      alert('Authentication required. Please login again.');
      logout();
      navigate('/login');
      return;
    }

    // For admin users, ensure we have the necessary user data
    if (user.role === 'admin' && !user.email) {
      alert('User session invalid. Please login again.');
      logout();
      navigate('/login');
      return;
    }

    // Navigate to the comprehensive edit page
    navigate('/admin/edit-profile');
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
            onClick={handleEditProfile}
            disabled={loading || !user}
            className="text-sm border px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <p className="text-gray-600">{profile.jobTitle || 'Administrator'}</p>
              <p className="text-green-600 text-sm mt-1">
                {profile.company || 'Talent Shield'} • {profile.staffType || 'Admin'} Staff
              </p>

              {/* Bio */}
              <div className="mt-6">
                <p className="text-gray-500 text-sm font-medium">Bio</p>
                <p className="text-sm">{profile.bio || "No bio information available"}</p>
              </div>
            </div>

            {/* Details Section */}
            <div className="text-sm space-y-4 w-full md:w-1/2">
              {/* Personal Information */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">Personal Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Email</span>
                    <span className="text-right">{profile.email || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Mobile</span>
                    <span className="text-right">{profile.mobile || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Date of Birth</span>
                    <span className="text-right">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB') : "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Gender</span>
                    <span className="text-right">{profile.gender || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Nationality</span>
                    <span className="text-right">{profile.nationality || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Location</span>
                    <span className="text-right">{profile.location || "Not specified"}</span>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">Professional Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Department</span>
                    <span className="text-right">{profile.department || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Staff Type</span>
                    <span className="text-right">{profile.staffType || "Admin"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Company</span>
                    <span className="text-right">{profile.company || "Talent Shield"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Role</span>
                    <span className="text-right text-green-600 font-medium">Administrator</span>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {(profile.address?.line1 || profile.address?.city || profile.address?.country) && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">Address</h3>
                  <div className="space-y-2">
                    {profile.address?.line1 && (
                      <div className="text-gray-700">{profile.address.line1}</div>
                    )}
                    {profile.address?.line2 && (
                      <div className="text-gray-700">{profile.address.line2}</div>
                    )}
                    {(profile.address?.city || profile.address?.postCode) && (
                      <div className="text-gray-700">
                        {profile.address?.city}{profile.address?.city && profile.address?.postCode && ', '}{profile.address?.postCode}
                      </div>
                    )}
                    {profile.address?.country && (
                      <div className="text-gray-700">{profile.address.country}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {(profile.emergencyContact?.name || profile.emergencyContact?.phone) && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-1">Emergency Contact</h3>
                  <div className="space-y-3">
                    {profile.emergencyContact?.name && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Name</span>
                        <span className="text-right">{profile.emergencyContact.name}</span>
                      </div>
                    )}
                    {profile.emergencyContact?.relationship && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Relationship</span>
                        <span className="text-right">{profile.emergencyContact.relationship}</span>
                      </div>
                    )}
                    {profile.emergencyContact?.phone && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Phone</span>
                        <span className="text-right">{profile.emergencyContact.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
