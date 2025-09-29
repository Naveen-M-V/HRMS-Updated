import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfiles } from "../context/ProfileContext";
import { getImageUrl } from "../utils/config";

export default function MyAccount() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const { uploadProfilePicture } = useProfiles();

  const [profile, setProfile] = useState({});
  const [savingImage, setSavingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.email || !user?._id) {
        setLoading(false);
        setError('User session not found. Please login again.');
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 2000);
        return;
      }
      
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Authentication required');
        }
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5003';
        const response = await fetch(`${apiUrl}/api/my-profile`, {
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
    if (!file) return;

    // Check for user authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Authentication token not found. Please login again.');
      logout();
      navigate('/login');
      return;
    }

    if (!user?._id) {
      // Try to get user from local storage as backup
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser?._id) {
        alert('User session not found. Please login again.');
        logout();
        navigate('/login');
        return;
      }
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

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5003';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiUrl}/api/admin/upload-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const data = await response.json();
      setProfile(prev => ({ ...prev, profilePicture: data.profilePicture }));
      alert("Profile picture updated successfully!");
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setSavingImage(false);
      e.target.value = "";
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    // Check if we have a valid user session
    if (!user?._id) {
      alert('Session expired. Please login again.');
      logout();
      navigate('/login');
      return;
    }

    if (!isEditing) {
      // Entering edit mode - populate form with current profile data
      setEditForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        mobile: profile.mobile || '',
        bio: profile.bio || ''
      });
    }
    setIsEditing(!isEditing);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save profile changes
  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      if (!user?._id) {
        // Try to get user from local storage as backup
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser?._id) {
          throw new Error('User ID not found. Try logging in again');
        }
      }
      
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5003';
      
      const response = await fetch(`${apiUrl}/api/admin/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Update profile state with new data
      setProfile(prev => ({
        ...prev,
        ...editForm
      }));
      
      setIsEditing(false);
      alert('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
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
            onClick={handleEditToggle}
            disabled={loading || !user}
            className="text-sm border px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title={loading ? 'Loading your profile...' : !user ? 'Please log in to edit your profile' : (isEditing ? 'Cancel editing' : 'Edit your profile')}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditing ? "M6 18L18 6M6 6l12 12" : "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"} />
                </svg>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </>
            )}
          </button>
          {isEditing && (
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="text-sm border px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </button>
          )}
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
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={editForm.firstName || ''}
                        onChange={handleInputChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={editForm.lastName || ''}
                        onChange={handleInputChange}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email || ''}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={editForm.mobile || ''}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={editForm.bio || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">
                    {profile.firstName ? `${profile.firstName} ${profile.lastName || ''}` : 'Loading...'}
                  </h2>
                  <p className="text-gray-600">{profile.jobTitle || 'No job title specified'}</p>
                  <p className="text-green-600 text-sm mt-1">
                    {profile.company || 'No company specified'} • {profile.staffType || 'Admin'} Staff
                  </p>

                  {/* Bio */}
                  <div className="mt-6">
                    <p className="text-gray-500 text-sm font-medium">Bio</p>
                    <p className="text-sm">{profile.bio || "No bio information available"}</p>
                  </div>
                </>
              )}
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
