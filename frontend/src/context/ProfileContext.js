import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

// Use API base URL from .env with a localhost fallback for dev
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5003";

export const useProfiles = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfiles must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch profiles with caching + optional pagination
  const fetchProfiles = async (forceRefresh = false, usePagination = false, page = 1, limit = 20) => {
    setLoading(true);
    try {
      console.log('Fetching profiles from API');

      if (!forceRefresh && !usePagination) {
        const cachedProfiles = localStorage.getItem('profiles_cache_optimized');
        const cacheTime = localStorage.getItem('profiles_cache_time');
        const cacheAge = Date.now() - parseInt(cacheTime || '0');

        if (cachedProfiles && cacheAge < 5 * 60 * 1000) {
          console.log('Using cached profiles data');
          setProfiles(JSON.parse(cachedProfiles));
          setError(null);
          setLoading(false);
          return;
        }
      }

      const endpoint = usePagination
        ? `/api/profiles/paginated?page=${page}&limit=${limit}`
        : `/api/profiles`;

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5003';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        credentials: 'include',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const profilesData = usePagination ? data.profiles : data;

        setProfiles(profilesData);
        setError(null);

        if (!usePagination) {
          localStorage.setItem('profiles_cache_optimized', JSON.stringify(profilesData));
          localStorage.setItem('profiles_cache_time', Date.now().toString());
        }

        return usePagination ? data : profilesData;
      } else {
        setError(`Failed to fetch profiles: ${response.status}`);
      }
    } catch (err) {
      setError('Failed to fetch profiles');
      console.error('Error fetching profiles:', err);

      const cachedProfiles = localStorage.getItem('profiles_cache_optimized');
      if (cachedProfiles) {
        setProfiles(JSON.parse(cachedProfiles));
      } else {
        setProfiles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (profileId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProfiles(prev => prev.filter(p => p._id !== profileId));
        localStorage.removeItem('profiles_cache_optimized');
        localStorage.removeItem('profiles_cache_time');
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete profile');
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
      throw err;
    }
  };

  const refreshProfiles = async () => {
    await fetchProfiles(true);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const addProfile = async (newProfile) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5003';
      const response = await fetch(`${apiUrl}/api/profiles`, {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(newProfile),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Failed to create profile: ${response.status}`);
      }

      setProfiles(prev => [data, ...prev]);
      // Clear the cache to ensure fresh data on next fetch
      localStorage.removeItem('profiles_cache_optimized');
      localStorage.removeItem('profiles_cache_time');

      const updatedProfiles = [data, ...profiles];
      localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
      localStorage.setItem('profiles_cache_time', Date.now().toString());

      return data;
    } catch (err) {
      setError('Failed to create profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (id, updatedProfile) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`Failed to update profile: ${response.status}`);

      const data = await response.json();
      setProfiles(prev => prev.map(profile => profile._id === id ? data : profile));

      const updatedProfiles = profiles.map(profile => profile._id === id ? data : profile);
      localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
      localStorage.setItem('profiles_cache_time', Date.now().toString());

      return data;
    } catch (err) {
      setError('Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProfileById = (id) => profiles.find(profile => profile._id === id);

  const fetchMyProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/my-profile`, { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch profile' }));
        throw new Error(errorData.message || `Failed to fetch profile: ${response.status}`);
      }

      const profile = await response.json();
      return profile;
    } catch (err) {
      console.error('Error fetching my profile:', err);
      throw err;
    }
  };

  const fetchProfileById = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/${id}`, { credentials: 'include' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch profile' }));
        throw new Error(errorData.message || `Failed to fetch profile: ${response.status}`);
      }

      const profile = await response.json().catch(() => {
        throw new Error('Invalid JSON response from server');
      });

      const updatedProfiles = profiles.map(p => p._id === id ? { ...p, ...profile } : p);
      setProfiles(updatedProfiles);
      localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
      localStorage.setItem('profiles_cache_time', Date.now().toString());
      return profile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      throw err;
    }
  };

  const fetchCompleteProfileById = async (id) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/profiles/${id}/complete`, { 
        credentials: 'include',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (response.ok) return await response.json();
      throw new Error(`Failed to fetch complete profile: ${response.status}`);
    } catch (err) {
      console.error('Error fetching complete profile:', err);
      throw err;
    }
  };

  const uploadProfilePicture = async (id, file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/profiles/${id}/upload-picture`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`Failed to upload profile picture: ${response.status}`);

      const data = await response.json();

      const updatedProfiles = profiles.map(profile =>
        profile._id === id ? { ...profile, profilePicture: data.profilePicture } : profile
      );
      setProfiles(updatedProfiles);
      localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
      localStorage.setItem('profiles_cache_time', Date.now().toString());

      return data.profilePicture;
    } catch (err) {
      setError('Failed to upload profile picture');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const [userProfile, setUserProfile] = useState({});

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        // For admin users, fetch their profile from the API
        if (user.role === 'admin') {
          try {
            const adminProfile = await fetchMyProfile();
            setUserProfile({
              firstName: adminProfile.firstName || '',
              lastName: adminProfile.lastName || '',
              email: adminProfile.email || '',
              company: adminProfile.company || '',
              jobTitle: adminProfile.jobTitle || '',
              mobile: adminProfile.mobile || '',
              dateOfBirth: adminProfile.dateOfBirth || '',
              bio: adminProfile.bio || '',
              language: adminProfile.language || 'English',
              address: adminProfile.address || {},
              staffType: adminProfile.staffType || 'Admin',
              role: adminProfile.role || 'admin',
              skillkoId: adminProfile.skillkoId || '',
              department: adminProfile.department || '',
              jobLevel: adminProfile.jobLevel || '',
              profilePicture: adminProfile.profilePicture || '',
              _id: adminProfile._id || adminProfile.id
            });
          } catch (error) {
            console.error('Failed to load admin profile:', error);
            // Fallback to user context data
            setUserProfile({
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              role: user.role || 'admin',
              _id: user._id || user.id || user.userId
            });
          }
        } else {
          // For regular users, use the existing logic
          setUserProfile({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            company: user.company || '',
            jobTitle: user.jobTitle || '',
            mobile: user.mobile || '',
            dateOfBirth: user.dateOfBirth || '',
            bio: user.bio || '',
            language: user.language || 'English',
            address: user.address || {},
            staffType: user.staffType || 'Staff',
            role: user.role || '',
            skillkoId: user.skillkoId || '',
            department: user.department || '',
            jobLevel: user.jobLevel || '',
            profilePicture: user.profilePicture || '',
            _id: user._id || user.profileId
          });
        }
      }
    };

    loadUserProfile();
  }, [user]);

  const updateUserProfile = async (profileData) => {
    setLoading(true);
    try {
      const updatedData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email || profileData.username,
        mobile: profileData.mobile,
        dateOfBirth: profileData.dob,
        gender: profileData.gender,
        company: profileData.company,
        jobTitle: Array.isArray(profileData.jobTitle) ? profileData.jobTitle : [profileData.jobTitle],
        jobLevel: profileData.jobLevel,
        language: profileData.language,
        staffType: profileData.staffType,
        nationality: profileData.nationality,
        bio: profileData.bio,
        otherInformation: profileData.otherInfo,
        address: {
          line1: profileData.addressLine1,
          line2: profileData.addressLine2,
          city: profileData.city,
          postCode: profileData.postCode,
          country: profileData.country
        },
        emergencyContact: {
          name: profileData.emergencyName,
          relationship: profileData.emergencyRelationship,
          phone: profileData.emergencyPhone
        }
      };

      const token = localStorage.getItem('auth_token');
      
      // For admin users, we need to create an admin profile update endpoint
      // For now, let's create a basic admin profile update
      if (user.role === 'admin') {
        // For admin users, we'll update the User collection instead of Profile collection
        const adminUpdateData = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email || profileData.username,
          mobile: profileData.mobile,
          bio: profileData.bio,
          // Add other admin-specific fields as needed
        };
        
        const response = await fetch('/api/admin/update-profile', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(adminUpdateData),
          credentials: 'include'
        });

        if (!response.ok) {
          // If admin endpoint doesn't exist, show a message for now
          throw new Error('Admin profile editing is not yet implemented. Please contact system administrator.');
        }

        const data = await response.json();
        setUserProfile(prev => ({ ...prev, ...data }));
        return { success: true, data };
      } else {
        // For regular users, use the existing profile update endpoint
        const response = await fetch(`${API_BASE_URL}/api/profiles/${user._id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(updatedData),
          credentials: 'include'
        });

        if (!response.ok) throw new Error(`Failed to update profile: ${response.status}`);

        const data = await response.json();
        setUserProfile(data);
        return { success: true, data };
      }
    } catch (err) {
      setError('Failed to update profile: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    profiles,
    loading,
    error,
    addProfile,
    updateProfile,
    deleteProfile,
    refreshProfiles,
    fetchProfiles,
    getProfileById,
    fetchMyProfile,
    fetchProfileById,
    fetchCompleteProfileById,
    uploadProfilePicture,
    userProfile,
    updateUserProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
