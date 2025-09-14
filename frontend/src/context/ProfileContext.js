import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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
      const response = await axios.get(`${API_BASE_URL}/profiles`);
      setProfiles(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch profiles');
      console.error('Error fetching profiles:', err);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Load profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const addProfile = async (newProfile) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/profiles`, newProfile);
      if (!response.data || typeof response.data !== 'object') {
        console.error("Unexpected response format:", response.data);
        throw new Error("Invalid response format from server");
      }
      setProfiles(prev => [response.data, ...prev]);
      setError(null);
      return response.data;
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

  const deleteProfile = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/profiles/${id}`);
      setProfiles(prev => prev.filter(profile => profile._id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete profile');
      console.error('Error deleting profile:', err);
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
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await axios.post(`${API_BASE_URL}/profiles/${id}/upload-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update profile in state
      setProfiles(prev => 
        prev.map(profile => 
          profile._id === id 
            ? { ...profile, profilePicture: response.data.profilePicture }
            : profile
        )
      );
      
      setError(null);
      return response.data.profilePicture;
    } catch (err) {
      setError('Failed to upload profile picture');
      throw err;
    } finally {
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  const value = {
    profiles,
    userProfile,
    loading,
    error,
    addProfile,
    updateProfile,
    deleteProfile,
    getProfileById,
    uploadProfilePicture,
    fetchProfiles,
    updateUserProfile
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
