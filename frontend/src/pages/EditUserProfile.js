import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProfiles } from "../context/ProfileContext";

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
    company: "VitruX Ltd",
    
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
      country: "Poland",
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
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProfileById, updateProfile, deleteProfile } = useProfiles();

  const tabs = ["Profile Details", "Emergency Contact", "Profile Address", "Extra Information"];

  useEffect(() => {
    if (id) {
      const profile = getProfileById(id);
      if (profile) {
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
          company: profile.company || "VitruX Ltd",
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
            country: profile.address?.country || "Poland",
          },
          externalSystemId: profile.externalSystemId || "",
          extThirdPartySystemId: profile.extThirdPartySystemId || "",
          nopsId: profile.nopsId || "",
          insuranceNumber: profile.insuranceNumber || "",
          bio: profile.bio || "",
          otherInformation: profile.otherInformation || "",
        });
      }
    }
  }, [id, getProfileById]);

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
      await updateProfile(id, formData);
      navigate("/reporting/profiles");
    } catch (error) {
      console.error("Failed to update profile:", error);
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
    navigate("/reporting/profiles");
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
            <div className="space-y-4 grid grid-cols-2 gap-4">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                className="border p-2 rounded"
                required
              />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                className="border p-2 rounded"
                required
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="border p-2 rounded col-span-2"
                required
              />
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Mobile Number"
                className="border p-2 rounded"
              />
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="border p-2 rounded"
              />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="Job Title"
                className="border p-2 rounded"
              />
              <select
                name="jobLevel"
                value={formData.jobLevel}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                <option value="">Select Job Level</option>
                <option value="Operative">Operative</option>
                <option value="Manager">Manager</option>
                <option value="Director">Director</option>
              </select>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="border p-2 rounded"
              >
                <option value="English">English</option>
                <option value="French">French</option>
                <option value="Spanish">Spanish</option>
                <option value="Polish">Polish</option>
              </select>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Company"
                className="border p-2 rounded"
              />
            </div>
          )}

          {/* Emergency Contact */}
          {activeTab === "Emergency Contact" && (
            <div className="space-y-4 grid grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                value={formData.emergencyContact.name}
                onChange={(e) => handleChange(e, 'emergencyContact')}
                placeholder="Contact Name"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="relationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleChange(e, 'emergencyContact')}
                placeholder="Relationship"
                className="border p-2 rounded"
              />
              <input
                type="tel"
                name="phone"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleChange(e, 'emergencyContact')}
                placeholder="Phone Number"
                className="border p-2 rounded col-span-2"
              />
            </div>
          )}

          {/* Profile Address */}
          {activeTab === "Profile Address" && (
            <div className="space-y-4 grid grid-cols-2 gap-4">
              <input
                type="text"
                name="line1"
                value={formData.address.line1}
                onChange={(e) => handleChange(e, 'address')}
                placeholder="Address Line 1"
                className="border p-2 rounded col-span-2"
              />
              <input
                type="text"
                name="line2"
                value={formData.address.line2}
                onChange={(e) => handleChange(e, 'address')}
                placeholder="Address Line 2"
                className="border p-2 rounded col-span-2"
              />
              <input
                type="text"
                name="city"
                value={formData.address.city}
                onChange={(e) => handleChange(e, 'address')}
                placeholder="City"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="postCode"
                value={formData.address.postCode}
                onChange={(e) => handleChange(e, 'address')}
                placeholder="Post Code"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="country"
                value={formData.address.country}
                onChange={(e) => handleChange(e, 'address')}
                placeholder="Country"
                className="border p-2 rounded col-span-2"
              />
            </div>
          )}

          {/* Extra Information */}
          {activeTab === "Extra Information" && (
            <div className="space-y-4 flex flex-col">
              <input
                type="text"
                name="externalSystemId"
                value={formData.externalSystemId}
                onChange={handleChange}
                placeholder="External System ID"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="extThirdPartySystemId"
                value={formData.extThirdPartySystemId}
                onChange={handleChange}
                placeholder="Third Party System ID"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="nopsId"
                value={formData.nopsId}
                onChange={handleChange}
                placeholder="NOPS ID"
                className="border p-2 rounded"
              />
              <input
                type="text"
                name="insuranceNumber"
                value={formData.insuranceNumber}
                onChange={handleChange}
                placeholder="Insurance Number"
                className="border p-2 rounded"
              />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="User Bio"
                className="border p-2 rounded h-24"
              />
              <textarea
                name="otherInformation"
                value={formData.otherInformation}
                onChange={handleChange}
                placeholder="Other Information"
                className="border p-2 rounded h-24"
              />
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

        <div className="mt-6">
          <button
            onClick={handleDelete}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
