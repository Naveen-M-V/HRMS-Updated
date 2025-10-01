// src/pages/ProfilesCreate.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "../context/ProfileContext";
import SearchableDropdown from "../components/SearchableDropdown";
import { API_BASE_URL } from '../utils/config';

export default function ProfilesCreate() {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    dob: "",
    company: "",
    jobRole: [],
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

  const [jobRoles, setJobRoles] = useState([]);
  const [jobLevels, setJobLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { addProfile } = useProfiles();

  // Fetch job roles and levels on component mount
  useEffect(() => {
    fetchJobRoles();
    fetchJobLevels();
  }, []);

  // List of approved job roles
  const approvedJobRoles = [
    "Spine Survey",
    "Heavy Cabling UG",
    "Cable Blowing",
    "Overblow",
    "Fibre Jointing (Ladder)",
    "Fibre Jointing (MEWP)",
    "Fibre Light Loss Testing (Ladder)",
    "Fibre Light Loss Testing (MEWP)",
    "Fibre Jointing - UG only",
    "Ribbon Fibre Jointing",
    "OFN Fibre Cabling - UG",
    "OFN Fibre Cabling - OH (Ladder)",
    "OFN Fibre Cabling - OH (MEWP)",
    "Rod and Rope",
    "FTTP Access Survey",
    "FTTP Quality Checks",
    "MDU Survey",
    "MDU Quality Checks",
    "MDU L2C",
    "Internal MDU Build",
    "FTTP L2C Home Install",
    "FTTP L2C step 1 (Ladder)",
    "FTTP L2C step 1 (MEWP)",
    "FTTP L2C step 1 - OH only (Ladder)",
    "FTTP L2C step 1 - OH only (MEWP)",
    "FTTP L2C repair (Ladder)",
    "FTTP L2C repair (MEWP)",
    "FTTP L2C step 2",
    "Optical Test Head Installation - Viavi",
    "Optical Test Head Installation - Exfo",
    "PTO",
    "Supervisor",
    "Poling - PEU Operative",
    "Poling - Overhead Copper dropwiring (Ladder)",
    "Poling - Overhead Copper dropwiring (MEWP)",
    "Poling - Overhead Copper Jointing (LADDER)",
    "Poling - Overhead Copper Jointing (MEWP)",
    "MEWP Operator",
    "Manual poling (provision and recovery)",
    "Pole recovery",
    "Pole Survey (AAP)",
    "Aerial cabling (LADDER)",
    "Aerial cabling (MEWP)",
    "Poling Labourer",
    "Blockages",
    "Chambers Modular",
    "Chambers Concrete",
    "Chambers Concrete advanced",
    "Carriageway Chambers",
    "Chambers Brick",
    "Manhole build",
    "Manhole Reroof",
    "Duct Laying Basic",
    "Duct Laying Intermediate",
    "Duct Laying Advanced",
    "Duct Slew Basic",
    "Duct Slew Intermediate",
    "Duct Slew Advanced",
    "Mole Ploughing",
    "Maintenance Excavation",
    "Reinstatement Operative - Footway",
    "Reinstatement Operative - Carriageway",
    "Frame and Cover footway",
    "Frame and Cover Carriageway",
    "DSLAM Construction",
    "PCP Construction",
    "Desilting, Gully sucking or Manhole survey",
    "Narrow Trenching",
    "Labourer",
    "Trial Hole Excavation",
    "FTTC Commissioning",
    "Copper Frames",
    "Fibre Frames - Accredited for correct frame type",
    "CAL/OMI (Ladder)",
    "CAL/OMI (MEWP)",
    "Copper Jointing UG",
    "Copper First Look UG",
    "FTTC MI (LADDER)",
    "FTTC MI (MEWP)",
    "FTTC SI",
    "PCP Maintenance",
    "Heavy cable recovery",
    "Supply and Install Engineer",
    "Supply and Install - Fibre Cable installation",
    "Supply and Install - Mobile installation",
    "Supply and Install - Civils",
    "Ancillary Wiring or LLU Cabling",
    "Auxillary Overhead",
    "DSLAM Power Meter",
    "DSLAM - Power (RCD)",
    "DSLAM Battery Replacement or Rotation",
    "Conductive Concrete",
    "Equipotential Bonding"
  ];

  const fetchJobRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/job-roles`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job roles: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter the job roles to only include approved ones
      const filteredRoles = data.filter(role => approvedJobRoles.includes(role.name));
      
      // Sort the roles to match the approved order
      const sortedRoles = filteredRoles.sort((a, b) => {
        return approvedJobRoles.indexOf(a.name) - approvedJobRoles.indexOf(b.name);
      });
      
      setJobRoles(sortedRoles);
    } catch (error) {
      console.error('Error fetching job roles:', error);
      setJobRoles([]);
    }
  };

  const fetchJobLevels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/job-levels`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job levels: ${response.status}`);
      }

      const data = await response.json();
      setJobLevels(data);
    } catch (error) {
      console.error('Error fetching job levels:', error);
      setJobLevels([]);
    } finally {
      setLoading(false);
    }
  };




  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleJobRoleChange = (jobRole) => {
    setFormData((prev) => {
      const currentJobRoles = prev.jobRole || [];
      const isSelected = currentJobRoles.includes(jobRole);
      
      if (isSelected) {
        // Remove job role and also update jobTitle
        const updatedRoles = currentJobRoles.filter(role => role !== jobRole);
        return {
          ...prev,
          jobRole: updatedRoles,
          jobTitle: updatedRoles // Keep jobTitle in sync with jobRole
        };
      } else {
        // Add job role and also update jobTitle
        const updatedRoles = [...currentJobRoles, jobRole];
        return {
          ...prev,
          jobRole: updatedRoles,
          jobTitle: updatedRoles // Keep jobTitle in sync with jobRole
        };
      }
    });
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
      jobRole: Array.isArray(formData.jobRole) ? formData.jobRole : (formData.jobRole ? [formData.jobRole] : []),
      jobTitle: Array.isArray(formData.jobRole) ? formData.jobRole : (formData.jobRole ? [formData.jobRole] : []), // Copy jobRole to jobTitle for display
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
      console.log('Profile data that failed:', newProfile);
      
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

          {/* Date of Birth & Company */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>


          {/* Job Role & Job Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Job Roles</label>
              {loading ? (
                <div className="mt-1 block w-full border rounded p-2 bg-gray-50">
                  Loading job roles...
                </div>
              ) : (
                <>
                  <SearchableDropdown
                    name="jobRole"
                    value={formData.jobRole}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!formData.jobRole.includes(value)) {
                        setFormData(prev => ({
                          ...prev,
                          jobRole: [...prev.jobRole, value]
                        }));
                      }
                    }}
                    options={jobRoles.map(role => ({ name: role.name, _id: role._id }))}
                    placeholder="Type to search job roles..."
                    className="w-full mb-2"
                    isMultiSelect={true}
                  />
                  {formData.jobRole.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Selected ({formData.jobRole.length}):</div>
                      <div className="flex flex-wrap gap-1">
                        {formData.jobRole.map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                          >
                            {role}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  jobRole: prev.jobRole.filter(r => r !== role)
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
                </>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {jobRoles.length > 0 ? `${jobRoles.length} job roles available` : 'No job roles available'}. You can select multiple roles.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium">Job Level</label>
              {loading ? (
                <div className="mt-1 block w-full border rounded p-2 bg-gray-50">
                  Loading job levels...
                </div>
              ) : (
                <select
                  name="jobLevel"
                  value={formData.jobLevel}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded p-2"
                  required
                >
                  <option value="">Select job level...</option>
                  {jobLevels.map((level) => (
                    <option key={level._id} value={level.name}>
                      {level.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {jobLevels.length} job levels available. Select the appropriate level.
              </p>
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
