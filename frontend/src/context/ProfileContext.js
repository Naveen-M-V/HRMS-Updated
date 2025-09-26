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

  // Fetch profiles from API with optimization and persistence
  const fetchProfiles = async (forceRefresh = false, usePagination = false, page = 1, limit = 20) => {
    setLoading(true);
    try {
      console.log('Fetching profiles from API (optimized)');
      
      // Check cache first unless force refresh
      if (!forceRefresh && !usePagination) {
        const cachedProfiles = localStorage.getItem('profiles_cache_optimized');
        const cacheTime = localStorage.getItem('profiles_cache_time');
        const cacheAge = Date.now() - parseInt(cacheTime || '0');
        
        // Use cache if it's less than 5 minutes old
        if (cachedProfiles && cacheAge < 5 * 60 * 1000) {
          console.log('Using cached profiles data (optimized)');
          setProfiles(JSON.parse(cachedProfiles));
          setError(null);
          setLoading(false);
          return;
        }
      }
      
      // Choose endpoint based on pagination
      const endpoint = usePagination 
        ? `/api/profiles/paginated?page=${page}&limit=${limit}`
        : '/api/profiles'; // Optimized endpoint (excludes binary data)
      
      const response = await fetch(`${getApiUrl()}${endpoint}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const profilesData = usePagination ? data.profiles : data;
        
        setProfiles(profilesData);
        setError(null);
        
        // Cache the optimized data for persistence (only for non-paginated)
        if (!usePagination) {
          localStorage.setItem('profiles_cache_optimized', JSON.stringify(profilesData));
          localStorage.setItem('profiles_cache_time', Date.now().toString());
          console.log(`Profiles cached successfully (${profilesData.length} profiles, optimized)`);
        }
        
        // Log data size reduction
        const dataSize = JSON.stringify(profilesData).length;
        console.log(`Fetched ${profilesData.length} profiles, data size: ${(dataSize / 1024 / 1024).toFixed(2)}MB`);
        
        return usePagination ? data : profilesData;
      } else {
        console.error('Failed to fetch profiles:', response.status, response.statusText);
        setError(`Failed to fetch profiles: ${response.status}`);
      }
    } catch (error) {
      setError('Failed to fetch profiles');
      console.error('Error fetching profiles:', error);
      
      // Try to use cached data as fallback
      const cachedProfiles = localStorage.getItem('profiles_cache_optimized');
      if (cachedProfiles) {
        console.log('Using cached profiles as fallback (optimized)');
        setProfiles(JSON.parse(cachedProfiles));
      } else {
        setProfiles([]);
      }
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
    await fetchProfiles(true); // Force refresh
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
      
      // Update optimized cache with new data
      const updatedProfiles = [data, ...profiles];
      localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
      localStorage.setItem('profiles_cache_time', Date.now().toString());
      
      console.log('Profile added to optimized cache successfully');
      
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
      const response = await fetch(`${getApiUrl()}/api/profiles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }
      
      const data = await response.json();
      setProfiles(prev => 
        prev.map(profile => profile._id === id ? data : profile)
      );
      
      // Update optimized cache
      const updatedProfiles = profiles.map(profile => profile._id === id ? data : profile);
      localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
      localStorage.setItem('profiles_cache_time', Date.now().toString());
      
      setError(null);
      return data;
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

  // Fetch individual profile with complete data (when needed)
  const fetchProfileById = async (id) => {
    try {
      console.log('ProfileContext: Fetching individual profile for ID:', id);
      const response = await fetch(`${getApiUrl()}/api/profiles/${id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const profile = await response.json();
        console.log('ProfileContext: Individual profile fetched:', {
          id: profile._id,
          vtid: profile.vtid,
          firstName: profile.firstName,
          lastName: profile.lastName
        });
        
        // Update the profile in the local state
        const updatedProfiles = profiles.map(p => p._id === id ? { ...p, ...profile } : p);
        setProfiles(updatedProfiles);
        
        // Update optimized cache with the new profile data
        localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
        localStorage.setItem('profiles_cache_time', Date.now().toString());
        console.log('ProfileContext: Profile updated in state and cache');
        
        return profile;
      } else {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching individual profile:', error);
      throw error;
    }
  };

  // Fetch profile with complete data including binary data (rarely used)
  const fetchCompleteProfileById = async (id) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/profiles/${id}/complete`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const profile = await response.json();
        return profile;
      } else {
        throw new Error(`Failed to fetch complete profile: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching complete profile:', error);
      throw error;
    }
  };

  const uploadProfilePicture = async (id, file) => {
    setLoading(true);
    console.log('📡 ProfileContext: Starting upload request...', { profileId: id, fileName: file.name });
    
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      console.log('🌐 ProfileContext: Sending request to server...');
      const response = await fetch(`${getApiUrl()}/api/profiles/${id}/upload-picture`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload profile picture: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 ProfileContext: Server response received:', data);
      
      // Update profile in state immediately
      const updatedProfiles = profiles.map(profile => 
        profile._id === id 
          ? { ...profile, profilePicture: data.profilePicture }
          : profile
      );
      setProfiles(updatedProfiles);
      
      // Update optimized cache immediately
      localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
      localStorage.setItem('profiles_cache_time', Date.now().toString());
      
      console.log('🔄 ProfileContext: Local state and cache updated');
      
      setError(null);
      console.log('✅ ProfileContext: Upload completed successfully');
      return data.profilePicture;
    } catch (err) {
      setError('Failed to upload profile picture');
      console.error('❌ ProfileContext: Upload error:', err);
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
