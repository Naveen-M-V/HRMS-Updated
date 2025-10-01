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
  // Session storage utilities - minimal local cache for UI state only
  const sessionStorage = {
    // Store user session data in sessionStorage (NOT localStorage - clears on tab close)
    setUserSession: (userData) => {
      try {
        // Only store non-sensitive user info for UI display
        window.sessionStorage.setItem('user_cache', JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Error storing session cache:', error);
      }
    },

    // Get user session data from sessionStorage
    getUserSession: () => {
      try {
        const sessionData = window.sessionStorage.getItem('user_cache');
        if (sessionData) {
          return { user: JSON.parse(sessionData) };
        }
      } catch (error) {
        console.error('Error reading session cache:', error);
        sessionStorage.clearSession();
      }
      return null;
    },

    // Clear all session data
    clearSession: () => {
      try {
        window.sessionStorage.removeItem('user_cache');
        // Clear any legacy localStorage items
        localStorage.removeItem('user_session');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('session_cookie');
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    }
  };

  // Initialize state from session storage (UI cache only)
  const getInitialState = () => {
    const sessionData = sessionStorage.getUserSession();
    if (sessionData && sessionData.user) {
      return {
        user: sessionData.user,
        isAuthenticated: false // Will be validated by server
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

  const checkExistingSession = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/validate-session`, {
        withCredentials: true,
        timeout: 5000
      });
      
      if (response.data.isAuthenticated && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        sessionStorage.setUserSession(response.data.user);
      } else {
        handleInvalidSession();
      }
    } catch (error) {
      // Session invalid or expired
      if (error.response?.status === 403 || error.response?.status === 401) {
        handleInvalidSession();
      }
    }
  }, []);

  // Check for existing session on app start
  useEffect(() => {
    let isMounted = true;
    
    // Always validate session with server on mount
    if (isMounted) {
      checkExistingSession();
    }

    return () => {
      isMounted = false;
    };
  }, [checkExistingSession]);


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

      const { user: userData } = response.data;

      if (!userData) {
        throw new Error('Invalid response from server');
      }

      // Store minimal user data for UI (not tokens!)
      sessionStorage.setUserSession(userData);

      // Update state - auth is handled by httpOnly cookies
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
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
