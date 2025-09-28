import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProfiles } from "../context/ProfileContext";
import { useAuth } from "../context/AuthContext";
import JobRoleDropdown from '../components/JobRoleDropdown';

export default function EditUserProfile() {
  const [activeTab, setActiveTab] = useState("Profile Details");
  const [profileLoading, setProfileLoading] = useState(false);
  const [formData, setFormData] = useState({
    
    // Profile Details
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    dateOfBirth: "",
    gender: "",
    jobTitle: "",
    jobLevel: "",
    language: "English",
    company: "Vitrux Ltd",
    staffType: "",
    nationality: "",
    status: "",
    poc: "",
    startDate: "",
    
    // Emergency Contact
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },
    
    // Address
    address: {
      line1: "",
      line2: "",
      city: "",
      postCode: "",
      country: "",
    },
    
    // Extra Information
    externalSystemId: "",
    extThirdPartySystemId: "",
    nopsId: "",
    nopsID: "",
    insuranceNumber: "",
    circetUIN: "",
    circetSCID: "",
    morrisonsIDNumber: "",
    morrisonsUIN: "",
    bio: "",
    otherInformation: "",
  });
  
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { getProfileById, fetchProfileById, updateProfile, deleteProfile } = useProfiles();
  
  // Check if user is editing their own profile
  const isOwnProfile = user?._id === id;

  const tabs = ["Profile Details", "Employment Info", "System IDs", "Emergency Contact", "Profile Address", "Extra Information"];

  useEffect(() => {
    if (!id) {
      navigate('/profiles');
      return;
    }

    async function loadProfile() {
      console.log('EditUserProfile mounted with ID:', id);
      setProfileLoading(true);
      try {
        // First try to get from local cache
        let profile = getProfileById(id);
        
        // If not in cache, fetch from backend
        if (!profile) {
          console.log('Profile not in cache, fetching from backend...');
          profile = await fetchProfileById(id);
        }
        
        console.log('Profile loaded:', profile);
        
        if (!profile) {
          throw new Error('Profile not found');
        }
          
          // Populate form data with all fields
        setFormData({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || "",
          mobile: profile.mobile || "",
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : "",
          gender: profile.gender || "",
          jobTitle: profile.jobTitle || (Array.isArray(profile.jobRole) ? profile.jobRole.join(', ') : profile.jobRole || ""),
          jobLevel: profile.jobLevel || "",
          language: profile.language || "English",
          company: profile.company || "Vitrux Ltd",
          staffType: profile.staffType || "",
          nationality: profile.nationality || "",
          status: profile.status || "",
          poc: profile.poc || "",
          startDate: profile.startDate ? new Date(profile.startDate).toISOString().split('T')[0] : "",
          emergencyContact: {
            name: profile.emergencyContact?.name || "",
            relationship: profile.emergencyContact?.relationship || "",
            phone: profile.emergencyContact?.phone || "",
          },
          address: {
            line1: profile.address?.line1 || "",
            line2: profile.address?.line2 || "",
            city: profile.address?.city || "",
            postCode: profile.address?.postCode || "",
            country: profile.address?.country || "",
          },
          externalSystemId: profile.externalSystemId || "",
          extThirdPartySystemId: profile.extThirdPartySystemId || "",
          nopsId: profile.nopsId || profile.nopsID || "",
          nopsID: profile.nopsId || profile.nopsID || "",
          insuranceNumber: profile.insuranceNumber || "",
          circetUIN: profile.circetUIN || "",
          circetSCID: profile.circetSCID || "",
          morrisonsIDNumber: profile.morrisonsIDNumber || "",
          morrisonsUIN: profile.morrisonsUIN || "",
          bio: profile.bio || "",
          otherInformation: profile.otherInformation || "",
          });
        } catch (error) {
          console.error('Error loading profile:', error);
          alert(error.message === 'Profile not found' ? 
            'Profile not found. Redirecting to profiles page.' : 
            'Failed to load profile. Please try again or contact support.');
          navigate('/profiles');
        } finally {
          setProfileLoading(false);
        }
      };

    loadProfile();
  }, [id, getProfileById, fetchProfileById, navigate]);

  const handleChange = (e, section = null) => {
    const { name, value } = e.target;
    
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Transform form data to match API expectations
      const profileData = {
        ...formData,
        // Handle job roles/titles properly
        jobRole: formData.jobTitle ? formData.jobTitle.split(',').map(role => role.trim()) : [],
        jobTitle: formData.jobTitle ? formData.jobTitle.split(',').map(role => role.trim()) : [],
        // Convert date strings to proper format
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        // Ensure nested objects are properly structured
        address: {
          line1: formData.address?.line1 || '',
          line2: formData.address?.line2 || '',
          city: formData.address?.city || '',
          postCode: formData.address?.postCode || '',
          country: formData.address?.country || ''
        },
        emergencyContact: {
          name: formData.emergencyContact?.name || '',
          relationship: formData.emergencyContact?.relationship || '',
          phone: formData.emergencyContact?.phone || ''
        }
      };
      
      console.log('Submitting profile update:', profileData);
      const updatedProfile = await updateProfile(id, profileData);
      
      // If user is editing their own profile, update the auth context
      if (isOwnProfile && updatedProfile) {
        updateUser(updatedProfile);
      }
      
      alert('Profile updated successfully!');
      // Navigate back to appropriate page based on context
      if (isOwnProfile) {
        navigate('/myaccount/profiles');
      } else {
        navigate(`/profiles/${id}`);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this profile? This will also delete ALL certificates associated with this profile. This action cannot be undone.")) {
      setLoading(true);
      try {
        const response = await deleteProfile(id);
        
        // Show detailed success message
        const certCount = response.details?.certificatesDeleted || 0;
        if (certCount > 0) {
          alert(`Profile and ${certCount} associated certificate(s) deleted successfully!`);
        } else {
          alert('Profile deleted successfully!');
        }
        
        navigate("/reporting/profiles");
      } catch (error) {
        console.error("Failed to delete profile:", error);
        alert('Failed to delete profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    // Navigate back to appropriate page based on context
    if (isOwnProfile) {
      navigate('/myaccount/profiles');
    } else {
      navigate(`/profiles/${id}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-1/4 bg-white shadow p-4">
        <h2 className="font-semibold mb-4">{isOwnProfile ? 'Edit My Profile' : 'Edit Profile'}</h2>
        <ul className="space-y-2">
          {tabs.map((tab) => (
            <li
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer px-3 py-2 rounded ${
                activeTab === tab
                  ? "bg-green-600 text-white"
                  : "hover:bg-gray-200"
              }`}
            >
              {tab}
            </li>
          ))}
        </ul>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{activeTab}</h3>

        <form onSubmit={handleSubmit}>
          {/* Profile Details */}
          {activeTab === "Profile Details" && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  id="mobile"
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Mobile Number"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <JobRoleDropdown
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="Select or type to add job title"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="jobLevel" className="block text-sm font-medium text-gray-700 mb-1">Job Level</label>
                <select
                  id="jobLevel"
                  name="jobLevel"
                  value={formData.jobLevel}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select Job Level</option>
                  <option value="Operative">Operative</option>
                  <option value="Manager">Manager</option>
                  <option value="Director">Director</option>
                  <option value="Senior">Senior</option>
                  <option value="Junior">Junior</option>
                </select>
              </div>
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="English">English</option>
                  <option value="French">French</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Polish">Polish</option>
                </select>
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  id="company"
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input
                  id="nationality"
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  placeholder="e.g., British, American, Polish"
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          )}

          {/* Employment Info */}
          {activeTab === "Employment Info" && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <label htmlFor="staffType" className="block text-sm font-medium text-gray-700 mb-2">Staff Type</label>
                <select
                  id="staffType"
                  name="staffType"
                  value={formData.staffType}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select Staff Type</option>
                  <option value="Direct">Direct</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Agency">Agency</option>
                  <option value="Team">Team</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select Status</option>
                  <option value="Onboarded">Onboarded</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Dropped Out">Dropped Out</option>
                  <option value="Left">Left</option>
                </select>
              </div>
              <div>
                <label htmlFor="poc" className="block text-sm font-medium text-gray-700 mb-2">Point of Contact (POC)</label>
                <input
                  id="poc"
                  type="text"
                  name="poc"
                  value={formData.poc}
                  onChange={handleChange}
                  placeholder="Enter POC name"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          )}

          {/* System IDs */}
          {activeTab === "System IDs" && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <label htmlFor="circetUIN" className="block text-sm font-medium text-gray-700 mb-2">Circet UIN</label>
                <input
                  id="circetUIN"
                  type="text"
                  name="circetUIN"
                  value={formData.circetUIN}
                  onChange={handleChange}
                  placeholder="Enter Circet UIN"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="circetSCID" className="block text-sm font-medium text-gray-700 mb-2">Circet SCID</label>
                <input
                  id="circetSCID"
                  type="text"
                  name="circetSCID"
                  value={formData.circetSCID}
                  onChange={handleChange}
                  placeholder="Enter Circet SCID"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="morrisonsIDNumber" className="block text-sm font-medium text-gray-700 mb-1">Morrisons ID Number</label>
                <input
                  id="morrisonsIDNumber"
                  type="text"
                  name="morrisonsIDNumber"
                  value={formData.morrisonsIDNumber}
                  onChange={handleChange}
                  placeholder="Enter Morrisons ID Number"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="morrisonsUIN" className="block text-sm font-medium text-gray-700 mb-1">Morrisons UIN</label>
                <input
                  id="morrisonsUIN"
                  type="text"
                  name="morrisonsUIN"
                  value={formData.morrisonsUIN}
                  onChange={handleChange}
                  placeholder="Enter Morrisons UIN"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="nopsId" className="block text-sm font-medium text-gray-700 mb-1">NOPS ID</label>
                <input
                  id="nopsId"
                  type="text"
                  name="nopsId"
                  value={formData.nopsId || formData.nopsID}
                  onChange={(e) => {
                    handleChange(e);
                    setFormData(prev => ({ ...prev, nopsID: e.target.value }));
                  }}
                  placeholder="Enter NOPS ID"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="insuranceNumber" className="block text-sm font-medium text-gray-700 mb-1">Insurance Number</label>
                <input
                  id="insuranceNumber"
                  type="text"
                  name="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={handleChange}
                  placeholder="Insurance Number"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="externalSystemId" className="block text-sm font-medium text-gray-700 mb-1">External System ID</label>
                <input
                  id="externalSystemId"
                  type="text"
                  name="externalSystemId"
                  value={formData.externalSystemId}
                  onChange={handleChange}
                  placeholder="External System ID"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="extThirdPartySystemId" className="block text-sm font-medium text-gray-700 mb-1">Third Party System ID</label>
                <input
                  id="extThirdPartySystemId"
                  type="text"
                  name="extThirdPartySystemId"
                  value={formData.extThirdPartySystemId}
                  onChange={handleChange}
                  placeholder="Third Party System ID"
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {activeTab === "Emergency Contact" && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <input
                  id="emergencyName"
                  type="text"
                  name="name"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleChange(e, 'emergencyContact')}
                  placeholder="Contact Name"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <input
                  id="relationship"
                  type="text"
                  name="relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleChange(e, 'emergencyContact')}
                  placeholder="Relationship"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  id="emergencyPhone"
                  type="tel"
                  name="phone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleChange(e, 'emergencyContact')}
                  placeholder="Phone Number"
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          )}

          {/* Profile Address */}
          {activeTab === "Profile Address" && (
            <div className="space-y-4 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                <input
                  id="addressLine1"
                  type="text"
                  name="line1"
                  value={formData.address.line1}
                  onChange={(e) => handleChange(e, 'address')}
                  placeholder="Address Line 1"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  id="addressLine2"
                  type="text"
                  name="line2"
                  value={formData.address.line2}
                  onChange={(e) => handleChange(e, 'address')}
                  placeholder="Address Line 2"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.address.city}
                  onChange={(e) => handleChange(e, 'address')}
                  placeholder="City"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="postCode" className="block text-sm font-medium text-gray-700 mb-1">Post Code</label>
                <input
                  id="postCode"
                  type="text"
                  name="postCode"
                  value={formData.address.postCode}
                  onChange={(e) => handleChange(e, 'address')}
                  placeholder="Post Code"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  id="country"
                  type="text"
                  name="country"
                  value={formData.address.country}
                  onChange={(e) => handleChange(e, 'address')}
                  placeholder="Country"
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          )}

          {/* Extra Information */}
          {activeTab === "Extra Information" && (
            <div className="space-y-4 flex flex-col">
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">User Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="User Bio"
                  className="border p-2 rounded h-24 w-full"
                />
              </div>
              <div>
                <label htmlFor="otherInformation" className="block text-sm font-medium text-gray-700 mb-1">Other Information</label>
                <textarea
                  id="otherInformation"
                  name="otherInformation"
                  value={formData.otherInformation}
                  onChange={handleChange}
                  placeholder="Other Information"
                  className="border p-2 rounded h-24 w-full"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>

        {!isOwnProfile && (
          <div className="mt-6">
            <button
              onClick={handleDelete}
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Profile"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
