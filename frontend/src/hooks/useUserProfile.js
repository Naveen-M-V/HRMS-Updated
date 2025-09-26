import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const getApiUrl = () => {
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:5003';
};

const API_BASE_URL = getApiUrl();

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch complete profile data from Profile collection
      const response = await axios.get(
        `${API_BASE_URL}/api/profiles/by-email/${user.email}`,
        {
          withCredentials: true,
          timeout: 10000
        }
      );
      
      if (response.data) {
        // Merge user data with profile data
        const completeProfile = {
          ...user,
          ...response.data,
          // Ensure we keep the user ID from auth
          _id: user._id || user.id,
          id: user._id || user.id,
        };
        
        setProfile(completeProfile);
        return completeProfile;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.message);
      // Fall back to basic user data
      setProfile(user);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setProfile(null);
    }
  }, [user?.email]);

  const updateProfile = async (updates) => {
    if (!profile?._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/profiles/${profile._id}`,
        updates,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (response.data) {
        const updatedProfile = { ...profile, ...response.data };
        setProfile(updatedProfile);
        return updatedProfile;
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchUserProfile,
    updateProfile
  };
};
