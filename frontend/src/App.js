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
import { AlertProvider } from './components/AlertNotification';

// Lazy load components for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clients = lazy(() => import("./pages/Clients"));
const ProfilesPage = lazy(() => import("./pages/ProfilesPage"));
const CertificatesPage = lazy(() => import("./pages/CertificatePage"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
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
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const CreateUser = lazy(() => import("./pages/CreateUser"));
const UserCertificateCreate = lazy(() => import("./pages/UserCertificateCreate"));
const UserCertificateView = lazy(() => import("./pages/UserCertificateView"));
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
      <AlertProvider>
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
          <Route path="/reset-password" element={
            <ErrorBoundary>
              <Suspense fallback={
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }>
                <ResetPassword />
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

          {/* User Certificate Routes */}
          <Route path="/user/certificates/create" element={
            <UserProtectedRoute>
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                }>
                  <UserCertificateCreate />
                </Suspense>
              </ErrorBoundary>
            </UserProtectedRoute>
          } />

          <Route path="/user/certificates/:id" element={
            <UserProtectedRoute>
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                }>
                  <UserCertificateView />
                </Suspense>
              </ErrorBoundary>
            </UserProtectedRoute>
          } />

          {/* Admin routes with layout - Protected */}
          <Route path="/*" element={
            <AdminProtectedRoute>
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
                          <Route path="/" element={
                            <CertificateProvider>
                              <Dashboard />
                            </CertificateProvider>
                          } />
                          <Route path="/dashboard" element={
                            <CertificateProvider>
                              <Dashboard />
                            </CertificateProvider>
                          } />
                          <Route path="/myaccount/profiles" element={
                            <ProfileProvider>
                              <MyAccount />
                            </ProfileProvider>
                          } />
                          <Route path="/myaccount/notifications" element={<Notifications />} />
                          <Route path="/clients" element={<Clients />} />
                          
                          {/* Profile-related routes with ProfileProvider */}
                          <Route path="/profiles" element={
                            <ProfileProvider>
                              <ProfilesPage />
                            </ProfileProvider>
                          } />
                          <Route path="/dashboard/profilescreate" element={
                            <ProfileProvider>
                              <ProfilesCreate />
                            </ProfileProvider>
                          } />
                          <Route path="/create-user" element={
                            <ProfileProvider>
                              <CreateUser />
                            </ProfileProvider>
                          } />
                          <Route path="/profiles/:id" element={
                            <ProfileProvider>
                              <CertificateProvider>
                                <ProfileDetailView />
                              </CertificateProvider>
                            </ProfileProvider>
                          } />
                          <Route path="/profiles/edit/:id" element={
                            <ProfileProvider>
                              <EditUserProfile />
                            </ProfileProvider>
                          } />
                          <Route path="/profile" element={
                            <ProfileProvider>
                              <CertificateProvider>
                                <Profile />
                              </CertificateProvider>
                            </ProfileProvider>
                          } />
                          <Route path="/editprofile" element={
                            <ProfileProvider>
                              <EditProfile />
                            </ProfileProvider>
                          } />
                          <Route path="/sharestaff" element={
                            <ProfileProvider>
                              <CertificateProvider>
                                <Sharestaff/>
                              </CertificateProvider>
                            </ProfileProvider>
                          } />
                          <Route path="/staffdetail" element={
                            <ProfileProvider>
                              <StaffDetail/>
                            </ProfileProvider>
                          } />
                          <Route path="/reporting/profiles" element={
                            <ProfileProvider>
                              <ProfilesPage />
                            </ProfileProvider>
                          } />
                          
                          {/* Certificate-related routes with CertificateProvider */}
                          <Route path="/dashboard/createcertificate" element={
                            <ProfileProvider>
                              <CertificateProvider>
                                <CreateCertificate />
                              </CertificateProvider>
                            </ProfileProvider>
                          } />
                          <Route path="/reporting/certificates" element={
                            <CertificateProvider>
                              <CertificatesPage />
                            </CertificateProvider>
                          } />
                          <Route path="/certificates" element={
                            <ProfileProvider>
                              <CertificateProvider>
                                <CertificateManagement />
                              </CertificateProvider>
                            </ProfileProvider>
                          } />
                          <Route path="/editcertificate/:id" element={
                            <ProfileProvider>
                              <CertificateProvider>
                                <EditCertificate />
                              </CertificateProvider>
                            </ProfileProvider>
                          } />
                          <Route path="/viewcertificate/:id" element={
                            <CertificateProvider>
                              <ViewCertificate />
                            </CertificateProvider>
                          } />
                          
                          {/* Other routes */}
                          <Route path="/noaccess" element={<NoAccess />} />
                          <Route path="/dashboard/admin-details" element={<AdminDetailsModal />} />
                        </Routes>
                      </Suspense>
                    </div>
                  </div>
                </div>
              </NotificationProvider>
            </AdminProtectedRoute>
          } />
          </Routes>
        </Router>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;
