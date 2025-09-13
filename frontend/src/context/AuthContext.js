// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
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

const API_BASE_URL = `${getApiUrl()}/api`;

// Configure axios to include credentials (cookies) with requests
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on app start
  useEffect(() => {
    validateSession();
  }, []);

  const validateSession = async () => {
    setLoading(true);
    try {
      // First check if we have stored user data
      const storedUserData = localStorage.getItem("userData");
      const storedToken = localStorage.getItem("authToken");
      
      if (storedUserData && storedToken) {
        // Temporarily set user data while validating session
        const userData = JSON.parse(storedUserData);
        setUser(userData);
        setIsAuthenticated(true);
      }

      // Validate with server
      const response = await axios.get(`${API_BASE_URL}/auth/validate-session`);
      
      if (response.data.isAuthenticated) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        // Update stored data with fresh user info
        localStorage.setItem("userData", JSON.stringify(response.data.user));
        // Keep token in localStorage for API compatibility
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      }
    } catch (err) {
      console.log("Session validation failed:", err.message);
      // If we have stored data but server validation fails, keep user logged in temporarily
      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setUser(userData);
          setIsAuthenticated(true);
          console.log("Using cached user data due to network/server issue");
        } catch (parseErr) {
          // If stored data is corrupted, clear everything
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("authToken");
          localStorage.removeItem("userData");
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
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
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, userData);
      
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
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear local state and storage regardless of API call result
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    signup,
    logout,
    validateSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
