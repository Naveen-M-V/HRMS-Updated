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
    return process.env.REACT_APP_API_BASE_URL;
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
    // Store User session data
    setUserSession: (userData, token = null) => {
      try {
        localStorage.setItem('user_session', JSON.stringify({
          User: userData,
          timestamp: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }));
        if (token) {
          localStorage.setItem('auth_token', token);
        }
      } catch (error) {
        console.error('Error storing session:', error);
      }
    },

    // Get User session data
    getUserSession: () => {
      try {
        const sessionData = localStorage.getItem('user_session');
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          // Check if session is Expired
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
    if (sessionData && sessionData.User) {
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

  // Note: Session cookies are httpOnly and managed by the server
  // This function is deprecated and should not be used
  const storeSessionCookie = () => {
    console.warn('storeSessionCookie is deprecated - session cookies are httpOnly');
  };

  const checkExistingSession = useCallback(async () => {
    try {
      const sessionData = sessionStorage.getUserSession();
      if (sessionData && sessionData.User) {
        try {
          await axios.get(`${API_BASE_URL}/api/auth/validate-session`, {
            withCredentials: true,
            timeout: 5000
          });
          // Session is valid, no action needed
        } catch (error) {
          // Session invalid, clear it
          if (error.response?.status === 403 || error.response?.status === 401 || error.response?.status === 404) {
            handleInvalidSession();
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // Don't clear session on network errors, only on auth errors
    }
  }, []);

  // Check for existing session on app start
  useEffect(() => {
    let isMounted = true;
    
    // Only run background validation if User is not already set
    if (!user && isMounted) {
      checkExistingSession();
    }

    // Listen for localStorage changes to sync across tabs (session management only)
    const handleStorageChange = (e) => {
      if (!isMounted) return;
      
      if (e.key === 'user_session') {
        if (e.newValue) {
          try {
            const sessionData = JSON.parse(e.newValue);
            if (sessionData.User && isMounted) {
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
  }, [User, checkExistingSession]);


  const Login = async (emailOrUsername, Password, rememberMe = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        identifier: emailOrUsername,
        Password,
        rememberMe
      }, {
        timeout: 10000,
        withCredentials: true
      });

      const { token, User: userData } = response.data;

      if (!userData) {
        throw new Error('Invalid response from server');
      }

      // Store session data using our session storage utility
      sessionStorage.setUserSession(userData, token);

      // Update state - session is automatically handled by cookies
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, User: userData };
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

  const Logout = async () => {
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
    console.log("Invalid session. Clearing User data.");
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
