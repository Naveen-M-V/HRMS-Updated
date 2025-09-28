import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateCertificateSimple() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    profile: "",
    certificateName: "",
    issueDate: "",
    expiryDate: "",
    certificateFile: null
  });

  // Load profiles on component mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profiles', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profiles loaded:', data);
        setProfiles(data);
      } else {
        throw new Error('Failed to fetch profiles');
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        certificateFile: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.profile) {
      alert('Please select a profile');
      return;
    }
    
    if (!form.certificateName) {
      alert('Please enter a certificate name');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profile', form.profile);
      formData.append('certificateName', form.certificateName);
      formData.append('issueDate', form.issueDate);
      formData.append('expiryDate', form.expiryDate);
      
      if (form.certificateFile) {
        formData.append('certificateFile', form.certificateFile);
      }

      const response = await fetch('/api/certificates', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        alert('Certificate created successfully!');
        navigate('/certificates');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create certificate');
      }
    } catch (error) {
      console.error('Error creating certificate:', error);
      alert(`Failed to create certificate: ${error.message}`);
    }
  };

  const handleCancel = () => {
    navigate('/certificates');
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profiles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Page</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <button 
            onClick={fetchProfiles}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-semibold mb-6">Create Certificate</h1>

      <div className="w-full max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile <span className="text-red-500">*</span>
            </label>
            <select
              name="profile"
              value={form.profile}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">Select a profile...</option>
              {profiles.map((profile) => (
                <option key={profile._id} value={profile._id}>
                  {profile.firstName} {profile.lastName} - {profile.email}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {profiles.length} profiles available
            </p>
          </div>

          {/* Certificate Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificate Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="certificateName"
              value={form.certificateName}
              onChange={handleChange}
              placeholder="Enter certificate name (e.g., SA006, IPAF 1B, etc.)"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          {/* Issue Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Date
            </label>
            <input
              type="date"
              name="issueDate"
              value={form.issueDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={form.expiryDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Certificate File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Certificate File
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {form.certificateFile && (
              <p className="text-sm text-green-600 mt-2">
                Selected: {form.certificateFile.name}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF, JPEG, PNG (max 10MB)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
            >
              Create Certificate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
