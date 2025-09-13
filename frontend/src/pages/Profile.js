import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfiles } from '../context/ProfileContext';
import { useCertificates } from '../context/CertificateContext';
import { 
  UserCircleIcon, 
  AcademicCapIcon, 
  BriefcaseIcon,
  CameraIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

export default function Profile() {
  const { user } = useAuth();
  const { profiles, uploadProfilePicture } = useProfiles();
  const { certificates } = useCertificates();
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const fileInputRef = useRef(null);

  // Find current user's profile or use auth user data
  const userProfile = profiles.find(p => p.email === user?.email) || user || {};
  
  // Get user's certificates
  const userCertificates = certificates.filter(cert => 
    cert.profileName === `${userProfile?.firstName || user?.firstName} ${userProfile?.lastName || user?.lastName}`
  );

  // Helper function to get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/uploads/${imagePath}`;
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (file && userProfile._id) {
      setUploading(true);
      try {
        await uploadProfilePicture(userProfile._id, file);
      } catch (error) {
        console.error("Failed to upload profile picture:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserCircleIcon },
    { id: 'certificates', name: 'Certificates', icon: AcademicCapIcon },
    { id: 'experience', name: 'Experience', icon: BriefcaseIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {userProfile.profilePicture ? (
                    <img 
                      src={getImageUrl(userProfile.profilePicture)} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="h-20 w-20 text-gray-400" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 shadow-lg"
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <CameraIcon className="h-5 w-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {userProfile?.firstName || user?.firstName || 'User'} {userProfile?.lastName || user?.lastName || ''}
                    </h1>
                    <p className="text-lg text-gray-600 mt-1">
                      {userProfile?.jobTitle || 'No job title specified'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {userProfile?.company || 'No company specified'} • {userProfile?.staffType || 'Staff'} Staff
                    </p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    <PencilIcon className="h-4 w-4" />
                    Edit Profile
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-emerald-600">{userCertificates.length}</div>
                    <div className="text-sm text-emerald-700">Active Certificates</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{userProfile?.role || 'N/A'}</div>
                    <div className="text-sm text-blue-700">Current Role</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {userProfile?.createdOn ? new Date(userProfile.createdOn).getFullYear() : 'N/A'}
                    </div>
                    <div className="text-sm text-purple-700">Member Since</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-t">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{userProfile?.email || user?.email || 'Not specified'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Mobile</div>
                      <div className="font-medium">{userProfile?.mobile || 'Not specified'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Date of Birth</div>
                      <div className="font-medium">{formatDate(userProfile?.dateOfBirth)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Location</div>
                      <div className="font-medium">{userProfile?.address?.country || 'Not specified'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">VTRX ID</div>
                    <div className="font-medium">{userProfile?.skillkoId || 'Not assigned'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Department</div>
                    <div className="font-medium">{userProfile?.department || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Job Level</div>
                    <div className="font-medium">{userProfile?.jobLevel || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Preferred Language</div>
                    <div className="font-medium">{userProfile?.language || 'English'}</div>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About Me</h2>
                <div className="text-gray-600">
                  {userProfile?.bio || 'No bio information available. Click edit profile to add your bio.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-semibold text-gray-900">My Certificates</h2>
              </div>
              <div className="p-6">
                {userCertificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userCertificates.map((cert) => (
                      <div key={cert.id || cert._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <AcademicCapIcon className="h-8 w-8 text-emerald-600" />
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            cert.status === 'Approved' 
                              ? 'bg-green-100 text-green-800' 
                              : cert.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {cert.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{cert.certificate}</h3>
                        <p className="text-sm text-gray-600 mb-2">{cert.provider}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Issued: {cert.issueDate}</div>
                          <div>Expires: {cert.expiryDate}</div>
                          {cert.cost && <div>Cost: £{cert.cost}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates yet</h3>
                    <p className="text-gray-600">Start building your professional credentials by adding certificates.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Work Experience</h2>
              <div className="text-center py-12">
                <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Experience section coming soon</h3>
                <p className="text-gray-600">This section will display your work history and experience.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
