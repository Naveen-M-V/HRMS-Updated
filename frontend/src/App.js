// src/App.js
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ErrorBoundary from "./components/ErrorBoundary";
import { CertificateProvider } from "./context/CertificateContext";
import { ProfileProvider } from "./context/ProfileContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AlertProvider } from "./components/AlertNotification";
import { initializeCacheManager } from "./utils/cacheManager";

// Direct imports for faster navigation (no loading spinners)
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ProfilesPage from "./pages/ProfilesPage";
import CertificatesPage from "./pages/CertificatePage";
import MyAccount from "./pages/MyAccount";
import Notifications from "./pages/Notifications";
import ProfilesCreate from "./pages/ProfilesCreate";
import CreateCertificate from "./pages/CreateCertificate";
import Sharestaff from "./pages/ShareStaff";
import NoAccess from "./pages/NoAccess";
import EditUserProfile from "./pages/EditUserProfile";
import EditProfile from "./pages/EditProfile";
import EditCertificate from "./pages/EditCertificate";
import ViewCertificate from "./pages/ViewCertificate";
import ProfileDetailView from "./pages/ProfileDetailView";
import Profile from "./pages/Profile";
import CertificateManagement from "./pages/CertificateManagement";
import Login from "./pages/Login";
import StaffDetail from "./pages/StaffDetail";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserDashboard from "./pages/UserDashboard";
import CreateUser from "./pages/CreateUser";
import UserCertificateCreate from "./pages/UserCertificateCreate";
import UserCertificateView from "./pages/UserCertificateView";
import AdminDetailsModal from "./pages/AdminDetailsModal";

// Note: ProtectedRoute removed as it's unused - AdminProtectedRoute and UserProtectedRoute handle all cases

// Admin Protected Route Component
function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/user-dashboard" replace />;
  }

  return children;
}

// User Protected Route Component
function UserProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    initializeCacheManager();
  }, []);

  return (
    <AuthProvider>
      <AlertProvider>
        <Router>
          <Routes>
            {/* Authentication routes without layout */}
            <Route
              path="/login"
              element={
                <ErrorBoundary>
                  <Login />
                </ErrorBoundary>
              }
            />
            <Route
              path="/signup"
              element={
                <ErrorBoundary>
                  <Signup />
                </ErrorBoundary>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <ErrorBoundary>
                  <ForgotPassword />
                </ErrorBoundary>
              }
            />
            <Route
              path="/reset-password"
              element={
                <ErrorBoundary>
                  <ResetPassword />
                </ErrorBoundary>
              }
            />

            {/* User Dashboard Routes - No Sidebar */}
            <Route
              path="/user-dashboard"
              element={
                <UserProtectedRoute>
                  <ErrorBoundary>
                    <UserDashboard />
                  </ErrorBoundary>
                </UserProtectedRoute>
              }
            />

            {/* User Certificate Routes */}
            <Route
              path="/user/certificates/create"
              element={
                <UserProtectedRoute>
                  <ErrorBoundary>
                    <UserCertificateCreate />
                  </ErrorBoundary>
                </UserProtectedRoute>
              }
            />

            <Route
              path="/user/certificates/:id"
              element={
                <UserProtectedRoute>
                  <ErrorBoundary>
                    <UserCertificateView />
                  </ErrorBoundary>
                </UserProtectedRoute>
              }
            />

            {/* Admin routes with layout - Protected */}
            <Route
              path="/*"
              element={
                <AdminProtectedRoute>
                  <ProfileProvider>
                    <CertificateProvider>
                      <NotificationProvider>
                        <div className="flex min-h-screen bg-gray-50">
                          <Sidebar isOpen={isSidebarOpen} />
                          <div
                            className={`flex-1 flex flex-col transition-all duration-300 ${
                              isSidebarOpen ? "ml-64" : "ml-16"
                            }`}
                          >
                            <Topbar
                              toggleSidebar={() =>
                                setIsSidebarOpen(!isSidebarOpen)
                              }
                            />
                            <div className="p-6 flex-1">
                              <Routes>
                                  <Route path="/" element={<Dashboard />} />
                                  <Route
                                    path="/dashboard"
                                    element={<Dashboard />}
                                  />
                                  <Route
                                    path="/myaccount/profiles"
                                    element={<MyAccount />}
                                  />
                                  <Route
                                    path="/myaccount/notifications"
                                    element={<Notifications />}
                                  />
                                  <Route
                                    path="/clients"
                                    element={<Clients />}
                                  />
                                  <Route
                                    path="/profiles"
                                    element={<ProfilesPage />}
                                  />
                                  <Route
                                    path="/dashboard/profilescreate"
                                    element={<ProfilesCreate />}
                                  />
                                  <Route
                                    path="/create-user"
                                    element={<CreateUser />}
                                  />
                                  <Route
                                    path="/profiles/:id"
                                    element={<ProfileDetailView />}
                                  />
                                  <Route
                                    path="/profiles/edit/:id"
                                    element={<EditUserProfile />}
                                  />
                                  <Route
                                    path="/profile"
                                    element={<Profile />}
                                  />
                                  <Route
                                    path="/noaccess"
                                    element={<NoAccess />}
                                  />
                                  <Route
                                    path="/editprofile"
                                    element={<EditProfile />}
                                  />
                                  <Route
                                    path="/sharestaff"
                                    element={<Sharestaff />}
                                  />
                                  <Route
                                    path="/staffdetail"
                                    element={<StaffDetail />}
                                  />
                                  <Route
                                    path="/dashboard/createcertificate"
                                    element={<CreateCertificate />}
                                  />
                                  <Route
                                    path="/reporting/certificates"
                                    element={<CertificatesPage />}
                                  />
                                  <Route
                                    path="/certificates"
                                    element={<CertificateManagement />}
                                  />
                                  <Route
                                    path="/editcertificate/:id"
                                    element={<EditCertificate />}
                                  />
                                  <Route
                                    path="/viewcertificate/:id"
                                    element={<ViewCertificate />}
                                  />
                                  <Route
                                    path="/reporting/profiles"
                                    element={<ProfilesPage />}
                                  />
                                  <Route
                                    path="/dashboard/admin-details"
                                    element={<AdminDetailsModal />}
                                  />
                                </Routes>
                            </div>
                          </div>
                        </div>
                      </NotificationProvider>
                    </CertificateProvider>
                  </ProfileProvider>
                </AdminProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;