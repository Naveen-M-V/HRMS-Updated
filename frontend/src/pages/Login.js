// src/pages/Login.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { EyeIcon } from '@heroicons/react/24/outline';
import { EyeSlashIcon as EyeOffIcon } from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { EnvelopeIcon as MailIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationMessage, setVerificationMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error } = useAuth();
  
  // Load saved email if "remember me" was checked and fix loading issue
  useEffect(() => {
    let isMounted = true;
    
    const initializeComponent = () => {
      try {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail && isMounted) {
          setFormData(prev => ({
            ...prev,
            emailOrUsername: savedEmail,
            rememberMe: true
          }));
        }

        // Check for verification success/error messages from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const verified = urlParams.get('verified');
        const error = urlParams.get('error');
        
        if (verified === 'true') {
          setVerificationMessage("Email verified successfully! You can now login to access your admin dashboard.");
        } else if (error === 'verification_failed') {
          setErrors({ general: "Email verification failed. Please try again or contact support." });
        }
      } catch (error) {
        console.error('Error loading saved email:', error);
      }
      
      // Fix loading issue by setting loading to false after component mounts
      if (isMounted) {
        setIsLoading(false);
      }
    };
    
    // Use requestAnimationFrame to ensure DOM is ready
    const timer = requestAnimationFrame(() => {
      initializeComponent();
    });
    
    return () => {
      isMounted = false;
      cancelAnimationFrame(timer);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.emailOrUsername) {
      newErrors.emailOrUsername = "Username or email is required";
    } else if (formData.emailOrUsername.includes('@') && !/\S+@\S+\.\S+/.test(formData.emailOrUsername)) {
      newErrors.emailOrUsername = "Email is invalid";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const result = await login(formData.emailOrUsername, formData.password, formData.rememberMe);
      
      if (result.success) {
        // Handle remember me
        if (formData.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.emailOrUsername);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        // Role-based routing using returned user role
        const userRole = result.user?.role || 'user';
        const redirectPath = userRole === 'admin'
          ? (location.state?.from?.pathname || "/dashboard")
          : "/user-dashboard";
        
        navigate(redirectPath, { replace: true });
      } else {
        setErrors({ general: result.error || "Invalid email or password" });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ 
        general: error.response?.data?.message || "An error occurred. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading spinner to prevent blank page
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <img 
              src="/TSL.png" 
              alt="TSL Logo" 
              className="h-20 w-20 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'block';
              }}
            />
            <svg className="h-8 w-8 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="mt-1 text-sm text-gray-500">Sign in to access your account</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          {/* Login Form */}
          <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-200">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {verificationMessage && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{verificationMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {(errors.general || error) && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{errors.general || error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Username or Email */}
              
              <div>
                <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700">
                  Username or Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MailIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="emailOrUsername"
                    name="emailOrUsername"
                    type="text"
                    autoComplete="username"
                    value={formData.emailOrUsername}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errors.emailOrUsername ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm`}
                    placeholder="Enter your username or email"
                    aria-invalid={!!errors.emailOrUsername}
                    aria-describedby={errors.emailOrUsername ? 'emailOrUsername-error' : ''}
                  />
                  {errors.emailOrUsername && (
                    <p className="mt-1 text-sm text-red-600" id="emailOrUsername-error">
                      {errors.emailOrUsername}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`block w-full pl-10 pr-10 py-3 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm`}
                    placeholder="Enter your password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : ''}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600" id="password-error">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rememberMe: e.target.checked
                    }))}
                    disabled={isSubmitting}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-emerald-600 hover:text-emerald-500 transition duration-150 ease-in-out"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || isSubmitting}
                  aria-live="polite"
                  aria-busy={isSubmitting}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition duration-150 ease-in-out ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New Admin?</span>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-center">
                  <Link
                    to="/signup"
                    state={{ from: location.state?.from }}
                    className="w-full max-w-xs flex justify-center py-3 px-4 border border-emerald-600 rounded-lg shadow-sm text-sm font-medium text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 ease-in-out"
                  >
                    Admin Signup
                  </Link>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    By signing in, you agree to our{' '}
                    <button 
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-emerald-600 hover:text-emerald-500 font-medium underline bg-transparent border-none cursor-pointer"
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button 
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-emerald-600 hover:text-emerald-500 font-medium underline bg-transparent border-none cursor-pointer"
                    >
                      Privacy Policy
                    </button>
                  </p>
                  <p className="text-xs text-gray-500">Powered by Vitrux Shield</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Terms and Conditions</h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  <h4 className="mb-4 font-semibold text-gray-900">Terms & Conditions</h4>
                  <p className="mb-4">
                    Welcome to Vitrux Shield. By accessing and using this Application, you agree to comply with and be bound by these Terms & Conditions.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Policy Modal */}
        {showPrivacyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Privacy Policy</h3>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  <h4 className="mb-4 font-semibold text-gray-900">Privacy Policy</h4>
                  <p className="mb-4">
                    This Privacy Policy explains how Vitrux Shield collects, uses, and protects personal data within the HRMS application.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}
