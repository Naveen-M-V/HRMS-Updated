import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfiles } from "../context/ProfileContext";
import { useCertificates } from "../context/CertificateContext";
import { getImageUrl } from '../utils/config';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { PencilIcon } from '@heroicons/react/24/outline';
import { EyeIcon } from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { BellIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function ProfileDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProfileById, uploadProfilePicture } = useProfiles();
  const { certificates } = useCertificates();
  const [profile, setProfile] = useState(null);
  const [showCertificates, setShowCertificates] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const fileInputRef = useRef(null);

  useEffect(() => {
    const profileData = getProfileById(id);
    if (profileData) {
      setProfile(profileData);
    }
  }, [id, getProfileById]);

  // Refresh profile data when profiles context updates
  const { profiles } = useProfiles();
  useEffect(() => {
    const profileData = getProfileById(id);
    if (profileData) {
      setProfile(profileData);
    }
  }, [profiles, id, getProfileById]);

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploading(true);
      try {
        const profilePictureUrl = await uploadProfilePicture(id, file);
        // Update local state immediately
        setProfile(prev => ({ 
          ...prev, 
          profilePicture: profilePictureUrl
        }));
        // Force image refresh by updating key
        setImageKey(Date.now());
        // Clear the file input
        event.target.value = '';
        alert('Profile picture updated successfully!');
      } catch (error) {
        console.error("Failed to upload profile picture:", error);
        alert('Failed to upload profile picture. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const userCertificates = certificates.filter(cert => 
    cert.profileName === `${profile?.firstName} ${profile?.lastName}`
  );

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          {/* Left: Account Dropdown */}
         

          {/* Center: Company Logo */}
          <div className="flex justify-center items-center">
          <img 
            src="/vlogo.png" 
            alt="VitruX Logo" 
            className="h-12 w-auto"
          />
        </div>

        </div>

        {/* User Name Row */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {profile.firstName} {profile.lastName}
            </h1>
            <div className="flex items-center gap-2">
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/reporting/profiles")}
              className="flex items-center gap-2 px-3 py-1 border rounded text-sm hover:bg-gray-50"
            >
              <EyeIcon className="h-4 w-4" />
              View profile list
            </button>
            <button 
              onClick={() => navigate("/dashboard/createcretificate")}
              className="flex items-center gap-2 px-3 py-1 border rounded text-sm hover:bg-gray-50"
            >
              <PlusIcon className="h-4 w-4" />
              Add certificate
            </button>
            <button 
              onClick={() => navigate(`/profiles/edit/${id}`)}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <PencilIcon className="h-4 w-4" />
              Edit profile
            </button>
          </div>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="grid grid-cols-4 gap-8">
            
            {/* Column 1: Profile Overview */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {profile.profilePicture ? (
                      <img 
                        src={`${getImageUrl(profile.profilePicture)}?t=${imageKey}`}
                        alt="Profile Picture" 
                        className="w-full h-full object-cover"
                        key={`profile-pic-${imageKey}`}
                        onError={(e) => {
                          console.log('Image failed to load:', getImageUrl(profile.profilePicture));
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          console.log('Image loaded successfully:', getImageUrl(profile.profilePicture));
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'none';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full flex items-center justify-center ${profile.profilePicture ? 'hidden' : 'flex'}`}
                      style={{ display: profile.profilePicture ? 'none' : 'flex' }}
                    >
                      <UserCircleIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700"
                    disabled={uploading}
                  >
                    {uploading ? "..." : "Change"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">User role:</span>
                  <div className="text-gray-600">{profile.staffType} Staff</div>
                </div>
                <div>
                  <span className="font-medium">Company name:</span>
                  <div className="text-gray-600">{profile.company}</div>
                </div>
                <div>
                  <span className="font-medium">Created On:</span>
                  <div className="text-gray-600">{formatDate(profile.createdOn)}</div>
                </div>
                <div>
                  <span className="font-medium">Last Seen:</span>
                  <div className="text-gray-600">{formatDateTime(profile.lastSeen)}</div>
                </div>
              </div>
            </div>

            {/* Column 2: User Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">User Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">VTRX ID:</span>
                  <span className="font-medium">{profile._id || profile.id || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">User Role:</span>
                  <span className="font-medium">{profile.role || profile.jobLevel || "User"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Circet UIN:</span>
                  <span className="font-medium">{profile.circetUIN || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Circet SCID:</span>
                  <span className="font-medium">{profile.circetSCID || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">NOPS ID:</span>
                  <span className="font-medium">{profile.nopsID || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Email:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{profile.email}</span>
                    {profile.emailVerified && (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mobile:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{profile.mobile || "N/A"}</span>
                    {profile.mobileVerified && (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Preferred Language:</span>
                  <span className="font-medium">{profile.language || "English"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date of Birth:</span>
                  <span className="font-medium">{formatDate(profile.dob || profile.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nationality:</span>
                  <span className="font-medium">{profile.nationality || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{profile.status || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Column 3: Job, Team & Training Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Job, Team & Training Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Generic Job Title:</span>
                  <span className="font-medium">{profile.jobTitle || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Job Roles:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{profile.jobLevel || "N/A"}</span>
                    
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600"># of Active Certificates:</span>
                  <span className="font-medium">{userCertificates.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Client Contracts:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">0</span>
                    <ArrowTopRightOnSquareIcon className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4: Compliance Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Compliance Summary</h3>
              <div className="text-sm text-gray-500 italic">
                No applicable compliance matrix found to perform an assessment.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Active Training Certificates */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow border">
            <button
              onClick={() => setShowCertificates(!showCertificates)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
            >
              <h3 className="font-semibold text-lg">Active Training Certificates</h3>
              <ChevronDownIcon 
                className={`h-5 w-5 transform transition-transform ${
                  showCertificates ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {showCertificates && (
              <div className="border-t p-4">
                {userCertificates.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 border">Certificate</th>
                          <th className="text-left p-2 border">Issue Date</th>
                          <th className="text-left p-2 border">Expiry Date</th>
                          <th className="text-left p-2 border">Provider</th>
                          <th className="text-left p-2 border">Status</th>
                          <th className="text-left p-2 border">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userCertificates.map((cert) => (
                          <tr key={cert.id} className="hover:bg-gray-50">
                            <td className="p-2 border">{cert.certificate}</td>
                            <td className="p-2 border">{cert.issueDate}</td>
                            <td className="p-2 border">{cert.expiryDate}</td>
                            <td className="p-2 border">{cert.provider}</td>
                            <td className="p-2 border">
                              <span className={`px-2 py-1 rounded text-xs ${
                                cert.status === 'Approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {cert.status}
                              </span>
                            </td>
                            <td className="p-2 border">
                              {cert.certificateFile ? (
                                <a 
                                  href={getImageUrl(cert.certificateFile)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  View Certificate
                                </a>
                              ) : (
                                <span className="text-gray-500 text-sm">No file</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No active certificates found for this user.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
