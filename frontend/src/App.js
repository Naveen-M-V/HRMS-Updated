// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
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
import { CertificateProvider } from "./context/CertificateContext";
import { ProfileProvider } from "./context/ProfileContext";
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

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

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Authentication routes without layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Main app routes with layout - Protected */}
          <Route path="/*" element={
            <ProtectedRoute>
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
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/myaccount/profiles" element={<MyAccount />} />
                            <Route path="/myaccount/notifications" element={<Notifications />} />
                            <Route path="/clients" element={<Clients />} />
                            <Route path="/profiles" element={<ProfilesPage />} />
                            <Route path="dashboard/profilescreate" element={<ProfilesCreate />} />
                            <Route path="/profiles/:id" element={<ProfileDetailView />} />
                            <Route path="/profiles/edit/:id" element={<EditUserProfile />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/noaccess" element={<NoAccess />} />
                            <Route path="/editprofile" element={<EditProfile />} />
                            <Route path="/sharestaff" element={<Sharestaff/>} />
                            <Route path="/staffdetail" element={<StaffDetail/>} />
                            <Route path="/dashboard/createcretificate" element={<CreateCertificate />} />
                            <Route path="/reporting/certificates" element={<CertificatesPage />} />
                            <Route path="/certificates" element={<CertificateManagement />} />
                            <Route path="/editcertificate/:id" element={<EditCertificate />} />
                            <Route path="/viewcertificate/:id" element={<ViewCertificate />} />
                            <Route path="/reporting/profiles" element={<ProfilesPage />} />

                          </Routes>
                        </div>
                      </div>
                    </div>
                  </NotificationProvider>
                </CertificateProvider>
              </ProfileProvider>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
