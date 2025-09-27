import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProfiles } from "../context/ProfileContext";
import { validateField, getValidationError } from "../utils/validation";

export default function EditUserProfile() {
  const [activeTab, setActiveTab] = useState("Profile Details");
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
    insuranceNumber: "",
    bio: "",
    otherInformation: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProfileById, updateProfile, deleteProfile, fetchProfileById } = useProfiles();
  const tabs = ["Profile Details", "Emergency Contact", "Address", "Extra Information"];

  useEffect(() => {
    const fetchProfileData = async () => {
      console.log('EditUserProfile mounted with ID:', id);
      if (id) {
        try {
          const profile = getProfileById(id);
          console.log('Profile found:', profile);
          if (!profile) {
            // Try to fetch from API if not in cache
            console.log('Profile not in cache, fetching from API...');
            const fetchedProfile = await fetchProfileById(id);
            if (fetchedProfile) {
              setFormData({
                firstName: fetchedProfile.firstName || "",
                lastName: fetchedProfile.lastName || "",
                email: fetchedProfile.email || "",
                mobile: fetchedProfile.mobile || "",
                dateOfBirth: fetchedProfile.dateOfBirth ? new Date(fetchedProfile.dateOfBirth).toISOString().split('T')[0] : "",
                gender: fetchedProfile.gender || "",
                jobTitle: fetchedProfile.jobTitle || "",
                jobLevel: fetchedProfile.jobLevel || "",
                language: fetchedProfile.language || "English",
                company: fetchedProfile.company || "Vitrux Ltd",
                poc: fetchedProfile.poc || "",
                circetUIN: fetchedProfile.circetUIN || "",
                circetSCID: fetchedProfile.circetSCID || "",
                morrisonsIDNumber: fetchedProfile.morrisonsIDNumber || "",
                morrisonsUIN: fetchedProfile.morrisonsUIN || "",
                nopsID: fetchedProfile.nopsID || "",
                status: fetchedProfile.status || "",
                staffType: fetchedProfile.staffType || "",
                nationality: fetchedProfile.nationality || "",
                insuranceNumber: fetchedProfile.insuranceNumber || "",
                bio: fetchedProfile.bio || "",
                otherInformation: fetchedProfile.otherInformation || "",
                // Emergency Contact
                emergencyContact: {
                  name: fetchedProfile.emergencyContact?.name || "",
                  relationship: fetchedProfile.emergencyContact?.relationship || "",
                  phone: fetchedProfile.emergencyContact?.phone || "",
                },
                // Address
                address: {
                  line1: fetchedProfile.address?.line1 || "",
                  line2: fetchedProfile.address?.line2 || "",
                  city: fetchedProfile.address?.city || "",
                  postCode: fetchedProfile.address?.postCode || "",
                  country: fetchedProfile.address?.country || "United Kingdom",
                },
                externalSystemId: fetchedProfile.externalSystemId || "",
                extThirdPartySystemId: fetchedProfile.extThirdPartySystemId || "",
                nopsId: fetchedProfile.nopsId || "",
              });
            } else {
              console.error('Profile not found for ID:', id);
              alert('Profile not found. Redirecting to profiles page.');
              navigate('/profiles');
            }
          } else {
            // Profile found in cache
            setFormData({
              firstName: profile.firstName || "",
              lastName: profile.lastName || "",
              email: profile.email || "",
              mobile: profile.mobile || "",
              dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : "",
              gender: profile.gender || "",
              jobTitle: profile.jobTitle || "",
              jobLevel: profile.jobLevel || "",
              language: profile.language || "English",
              company: profile.company || "Vitrux Ltd",
              poc: profile.poc || "",
              circetUIN: profile.circetUIN || "",
              circetSCID: profile.circetSCID || "",
              morrisonsIDNumber: profile.morrisonsIDNumber || "",
              morrisonsUIN: profile.morrisonsUIN || "",
              nopsID: profile.nopsID || "",
              status: profile.status || "",
              staffType: profile.staffType || "",
              nationality: profile.nationality || "",
              insuranceNumber: profile.insuranceNumber || "",
              bio: profile.bio || "",
              otherInformation: profile.otherInformation || "",
              // Emergency Contact
              emergencyContact: {
                name: profile.emergencyContact?.name || "",
                relationship: profile.emergencyContact?.relationship || "",
                phone: profile.emergencyContact?.phone || "",
              },
              // Address
              address: {
                line1: profile.address?.line1 || "",
                line2: profile.address?.line2 || "",
                postCode: profile.address?.postCode || "",
                country: profile.address?.country || "United Kingdom",
              },
              externalSystemId: profile.externalSystemId || "",
              extThirdPartySystemId: profile.extThirdPartySystemId || "",
              nopsId: profile.nopsId || "",
            });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          alert('Error loading profile. Redirecting to profiles page.');
          navigate('/profiles');
        }
      }
    };

    fetchProfileData();
  }, [id, getProfileById, fetchProfileById, navigate]);

  const handleChange = (e, section = null) => {
    const { name, value } = e.target;

    // Clear validation error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

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

  const validateForm = () => {
    const newErrors = {};

    // Validate name fields
    if (formData.firstName && !validateField(formData.firstName, 'name')) {
      newErrors.firstName = getValidationError('First Name', 'name');
    }
    if (formData.lastName && !validateField(formData.lastName, 'name')) {
      newErrors.lastName = getValidationError('Last Name', 'name');
    }
    if (formData.jobTitle && !validateField(formData.jobTitle, 'jobTitle')) {
      newErrors.jobTitle = getValidationError('Job Title', 'jobTitle');
    }

    // Validate emergency contact name
    if (formData.emergencyContact.name && !validateField(formData.emergencyContact.name, 'name')) {
      newErrors.emergencyName = getValidationError('Emergency Contact Name', 'name');
    }

    // Validate email
    if (formData.email && !validateField(formData.email, 'email')) {
      newErrors.email = getValidationError('Email', 'email');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await updateProfile(id, formData);
      alert('Profile updated successfully!');
      // Navigate back to the profile detail page
      navigate(`/profiles/${id}`);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
      setLoading(true);
      try {
        await deleteProfile(id);
        navigate("/reporting/profiles");
      } catch (error) {
        console.error("Failed to delete profile:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    // Navigate back to the profile detail page
    navigate(`/profiles/${id}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-1/4 bg-white shadow p-4">
        <h2 className="font-semibold mb-4">Edit Profile</h2>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
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
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
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
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
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
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
                </select>
              </div>
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  id="jobTitle"
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="Job Title"
                  className="border p-2 rounded w-full"
                />
                {errors.jobTitle && <p className="text-red-500 text-xs mt-1">{errors.jobTitle}</p>}
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
            </div>
          )}

          {/* Emergency Contact */}
          {activeTab === "Emergency Contact" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input
                  id="emergencyName"
                  type="text"
                  name="name"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleChange(e, 'emergencyContact')}
                  placeholder="Contact Name"
                  className="border p-2 rounded w-full"
                />
                {errors.emergencyName && <p className="text-red-500 text-xs mt-1">{errors.emergencyName}</p>}
              </div>
              <div>
                <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
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

          {/* Address */}
          {activeTab === "Address" && (
            <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-4">
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
              <div>
                <label htmlFor="nopsId" className="block text-sm font-medium text-gray-700 mb-1">NOPS ID</label>
                <input
                  id="nopsId"
                  type="text"
                  name="nopsId"
                  value={formData.nopsId}
                  onChange={handleChange}
                  placeholder="NOPS ID"
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

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleDelete}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 min-w-[200px]"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
