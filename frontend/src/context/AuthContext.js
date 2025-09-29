// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getErrorMessage } from '../utils/errorHandler';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const getApiUrl = () => {
  // In development, use localhost URL
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // In production or when API_BASE_URL is relative, use relative path
  if (process.env.REACT_APP_API_BASE_URL?.startsWith('/')) {
    return '';
  }
  // Fallback to localhost for development
  return process.env.REACT_APP_API_URL || 'http://localhost:5003';
};

const API_BASE_URL = `${getApiUrl()}`;

// Configure axios to include credentials (cookies) with requests
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  // Session storage utilities - only for authentication state
  const sessionStorage = {
    // Store user session data
    setUserSession: (userData, token = null) => {
      try {
        if (!userData?._id) {
          console.error('Attempted to store invalid user data');
          return;
        }

        const sessionData = {
          user: {
            ...userData,
            _id: userData._id // Ensure _id is always included
          },
          timestamp: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };

        localStorage.setItem('user_session', JSON.stringify(sessionData));
        if (token) {
          localStorage.setItem('auth_token', token);
        }

        // Store user separately for redundancy
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Error storing session:', error);
      }
    },

    // Get user session data
    getUserSession: () => {
      try {
        const sessionData = localStorage.getItem('user_session');
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          // Check if session is expired
          if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
            sessionStorage.clearSession();
            return null;
          }
          return parsed;
        }
      } catch (error) {
        console.error('Error reading session:', error);
        sessionStorage.clearSession();
      }
      return null;
    },

    // Clear all session data
    clearSession: () => {
      try {
        localStorage.removeItem('user_session');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('session_cookie');
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    },

    // Store session cookie for backend communication
    setSessionCookie: (cookieValue) => {
      try {
        localStorage.setItem('session_cookie', cookieValue);
      } catch (error) {
        console.error('Error storing session cookie:', error);
      }
    },

    // Get auth token
    getAuthToken: () => {
      try {
        return localStorage.getItem('auth_token');
      } catch (error) {
        console.error('Error reading auth token:', error);
        return null;
      }
    }
  };

  // Initialize state from session storage
  const getInitialState = () => {
    const sessionData = sessionStorage.getUserSession();
    if (sessionData && sessionData.user) {
      return {
        user: sessionData.user,
        isAuthenticated: true
      };
    }
    return {
      user: null,
      isAuthenticated: false
    };
  };

  const initialState = getInitialState();
  const [user, setUser] = useState(initialState.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Store session cookie for session maintenance
  const storeSessionCookie = () => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('talentshield.sid='));

    if (sessionCookie) {
      console.log('Session cookie captured:', sessionCookie);
      sessionStorage.setSessionCookie(sessionCookie);
    } else {
      sessionStorage.clearSession();
    }
  };

  const checkExistingSession = useCallback(async () => {
    try {
      const sessionData = sessionStorage.getUserSession();
      const token = sessionStorage.getAuthToken();

      if (sessionData?.user && token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/auth/validate-session`, {
            withCredentials: true,
            timeout: 5000,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Update user data if the session is valid
          if (response.data?.user) {
            setUser(response.data.user);
            setIsAuthenticated(true);
            sessionStorage.setUserSession(response.data.user, token);
          }
        } catch (error) {
          // Session invalid, clear it
          if (error.response?.status === 403 || error.response?.status === 401) {
            handleInvalidSession();
          } else {
            // For network errors, keep the session but log the error
            console.error('Session validation network error:', error);
          }
        }
      } else {
        // No valid session data or token
        handleInvalidSession();
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // Don't clear session on network errors, only on auth errors
    }
  }, []);

  // Check for existing session on app start
  useEffect(() => {
    let isMounted = true;
    let sessionCheckInterval;
    
    const validateAndUpdateSession = async () => {
      if (!isMounted) return;
      
      const currentUser = sessionStorage.getUserSession()?.user;
      const token = sessionStorage.getAuthToken();

      // If we have no user data but have a token, try to recover
      if (!currentUser?._id && token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
            withCredentials: true
          });
          if (response.data?.user) {
            setUser(response.data.user);
            setIsAuthenticated(true);
            sessionStorage.setUserSession(response.data.user, token);
          }
        } catch (error) {
          console.error('Failed to recover user session:', error);
          handleInvalidSession();
        }
      }
    };

    // Initial check
    if (!user?._id) {
      validateAndUpdateSession();
    }

    // Set up periodic session validation (every 5 minutes)
    sessionCheckInterval = setInterval(validateAndUpdateSession, 5 * 60 * 1000);

    // Listen for localStorage changes to sync across tabs (session management only)
    const handleStorageChange = (e) => {
      if (!isMounted) return;
      
      if (e.key === 'user_session') {
        if (e.newValue) {
          try {
            const sessionData = JSON.parse(e.newValue);
            if (sessionData.user?._id && isMounted) {
              setUser(sessionData.user);
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error('Error parsing session storage change:', error);
          }
        } else {
          // Session was removed
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, checkExistingSession]);


  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
        rememberMe
      }, {
        timeout: 10000,
        withCredentials: true
      });

      const { token, user: userData } = response.data;

      if (!userData) {
        throw new Error('Invalid response from server');
      }

      // Store session data using our session storage utility
      sessionStorage.setUserSession(userData, token);

      // Update state - session is automatically handled by cookies
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, userData, {
        timeout: 10000,
        withCredentials: true
      });

      return { success: true, message: "Account created successfully" };
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Call backend logout endpoint to destroy session
      await axios.post(`${API_BASE_URL}/api/auth/logout`);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear session data using our session storage utility
      sessionStorage.clearSession();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);
    }
  };

  const handleInvalidSession = () => {
    console.log("Invalid session. Clearing user data.");
    sessionStorage.clearSession();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    setUser(newUserData);
    sessionStorage.setUserSession(newUserData);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    signup,
    logout,
    updateUser,
    storeSessionCookie
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
