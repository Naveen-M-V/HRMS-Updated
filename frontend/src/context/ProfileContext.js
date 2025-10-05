import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

// Use API base URL from .env with a localhost fallback for dev
// Try multiple possible API endpoints
const getApiUrl = () => {
  // First try environment variables
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // For production, try different possible endpoints
  if (window.location.hostname === 'talentshield.co.uk') {
    // Try the direct backend port first
    return 'https://talentshield.co.uk:5003';
  }
  
  // Default fallback
  return 'http://localhost:5003';
};

const API_BASE_URL = getApiUrl();

export const useProfiles = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfiles must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [Profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { User } = useAuth();

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
          console.log('Using cached Profiles data');
          setProfiles(JSON.parse(cachedProfiles));
          setError(null);
          setLoading(false);
          return;
        }
      }

      const endpoint = usePagination
        ? `/api/Profiles/paginated?page=${page}&limit=${limit}`
        : `/api/Profiles`;

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`https://talentshield.co.uk${endpoint}`, {
        credentials: 'include',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const profilesData = usePagination ? data.Profiles : data;

        setProfiles(profilesData);
        setError(null);

        if (!usePagination) {
          localStorage.setItem('profiles_cache_optimized', JSON.stringify(profilesData));
          localStorage.setItem('profiles_cache_time', Date.now().toString());
        }

        return usePagination ? data : profilesData;
      } else {
        setError(`Failed to fetch Profiles: ${response.status}`);
      }
    } catch (err) {
      setError('Failed to fetch Profiles');
      console.error('Error fetching Profiles:', err);

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
    const possibleUrls = [
      'https://talentshield.co.uk:5003',
      'https://talentshield.co.uk',
      'http://localhost:5003'
    ];
    
    const token = localStorage.getItem('auth_token');
    console.log('DeleteProfile - Profile ID:', profileId);
    console.log('DeleteProfile - Token exists:', !!token);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    let lastError = null;
    
    // Try each possible API URL
    for (let i = 0; i < possibleUrls.length; i++) {
      const apiUrl = possibleUrls[i];
      console.log(`DeleteProfile - Trying API URL ${i + 1}/${possibleUrls.length}:`, apiUrl);
      
      try {
        const response = await fetch(`${apiUrl}/api/Profiles/${profileId}`, {
          method: 'DELETE',
          headers: headers,
          credentials: 'include'
        });

        console.log('DeleteProfile - Response status:', response.status);
        console.log('DeleteProfile - Response headers:', response.headers.get('content-type'));

        if (response.ok) {
          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setProfiles(prev => prev.filter(p => p._id !== profileId));
            localStorage.removeItem('profiles_cache_optimized');
            localStorage.removeItem('profiles_cache_time');
            console.log(`DeleteProfile - Success with URL: ${apiUrl}`);
            return data;
          } else {
            // If not JSON, treat as success but return basic response
            setProfiles(prev => prev.filter(p => p._id !== profileId));
            localStorage.removeItem('profiles_cache_optimized');
            localStorage.removeItem('profiles_cache_time');
            console.log(`DeleteProfile - Success (non-JSON) with URL: ${apiUrl}`);
            return { message: 'Profile deleted successfully' };
          }
        } else {
          // This URL failed, try next one
          const textResponse = await response.text();
          console.log(`DeleteProfile - Failed with URL ${apiUrl}, status: ${response.status}, response: ${textResponse.substring(0, 200)}`);
          lastError = new Error(`Server error (${response.status})`);
          continue;
        }
      } catch (err) {
        console.log(`DeleteProfile - Error with URL ${apiUrl}:`, err.message);
        lastError = err;
        continue;
      }
    }
    
    // If we get here, all URLs failed
    console.error('DeleteProfile - All API URLs failed');
    throw lastError || new Error('Failed to Delete Profile - all API endpoints unreachable');
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

      const response = await fetch('https://talentshield.co.uk/api/Profiles', {
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
        throw new Error(data.message || `Failed to Create Profile: ${response.status}`);
      }

      setProfiles(prev => [data, ...prev]);
      // Clear the cache to ensure fresh data on next fetch
      localStorage.removeItem('profiles_cache_optimized');
      localStorage.removeItem('profiles_cache_time');

      const updatedProfiles = [data, ...Profiles];
      localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
      localStorage.setItem('profiles_cache_time', Date.now().toString());

      return data;
    } catch (err) {
      setError('Failed to Create Profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (id, updatedProfile) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/Profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`Failed to update Profile: ${response.status}`);

      const data = await response.json();
      setProfiles(prev => prev.map(profile => profile._id === id ? data : profile));

      const updatedProfiles = Profiles.map(profile => profile._id === id ? data : profile);
      localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
      localStorage.setItem('profiles_cache_time', Date.now().toString());

      return data;
    } catch (err) {
      setError('Failed to update Profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProfileById = (id) => Profiles.find(profile => profile._id === id);

  const fetchMyProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/my-Profile`, { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch Profile' }));
        throw new Error(errorData.message || `Failed to fetch Profile: ${response.status}`);
      }

      const profile = await response.json();
      return profile;
    } catch (err) {
      console.error('Error fetching my Profile:', err);
      throw err;
    }
  };

  const fetchProfileById = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/Profiles/${id}`, { credentials: 'include' });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch Profile' }));
        throw new Error(errorData.message || `Failed to fetch Profile: ${response.status}`);
      }

      const profile = await response.json().catch(() => {
        throw new Error('Invalid JSON response from server');
      });

      const updatedProfiles = Profiles.map(p => p._id === id ? { ...p, ...Profile } : p);
      setProfiles(updatedProfiles);
      localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
      localStorage.setItem('profiles_cache_time', Date.now().toString());
      return Profile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      throw err;
    }
  };

  const fetchCompleteProfileById = async (id) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/Profiles/${id}/complete`, { 
        credentials: 'include',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (response.ok) return await response.json();
      throw new Error(`Failed to fetch complete Profile: ${response.status}`);
    } catch (err) {
      console.error('Error fetching complete Profile:', err);
      throw err;
    }
  };

  const uploadProfilePicture = async (id, file) => {
    // Use environment API URL or fallback to relative path for production
    const getApiUrl = () => {
      if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
      }
      // In production with nginx, use relative path
      return '';
    };
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = getApiUrl();
      
      console.log('UploadProfilePicture - Profile ID:', id);
      console.log('UploadProfilePicture - File:', file.name, file.size);
      console.log('UploadProfilePicture - Token exists:', !!token);
      console.log('UploadProfilePicture - Using API URL:', apiUrl || '(relative path)');
      
      try {
        const formData = new FormData();
        formData.append('profilePicture', file);

        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${apiUrl}/api/Profiles/${id}/upload-picture`, {
          method: 'POST',
          headers: headers,
          body: formData,
          credentials: 'include'
        });

        console.log('UploadProfilePicture - Response status:', response.status);
        console.log('UploadProfilePicture - Response headers:', response.headers.get('content-type'));

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            
            const updatedProfiles = Profiles.map(Profile =>
              profile._id === id ? { ...profile, profilePicture: data.profilePicture } : profile
            );
            setProfiles(updatedProfiles);
            localStorage.setItem('profiles_cache_optimized', JSON.stringify(updatedProfiles));
            localStorage.setItem('profiles_cache_time', Date.now().toString());

            console.log(`UploadProfilePicture - Success with URL: ${apiUrl}`);
            return data.profilePicture;
          } else {
            console.log(`UploadProfilePicture - Non-JSON response with URL ${apiUrl}`);
            throw new Error('Server returned non-JSON response');
          }
        } else {
          const textResponse = await response.text();
          console.log(`UploadProfilePicture - Failed with URL ${apiUrl}, status: ${response.status}, response: ${textResponse.substring(0, 200)}`);
          throw new Error(`Server error (${response.status}): ${textResponse.substring(0, 100)}`);
        }
      } catch (err) {
        console.error('UploadProfilePicture - Error:', err);
        setError('Failed to upload Profile picture: ' + err.message);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }

  const [userProfile, setUserProfile] = useState({});

  useEffect(() => {
    if (User) {
      setUserProfile({
        firstName: user.firstName || '',
        lastName: User.lastName || '',
        Email: User.email || '',
        company: User.company || '',
        jobTitle: User.jobTitle || '',
        mobile: User.mobile || '',
        dateOfBirth: User.dateOfBirth || '',
        bio: User.bio || '',
        language: User.language || 'English',
        address: User.address || {},
        staffType: user.staffType || 'Staff',
        role: User.role || '',
        skillkoId: User.skillkoId || '',
        department: User.department || '',
        jobLevel: User.jobLevel || '',
        profilePicture: User.profilePicture || ''
      });
    }
  }, [User]);

  const updateUserProfile = async (profileData) => {
    setLoading(true);
    try {
      const updatedData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        Email: profileData.email || profileData.username,
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
      const response = await fetch(`${API_BASE_URL}/api/Profiles/${User._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(updatedData),
        credentials: 'include'
      });

      if (!response.ok) throw new Error(`Failed to update Profile: ${response.status}`);

      const data = await response.json();
      setUserProfile(data);
      return { success: true, data };
    } catch (err) {
      setError('Failed to update Profile: ' + err.message);
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
