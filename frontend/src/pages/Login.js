import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";

export default function Login() {
  const [mode, setMode] = useState("signin"); // signin or signup
  const [signInData, setSignInData] = useState({ email: "", password: "", rememberMe: false });
  const [signUpData, setSignUpData] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "", isUser: true, isAdmin: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  // Toggle between signin and signup mode
  const toggleMode = (newMode) => {
    setErrors({});
    setMode(newMode);
  };

  // Handle input changes
  const handleSignInChange = (e) => {
    setSignInData({ ...signInData, [e.target.name]: e.target.value });
    setErrors({});
  };

  const handleSignUpChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      // Mutually exclusive checkboxes
      if (name === "isUser") {
        setSignUpData(prev => ({ ...prev, isUser: checked, isAdmin: !checked }));
      } else if (name === "isAdmin") {
        setSignUpData(prev => ({ ...prev, isAdmin: checked, isUser: !checked }));
      }
    } else {
      setSignUpData({ ...signUpData, [name]: value });
    }
    setErrors({});
  };

  const validateSignInForm = () => {
    const newErrors = {};
    if (!signInData.email) newErrors.email = "Email is required";
    if (!signInData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUpForm = () => {
    const newErrors = {};
    if (!signUpData.firstName.trim()) newErrors.firstName = "First Name is required";
    if (!signUpData.lastName.trim()) newErrors.lastName = "Last Name is required";
    if (!signUpData.email) newErrors.email = "Email is required";
    if (signUpData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (signUpData.confirmPassword !== signUpData.password) newErrors.confirmPassword = "Passwords do not match";
    if (!signUpData.isUser && !signUpData.isAdmin) newErrors.role = "Select either User or Admin";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignInForm()) return;
    setLoading(true);
    try {
      const result = await login(signInData.email, signInData.password, signInData.rememberMe);
      if (result.success) {
        const userRole = result.user?.role;
        const redirectPath = userRole === "admin" ? "/admin-dashboard" : "/user-dashboard";
        navigate(redirectPath, { replace: true });
      } else {
        setErrors({ general: result.error || "Invalid email or password" });
      }
    } catch (err) {
      setErrors({ general: "Login failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignUpForm()) return;
    setLoading(true);
    try {
      if (signUpData.isUser) {
        // Create normal user
        const result = await signup({
          firstName: signUpData.firstName,
          lastName: signUpData.lastName,
          email: signUpData.email,
          password: signUpData.password,
          role: "user"
        });
        if (result.success) {
          alert("User account created! Please login.");
          setSignUpData({
            firstName: "", lastName: "", email: "", password: "", confirmPassword: "", isUser: true, isAdmin: false
          });
          setMode("signin");
        } else {
          setErrors({ general: result.error || "Signup failed" });
        }
      }
      if (signUpData.isAdmin) {
        // Send Admin approval request - ideally call API to notify super admin
        alert("Admin account request sent for approval. Please wait for approval email.");
        setSignUpData({
          firstName: "", lastName: "", email: "", password: "", confirmPassword: "", isUser: true, isAdmin: false
        });
        setMode("signin");
        // Implement backend API for admin approval request if needed
      }
    } catch (err) {
      setErrors({ general: "Signup failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };


  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Tab Switch */}
          <div className="flex justify-center space-x-4 mb-6">
            <button
              className={`px-6 py-2 rounded ${mode === "signin" ? "bg-emerald-600 text-white" : "bg-gray-200"}`}
              onClick={() => toggleMode("signin")}
            >
              Sign In
            </button>
            <button
              className={`px-6 py-2 rounded ${mode === "signup" ? "bg-emerald-600 text-white" : "bg-gray-200"}`}
              onClick={() => toggleMode("signup")}
            >
              Sign Up
            </button>
          </div>

          {/* Errors */}
          {(errors.general) && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-4 text-red-700">
              {errors.general}
            </div>
          )}

          {/* Sign In Form */}
          {mode === "signin" && (
            <form className="space-y-6" onSubmit={handleSignInSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={signInData.email}
                  onChange={handleSignInChange}
                  disabled={loading}
                  className={`block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm ${errors.email ? "border-red-300" : "border-gray-300"}`}
                  placeholder="Enter your email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : ""}
                />
                {errors.email && <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={signInData.password}
                  onChange={handleSignInChange}
                  disabled={loading}
                  className={`block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm ${errors.password ? "border-red-300" : "border-gray-300"}`}
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : ""}
                />
                {errors.password && <p id="password-error" className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="rememberMe" className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={signInData.rememberMe}
                    onChange={(e) => setSignInData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                    disabled={loading}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
                  Forgot your password?
                </Link>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === "signup" && (
            <form className="space-y-6" onSubmit={handleSignUpSubmit}>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={signUpData.firstName}
                  onChange={handleSignUpChange}
                  className={`block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm ${errors.firstName ? "border-red-300" : "border-gray-300"}`}
                  placeholder="Enter your first name"
                  required
                  autoComplete="given-name"
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={signUpData.lastName}
                  onChange={handleSignUpChange}
                  className={`block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm ${errors.lastName ? "border-red-300" : "border-gray-300"}`}
                  placeholder="Enter your last name"
                  required
                  autoComplete="family-name"
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={signUpData.email}
                  onChange={handleSignUpChange}
                  className={`block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm ${errors.email ? "border-red-300" : "border-gray-300"}`}
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={signUpData.password}
                  onChange={handleSignUpChange}
                  className={`block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm ${errors.password ? "border-red-300" : "border-gray-300"}`}
                  placeholder="Enter your password"
                  required
                  autoComplete="new-password"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={signUpData.confirmPassword}
                  onChange={handleSignUpChange}
                  className={`block w-full px-3 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out sm:text-sm ${errors.confirmPassword ? "border-red-300" : "border-gray-300"}`}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              {/* User / Admin selection checkboxes */}
              <div className="flex gap-6">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isUser"
                    checked={signUpData.isUser}
                    onChange={handleSignUpChange}
                    className="form-checkbox h-5 w-5 text-emerald-600"
                  />
                  <span className="ml-2 text-gray-700">User</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={signUpData.isAdmin}
                    onChange={handleSignUpChange}
                    className="form-checkbox h-5 w-5 text-emerald-600"
                  />
                  <span className="ml-2 text-gray-700">Admin (requires approval)</span>
                </label>
              </div>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  {loading ? "Processing..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </ErrorBoundary>
  );
}
