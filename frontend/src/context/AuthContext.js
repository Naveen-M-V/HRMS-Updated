// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getErrorMessage } from '../utils/errorHandler';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

const getApiUrl = () => {
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (process.env.REACT_APP_API_BASE_URL?.startsWith('/')) return '';
  return process.env.REACT_APP_API_URL || 'http://localhost:5003';
};

const API_BASE_URL = getApiUrl();

axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const sessionStorage = {
    setUserSession: (userData, token = null) => {
      try {
        localStorage.setItem('user_session', JSON.stringify({
          user: userData,
          timestamp: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        }));
        if (token) localStorage.setItem('auth_token', token);
      } catch (error) {
        console.error('Error storing session:', error);
      }
    },
    getUserSession: () => {
      try {
        const val = localStorage.getItem('user_session');
        if (val) {
          const parsed = JSON.parse(val);
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
    clearSession: () => {
      try {
        localStorage.removeItem('user_session');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('session_cookie');
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    },
    setSessionCookie: (cookieValue) => {
      try {
        localStorage.setItem('session_cookie', cookieValue);
      } catch (error) {
        console.error('Error storing session cookie:', error);
      }
    },
    getAuthToken: () => {
      try {
        return localStorage.getItem('auth_token');
      } catch (error) {
        console.error('Error reading auth token:', error);
        return null;
      }
    }
  };

  const getInitialState = () => {
    const sessionData = sessionStorage.getUserSession();
    if (sessionData && sessionData.user) return { user: sessionData.user, isAuthenticated: true };
    return { user: null, isAuthenticated: false };
  };

  const initialState = getInitialState();
  const [user, setUser] = useState(initialState.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const storeSessionCookie = () => {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => cookie.trim().startsWith('talentshield.sid='));
    if (sessionCookie) sessionStorage.setSessionCookie(sessionCookie);
    else sessionStorage.clearSession();
  };

  const checkExistingSession = useCallback(async () => {
    try {
      const sessionData = sessionStorage.getUserSession();
      if (sessionData && sessionData.user) {
        try {
          await axios.get(`${API_BASE_URL}/api/auth/validate-session`, {
            withCredentials: true,
            timeout: 5000
          });
        } catch (error) {
          if (error.response?.status === 403 || error.response?.status === 401) {
            handleInvalidSession();
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!user && isMounted) checkExistingSession();
    const handleStorageChange = (e) => {
      if (!isMounted) return;
      if (e.key === 'user_session') {
        if (e.newValue) {
          try {
            const sessionData = JSON.parse(e.newValue);
            if (sessionData.user && isMounted) {
              setUser(sessionData.user);
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error('Error parsing session storage change:', error);
          }
        } else if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    }
  }, [user, checkExistingSession]);

  // login function unchanged, keeps role in user session for redirect
  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password, rememberMe }, {
        timeout: 10000, withCredentials: true
      });
      const { token, user: userData } = response.data;
      if (!userData) throw new Error('Invalid response from server');
      sessionStorage.setUserSession(userData, token);
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

  // signup with admin approval request support
  const signup = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      if (userData.role === 'admin') {
        // Send admin signup approval request
        await axios.post(`${API_BASE_URL}/api/auth/admin-approval-request`, {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName
        }, {
          timeout: 10000,
          withCredentials: true
        });
        return { success: true, message: "Admin approval request sent" };
      } else {
        await axios.post(`${API_BASE_URL}/api/auth/signup`, userData, {
          timeout: 10000,
          withCredentials: true
        });
        return { success: true, message: "User account created successfully" };
      }
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
      await axios.post(`${API_BASE_URL}/api/auth/logout`);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
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
