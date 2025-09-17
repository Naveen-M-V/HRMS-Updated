// src/pages/ProfilesCreate.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "../context/ProfileContext";
import JobRoleDropdown from "../components/JobRoleDropdown";
import JobTitleDropdown from "../components/JobTitleDropdown";

export default function ProfilesCreate() {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    dob: "",
    company: "",
    jobRole: "",
    jobTitle: [],
    jobLevel: "",
    mobile: "",
    language: "",
    startDate: "",
    staffType: "",
    poc: "",
    nationality: "",
    circetUIN: "",
    circetSCID: "",
    morrisonsIDNumber: "",
    morrisonsUIN: "",
    nopsID: "",
    status: "",
  });

  const navigate = useNavigate();
  const { addProfile } = useProfiles();




  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email) {
      alert('Please fill in all required fields: First Name, Last Name, and Email');
      return;
    }

    // Transform form data to match profile structure
    const newProfile = {
      role: formData.jobLevel || "User",
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      staffType: formData.staffType || "Direct",
      company: formData.company || "VitruX Ltd",
      jobRole: formData.jobRole || "",
      jobTitle: Array.isArray(formData.jobTitle) ? formData.jobTitle : (formData.jobTitle ? [formData.jobTitle] : []),
      jobLevel: formData.jobLevel,
      email: formData.email.trim().toLowerCase(),
      mobile: formData.mobile || "",
      dob: formData.dob || null,
      dateOfBirth: formData.dob || null, // Add both formats for compatibility
      language: formData.language || "English",
      startDate: formData.startDate || null,
      poc: formData.poc || "",
      nationality: formData.nationality || "",
      circetUIN: formData.circetUIN || "",
      circetSCID: formData.circetSCID || "",
      morrisonsIDNumber: formData.morrisonsIDNumber || "",
      morrisonsUIN: formData.morrisonsUIN || "",
      nopsID: formData.nopsID || "",
      status: formData.status || "Onboarding",
      createdOn: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };

    try {
      console.log('Creating profile with data:', newProfile);
      // Add profile to context
      const createdProfile = await addProfile(newProfile);
      console.log('Profile created successfully:', createdProfile);
      
      alert('Profile created successfully!');
      
      // Navigate to the newly created profile's detail page
      if (createdProfile && (createdProfile._id || createdProfile.id)) {
        navigate(`/profiles/${createdProfile._id || createdProfile.id}`);
      } else {
        // Fallback to profiles list
        navigate("/reporting/profiles");
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Show more specific error message
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`Failed to create profile: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    navigate("/"); // Redirect to Dashboard on cancel
  };

  return (
    <div className="flex">
      {/* Main content */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-6">Profiles Create</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded-lg p-6 space-y-6"
        >
          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Account Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              name="email"
              placeholder="Account Email (required)"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            />
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="firstName"
                placeholder="First Name (required)"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full border rounded p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name (required)"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full border rounded p-2"
                required
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium">Company</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Company"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          {/* Job Roles & Job Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Job Role</label>
              <JobRoleDropdown
                name="jobRole"
                value={formData.jobRole || ""}
                onChange={handleChange}
                placeholder="Select or add job role"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can type to search existing job roles or add a new one
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium">Job Title</label>
              <JobTitleDropdown
                name="jobTitle"
                value={Array.isArray(formData.jobTitle) ? formData.jobTitle.join(', ') : formData.jobTitle || ""}
                onChange={(e) => {
                  // Handle multiple job titles separated by commas
                  const titles = e.target.value.split(',').map(title => title.trim()).filter(title => title);
                  setFormData(prev => ({ ...prev, jobTitle: titles }));
                }}
                placeholder="Select or add job title"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can type to search existing job titles or add a new one. Separate multiple titles with commas.
              </p>
              {Array.isArray(formData.jobTitle) && formData.jobTitle.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Selected ({formData.jobTitle.length}):</div>
                  <div className="flex flex-wrap gap-1">
                    {formData.jobTitle.map((title, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                      >
                        {title}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              jobTitle: prev.jobTitle.filter((_, i) => i !== index)
                            }));
                          }}
                          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-emerald-400 hover:bg-emerald-200 hover:text-emerald-600 focus:outline-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Job Level</label>
              <select
                name="jobLevel"
                value={formData.jobLevel}
                onChange={handleChange}
                className="mt-1 block w-full border rounded p-2"
              >
                <option value="">Select Job Level</option>
                <option value="Entry Level">Entry Level</option>
                <option value="Junior">Junior</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Manager">Manager</option>
                <option value="Senior Manager">Senior Manager</option>
                <option value="Director">Director</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium">Mobile</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Mobile number"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-medium">Preferred Language</label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
            >
              <option value="English">English</option>
              <option value="French">French</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          {/* Staff Type */}
          <div>
            <label className="block text-sm font-medium">Staff Type <span className="text-red-500">*</span></label>
            <select
              name="staffType"
              value={formData.staffType}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            >
              <option value="">Select Staff Type</option>
              <option value="Direct">Direct</option>
              <option value="Contractor">Contractor</option>
              <option value="Agency">Agency</option>
              <option value="Team">Team</option>
            </select>
          </div>

          {/* POC */}
          <div>
            <label className="block text-sm font-medium">POC (Point of Contact)</label>
            <input
              type="text"
              name="poc"
              value={formData.poc}
              onChange={handleChange}
              placeholder="Point of Contact"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium">Nationality</label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              placeholder="Nationality"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          {/* Circet UIN & SCID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Circet UIN</label>
              <input
                type="text"
                name="circetUIN"
                value={formData.circetUIN}
                onChange={handleChange}
                placeholder="Circet UIN"
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Circet SCID</label>
              <input
                type="text"
                name="circetSCID"
                value={formData.circetSCID}
                onChange={handleChange}
                placeholder="Circet SCID"
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
          </div>

          {/* Morrisons ID & UIN */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Morrisons ID Number</label>
              <input
                type="text"
                name="morrisonsIDNumber"
                value={formData.morrisonsIDNumber}
                onChange={handleChange}
                placeholder="Morrisons ID Number"
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Morrisons UIN</label>
              <input
                type="text"
                name="morrisonsUIN"
                value={formData.morrisonsUIN}
                onChange={handleChange}
                placeholder="Morrisons UIN"
                className="mt-1 block w-full border rounded p-2"
              />
            </div>
          </div>

          {/* NOPS ID */}
          <div>
            <label className="block text-sm font-medium">NOPS ID</label>
            <input
              type="text"
              name="nopsID"
              value={formData.nopsID}
              onChange={handleChange}
              placeholder="NOPS ID"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium">Status <span className="text-red-500">*</span></label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border rounded p-2"
              required
            >
              <option value="">Select Status</option>
              <option value="Onboarded">Onboarded</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Dropped Out">Dropped Out</option>
              <option value="Left">Left</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="border px-4 py-2 rounded text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
