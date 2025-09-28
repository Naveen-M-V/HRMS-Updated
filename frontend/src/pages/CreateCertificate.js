import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCertificates } from "../context/CertificateContext";
import { useProfiles } from "../context/ProfileContext";
import { getCertificatesForJobRole, getAllJobRoles, allCertificates } from "../data/certificateJobRoleMapping";
import SearchableDropdown from "../components/SearchableDropdown";

export default function CreateCertificate() {
  const navigate = useNavigate();
  const { addCertificate } = useCertificates();
  const { profiles } = useProfiles();

  const [form, setForm] = useState({
    profile: "",
    certificateName: "",
    account: "",
    description: "",
    issueDate: "",
    expiryDate: "",
    approvalStatus: "",
    isInterim: "False",
    fileRequired: "True",
    timeLoggedDays: "",
    timeLoggedHours: "",
    timeLoggedMinutes: "",
    supplier: "",
    totalCost: "",
    certificateFile: null
  });

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [certificateNames, setCertificateNames] = useState([]);

  // Load suppliers and certificate names on component mount
  useEffect(() => {
    fetchSuppliers();
    fetchCertificateNames();
    initializeCertificateNames();
  }, []);

  const getApiUrl = () => {
    // In development, use localhost URL
    if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    // In production or when API_BASE_URL is relative, use relative path
    if (process.env.REACT_APP_API_BASE_URL?.startsWith('/')) {
      return '';
    }
    // Fallback to localhost for development
    return process.env.REACT_APP_API_URL || 'http://localhost:5003';
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/suppliers`);
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      } else {
        console.error('Failed to fetch suppliers:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchCertificateNames = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/certificate-names`);
      if (response.ok) {
        const data = await response.json();
        setCertificateNames(data);
      }
    } catch (error) {
      console.error('Error fetching certificate names:', error);
    }
  };

  const initializeCertificateNames = async () => {
    try {
      await fetch(`${getApiUrl()}/api/certificate-names/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error initializing certificate names:', error);
    }
  };

  const handleSupplierSearch = async (searchTerm) => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/suppliers/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      } else {
        console.error('Failed to search suppliers:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error searching suppliers:', error);
    }
  };

  const handleAddSupplier = async (supplierName) => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: supplierName }),
      });
      
      if (response.ok) {
        const newSupplier = await response.json();
        console.log('New supplier added:', newSupplier);
        // Update suppliers list
        fetchSuppliers();
        // Update form
        setForm(prev => ({ ...prev, supplier: supplierName }));
      } else {
        console.error('Failed to add supplier:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
    }
  };

  const handleCertificateNameSearch = async (searchTerm) => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/certificate-names/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setCertificateNames(data);
      } else {
        console.error('Failed to search certificate names:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error searching certificate names:', error);
    }
  };

  const handleAddCertificateName = async (certificateName) => {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/certificate-names`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: certificateName }),
      });
      
      if (response.ok) {
        const newCertificateName = await response.json();
        console.log('New certificate name added:', newCertificateName);
        // Update certificate names list
        fetchCertificateNames();
        // Update form
        setForm(prev => ({ ...prev, certificateName: certificateName }));
      } else {
        console.error('Failed to add certificate name:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error adding certificate name:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Handle profile selection change
    if (name === 'profile') {
      const profile = profiles.find(p => `${p.firstName} ${p.lastName}` === value);
      setSelectedProfile(profile);
      
      // Reset certificate selection when profile changes
      setForm(prev => ({ ...prev, certificateName: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit. Please select a smaller file.');
        e.target.value = '';
        return;
      }
      
      // Check file type
      if (file.type === 'application/pdf' || 
          file.type === 'image/jpeg' || 
          file.type === 'image/png' || 
          file.type === 'image/jpg') {
        setForm({ ...form, certificateFile: file });
      } else {
        alert('Please select a PDF, JPEG, or PNG file only.');
        e.target.value = '';
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!form.profile) {
      alert('Please select a profile');
      return;
    }
    
    if (!form.certificateName) {
      alert('Please select or enter a certificate name');
      return;
    }
    
    // Transform form data to match certificate structure
    const newCertificate = {
      // Required fields for backend validation
      certificate: form.certificateName || "New Certificate",
      category: "Other",
      
      // Other fields
      description: form.description || "",
      account: form.account || "",
      issueDate: new Date(form.issueDate).toLocaleDateString('en-GB'),
      expiryDate: new Date(form.expiryDate).toLocaleDateString('en-GB'),
      profileName: form.profile || "Unknown Profile",
      provider: form.supplier || "SKILLS PROVIDER",
      fileRequired: form.fileRequired === "True" ? "Yes" : "No",
      status: form.approvalStatus || "Approved",
      cost: form.totalCost || "0.00",
      jobRole: selectedProfile ? selectedProfile.jobTitle : "Unknown",
      approvalStatus: form.approvalStatus || "Approved",
      isInterim: form.isInterim || "False",
      
      supplier: form.supplier || "",
      totalCost: form.totalCost || "0.00",
      certificateFile: form.certificateFile ? form.certificateFile.name : null,
      fileData: form.certificateFile
    };

    // Add certificate to context
    addCertificate(newCertificate)
      .then(() => {
        alert('Certificate created successfully!');
        // Navigate to certificates page
        navigate("/reporting/certificates");
      })
      .catch((error) => {
        console.error('Error creating certificate:', error);
        alert('Failed to create certificate. Please try again.');
      });
  };

  const handleCancel = () => {
    navigate(-1); // go back one page
    // OR navigate("/certificates"); // redirect to certificate list
  };

  return (
    <div className="flex">
      {/* Main content */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-semibold mb-6">Create Certificate</h1>

<div className="w-full max-w-6xl mx-auto bg-white shadow-md rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile */}
           {/* Profile Selection */}
          <div>
            <label className="block font-medium mb-1">Profile <span className="text-red-500">*</span></label>
            <select
              name="profile"
              value={form.profile}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            >
              <option value="">Select a profile...</option>
              {profiles.map((profile) => (
                <option key={profile._id} value={`${profile.firstName} ${profile.lastName}`}>
                  {profile.firstName} {profile.lastName} - {Array.isArray(profile.jobTitle) 
                    ? profile.jobTitle.join(', ') 
                    : (profile.jobTitle || 'N/A')
                  }
                </option>
              ))}
            </select>
            {selectedProfile && (
              <p className="text-sm text-gray-600 mt-1">
                Job Role: <strong>{Array.isArray(selectedProfile.jobTitle) 
                  ? selectedProfile.jobTitle.join(', ') 
                  : (selectedProfile.jobTitle || 'N/A')
                }</strong>
              </p>
            )}
          </div>

          {/* Certificate Name */}
          <div>
            <label className="block font-medium mb-1">Certificate Name <span className="text-red-500">*</span></label>
            <SearchableDropdown
              name="certificateName"
              value={form.certificateName}
              onChange={handleChange}
              options={certificateNames}
              placeholder="Type to search certificates or add new..."
              onSearch={handleCertificateNameSearch}
              onAddNew={handleAddCertificateName}
              className="w-full"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              You can type to search existing certificates or add a new one
            </p>
          </div>

            {/* Account */}
            <div>
              <label className="block font-medium mb-1">Account</label>
              <input
                type="text"
                name="account"
                placeholder="Please select a profile above to proceed"
                value={form.account}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-medium mb-1">Description</label>
              <textarea
                name="description"
                placeholder="Description (optional)"
                value={form.description}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-medium mb-1">Issue Date</label>
                <input
                  type="date"
                  name="issueDate"
                  value={form.issueDate}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={form.expiryDate}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>

            {/* Approval Status */}
            <div>
              <label className="block font-medium mb-1">Approval Status</label>
              <select
                name="approvalStatus"
                value={form.approvalStatus}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
              >
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Is Interim */}
            <div>
              <label className="block font-medium mb-1">Is Interim</label>
              <select
                name="isInterim"
                value={form.isInterim}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
              >
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            </div>

            {/* File Required */}
            <div>
              <label className="block font-medium mb-1">File Required</label>
              <select
                name="fileRequired"
                value={form.fileRequired}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
              >
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            </div>

            {/* Supplier */}
            <div>
              <label className="block font-medium mb-1">Supplier</label>
              <SearchableDropdown
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                options={suppliers}
                placeholder="Type to search suppliers or add new..."
                onSearch={handleSupplierSearch}
                onAddNew={handleAddSupplier}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can type to search existing suppliers or add a new one
              </p>
            </div>

            {/* Total Cost */}
            <div>
              <label className="block font-medium mb-1">Total Cost</label>
              <input
                type="number"
                name="totalCost"
                placeholder="Enter total cost of the certificate"
                value={form.totalCost}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
              />
            </div>

            {/* Certificate PDF Upload */}
            <div>
              <label className="block font-medium mb-1">Upload Certificate File</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full border rounded-lg p-2"
              />
              {form.certificateFile && (
                <p className="text-sm text-green-600 mt-1">
                  Selected: {form.certificateFile.name}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Please upload the certificate in PDF, JPEG, or PNG format (max 10MB)
              </p>
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
    </div>
  );
}