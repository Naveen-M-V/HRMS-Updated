// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ErrorBoundary from "./components/ErrorBoundary";
import { CertificateProvider } from "./context/CertificateContext";
import { ProfileProvider } from "./context/ProfileContext";
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Lazy load components for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const ProfilesPage = lazy(() => import("./pages/ProfilesPage"));
const CertificatesPage = lazy(() => import("./pages/CertificatePage"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const AdminEditProfile = lazy(() => import("./pages/AdminEditProfile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ProfilesCreate = lazy(() => import("./pages/ProfilesCreate"));
const CreateCertificate = lazy(() => import("./pages/CreateCertificate"));
const Sharestaff = lazy(() => import("./pages/ShareStaff"));
const NoAccess = lazy(() => import("./pages/NoAccess"));
const EditUserProfile = lazy(() => import("./pages/EditUserProfile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const EditCertificate = lazy(() => import("./pages/EditCertificate"));
const ViewCertificate = lazy(() => import("./pages/ViewCertificate"));
const ProfileDetailView = lazy(() => import("./pages/ProfileDetailView"));
const Profile = lazy(() => import("./pages/Profile"));
const CertificateManagement = lazy(() => import("./pages/CertificateManagement"));
const Login = lazy(() => import("./pages/Login"));
const StaffDetail = lazy(() => import("./pages/StaffDetail"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const CreateUser = lazy(() => import("./pages/CreateUser"));
// const UserCertificateCreate = lazy(() => import("./pages/UserCertificateCreate"));
// const UserCertificateView = lazy(() => import("./pages/UserCertificateView"));
const AdminDetailsModal = lazy(() => import("./pages/AdminDetailsModal"));

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
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
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

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
  
  if (user?.role !== 'admin') {
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
  
  if (user?.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Authentication routes without layout */}
          <Route path="/login" element={
            <ErrorBoundary>
              <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
              }>
                <Login />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/signup" element={
            <ErrorBoundary>
              <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
              }>
                <Signup />
              </Suspense>
            </ErrorBoundary>
          } />
          <Route path="/forgot-password" element={
            <ErrorBoundary>
              <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }>
                <ForgotPassword />
              </Suspense>
            </ErrorBoundary>
          } />
          
          {/* User Dashboard Routes - No Sidebar */}
          <Route path="/user-dashboard" element={
            <UserProtectedRoute>
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                }>
                  <UserDashboard />
                </Suspense>
              </ErrorBoundary>
            </UserProtectedRoute>
          } />

          {/* Admin routes with layout - Protected */}
          <Route path="/*" element={
            <AdminProtectedRoute>
              <ProfileProvider>
                <CertificateProvider>
                  <NotificationProvider>
                    <div className="flex">
                      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                      <div className={`flex-1 flex flex-col transition-all duration-300 ${
                        isSidebarOpen ? "ml-64" : "ml-16"
                      }`}>
                        <Topbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                        <div className="p-6">
                          <Suspense fallback={
                            <div className="flex items-center justify-center min-h-[400px]">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          }>
                            <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/dashboard" element={<Dashboard />} />
                              <Route path="/myaccount/profiles" element={<MyAccount />} />
                              <Route path="/my-account" element={<MyAccount />} />
                              <Route path="/admin/edit-profile" element={<AdminEditProfile />} />
                              <Route path="/myaccount/notifications" element={<Notifications />} />
                              <Route path="/clients" element={<Clients />} />
                              <Route path="/profiles" element={<ProfilesPage />} />
                              <Route path="/dashboard/profilescreate" element={<ProfilesCreate />} />
                              <Route path="/create-user" element={<CreateUser />} />
                              <Route path="/profiles/:id" element={<ProfileDetailView />} />
                              <Route path="/profiles/edit/:id" element={<EditUserProfile />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/noaccess" element={<NoAccess />} />
                              <Route path="/editprofile" element={<EditProfile />} />
                              <Route path="/sharestaff" element={<Sharestaff/>} />
                              <Route path="/staffdetail" element={<StaffDetail/>} />
                              <Route path="/dashboard/createcertificate" element={<CreateCertificate />} />
                              <Route path="/reporting/certificates" element={<CertificatesPage />} />
                              <Route path="/certificates" element={<CertificateManagement />} />
                              <Route path="/editcertificate/:id" element={<EditCertificate />} />
                              <Route path="/viewcertificate/:id" element={<ViewCertificate />} />
                              <Route path="/reporting/profiles" element={<ProfilesPage />} />
                              <Route path="/dashboard/admin-details" element={<AdminDetailsModal />} />
                            </Routes>
                          </Suspense>
                        </div>
                      </div>
                    </div>
                  </NotificationProvider>
                </CertificateProvider>
              </ProfileProvider>
            </AdminProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
