// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

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
  // Initialize state from localStorage immediately
  const getInitialState = () => {
    try {
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        return {
          user: JSON.parse(storedUser),
          isAuthenticated: true
        };
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
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
      localStorage.setItem('sessionCookie', sessionCookie);
    } else {
      localStorage.removeItem('sessionCookie');
    }
  };

const checkExistingSession = useCallback(async () => {
  const storedUser = localStorage.getItem('userData');
  if (storedUser) {
    try {
      await axios.get(`${API_BASE_URL}/api/auth/validate-session`, {
        withCredentials: true,
        timeout: 3000
      });
      // Session is valid, no action needed
    } catch (error) {
      // handle error
    }
  }
}, []);


  // Check for existing session on app start
  useEffect(() => {
    // Only run background validation if user is not already set
    if (!user) {
      checkExistingSession();
    }

    // Listen for localStorage changes to sync across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'userData') {
        if (e.newValue) {
          try {
            const userData = JSON.parse(e.newValue);
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('Error parsing storage change:', error);
          }
        } else {
          // userData was removed
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, checkExistingSession]);

//  const checkExistingSession = useCallback(async () => {
    // This function now only validates with backend, state is already set from localStorage
//    const storedUser = localStorage.getItem('userData');
//    if (storedUser) {
//      try {
//        await axios.get(`${API_BASE_URL}/api/auth/validate-session`, {
//          withCredentials: true,
//          timeout: 3000
//        });
        // Session is valid, no action needed
//      } catch (error) {
        // Only clear on explicit forbidden response
//        if (error.response?.status === 403) {
//          handleInvalidSession();
//        }
        // For other errors (401, network), keep using stored data
//      }
//    }
//  }, []);

  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
        rememberMe
      });

      const { token, user: userData } = response.data;

      // Store token in localStorage for API compatibility
      if (token) {
        localStorage.setItem("authToken", token);
      }
      localStorage.setItem("userData", JSON.stringify(userData));

      // Update state - session is automatically handled by cookies
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed";
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
      await axios.post(`${API_BASE_URL}/api/auth/signup`, userData);

      return { success: true, message: "Account created successfully" };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Signup failed";
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
      // Clear local state and storage regardless of API call result
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("sessionCookie");
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);
    }
  };

  const handleInvalidSession = () => {
    console.log("Invalid session. Clearing user data.");
    localStorage.removeItem("userData");
    localStorage.removeItem("authToken");
    localStorage.removeItem("sessionCookie");
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    signup,
    logout,
    storeSessionCookie
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
