import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const getApiUrl = () => {
  // In development, use localhost URL
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In production, use the environment variable or fallback
  return process.env.REACT_APP_API_URL || 'http://localhost:5003';
};

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

  // Fetch profiles from API
  const fetchProfiles = async () => {
    setLoading(true);
    try {
      console.log('Fetching profiles from API');
      const response = await fetch(`${getApiUrl()}/api/profiles`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
        setError(null);
      } else {
        console.error('Failed to fetch profiles:', response.status, response.statusText);
        setError(`Failed to fetch profiles: ${response.status}`);
      }
    } catch (error) {
      setError('Failed to fetch profiles');
      console.error('Error fetching profiles:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Add delete profile function
  const deleteProfile = async (profileId) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/profiles/${profileId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove from local state
        setProfiles(prevProfiles => prevProfiles.filter(p => p._id !== profileId));
        
        // Clear cache to force refresh
        localStorage.removeItem('profiles_cache');
        localStorage.removeItem('profiles_cache_time');
        
        console.log('Profile deleted successfully');
      } else {
        throw new Error('Failed to delete profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  };

  // Refresh profiles function
  const refreshProfiles = async () => {
    await fetchProfiles();
  };
  // Load profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const addProfile = async (newProfile) => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProfile),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create profile: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Profile created successfully:', data);
      
      // Add to local state
      setProfiles(prev => [data, ...prev]);
      setError(null);
      
      // Clear cache to force refresh
      localStorage.removeItem('profiles_cache');
      localStorage.removeItem('profiles_cache_time');
      
      // Refresh profiles to ensure we have latest data
      await fetchProfiles();
      
      return data;
    } catch (err) {
      setError('Failed to create profile');
      console.error('Error creating profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (id, updatedProfile) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/profiles/${id}`, updatedProfile);
      setProfiles(prev => 
        prev.map(profile => profile._id === id ? response.data : profile)
      );
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const getProfileById = (id) => {
    return profiles.find(profile => profile._id === id);
  };

  const uploadProfilePicture = async (id, file) => {
    setLoading(true);
    console.log('📡 ProfileContext: Starting upload request...', { profileId: id, fileName: file.name });
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      console.log('🌐 ProfileContext: Sending request to server...');
      const response = await axios.post(`${API_BASE_URL}/profiles/${id}/upload-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('📥 ProfileContext: Server response received:', response.data);
      
      // Update profile in state immediately
      setProfiles(prev => 
        prev.map(profile => 
          profile._id === id 
            ? { ...profile, profilePicture: response.data.profilePicture }
            : profile
        )
      );
      
      console.log('🔄 ProfileContext: Local state updated');
      
      // Also refresh the entire profiles list to ensure persistence
      setTimeout(() => {
        console.log('🔄 ProfileContext: Refreshing profiles list for persistence...');
        fetchProfiles();
      }, 500);
      
      setError(null);
      console.log('✅ ProfileContext: Upload completed successfully');
      return response.data.profilePicture;
    } catch (err) {
      setError('Failed to upload profile picture');
      console.error('❌ ProfileContext: Upload error:', err);
      console.error('❌ ProfileContext: Error response:', err.response?.data);
      throw err;
    } finally {
      setLoading(false);
      console.log('🏁 ProfileContext: Upload process finished');
    }
  };

  // User profile management - no default hardcoded data
  const [userProfile, setUserProfile] = useState({});

  // Initialize user profile with actual user data when user changes
  useEffect(() => {
    if (user) {
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
        profilePicture: user.profilePicture || ''
      });
    }
  }, [user]);

  const updateUserProfile = async (profileData) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call when backend profile update endpoint is ready
      // const response = await axios.put('/api/users/profile', profileData);
      
      setUserProfile(prev => ({
        ...prev,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        name: `${profileData.firstName} ${profileData.lastName}`,
        role: `Account Administrator, ${profileData.jobTitle}, ${profileData.company}`,
        email: profileData.username,
        company: profileData.company,
        jobTitle: profileData.jobTitle,
        mobile: profileData.mobile,
        dob: profileData.dob,
        bio: profileData.bio,
        language: profileData.language,
        otherInfo: profileData.otherInfo
      }));
      
      console.log('Profile updated:', profileData);
      setError(null);
      return { success: true };
    } catch (err) {
      setError('Failed to update profile');
      return { success: false, error: err.message };
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
