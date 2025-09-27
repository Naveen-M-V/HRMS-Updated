// src/pages/UserCertificateCreate.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentIcon, 
  ArrowLeftIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import SearchableDropdown from '../components/SearchableDropdown';
import usePageTitle from '../hooks/usePageTitle';

const UserCertificateCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  usePageTitle("Add Certificate");
  const [formData, setFormData] = useState({
    certificate: '',
    category: '',
    issueDate: '',
    expiryDate: '',
    provider: '',
    cost: '',
    certificateFile: null
  });
  const [errors, setErrors] = useState({});

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

  useEffect(() => {
    if (user?.email) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/by-email/${user.email}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const profileData = await response.json();
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      certificateFile: file
    }));
    
    if (errors.certificateFile) {
      setErrors(prev => ({
        ...prev,
        certificateFile: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.certificate.trim()) {
      newErrors.certificate = 'Certificate name is required';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }
    
    if (!formData.provider.trim()) {
      newErrors.provider = 'Provider is required';
    }

    if (!formData.certificateFile) {
      newErrors.certificateFile = 'Certificate file is required';
    } else {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(formData.certificateFile.type)) {
        newErrors.certificateFile = 'Only PDF, JPEG, and PNG files are allowed';
      }
      
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (formData.certificateFile.size > maxSize) {
        newErrors.certificateFile = 'File size must be less than 10MB';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!userProfile) {
      alert('User profile not found. Please try again.');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('certificate', formData.certificate);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('issueDate', formData.issueDate);
      formDataToSend.append('expiryDate', formData.expiryDate);
      formDataToSend.append('provider', formData.provider);
      formDataToSend.append('cost', formData.cost);
      formDataToSend.append('profileId', userProfile._id);
      formDataToSend.append('profileName', `${userProfile.firstName} ${userProfile.lastName}`);
      formDataToSend.append('jobRole', Array.isArray(userProfile.jobRole) ? userProfile.jobRole.join(', ') : userProfile.jobRole || '');
      formDataToSend.append('status', 'Active');
      formDataToSend.append('active', 'Yes');
      
      if (formData.certificateFile) {
        formDataToSend.append('certificateFile', formData.certificateFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/certificates`, {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      if (response.ok) {
        alert('Certificate added successfully!');
        navigate('/user-dashboard');
      } else {
        const errorData = await response.json();
        alert(`Failed to add certificate: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding certificate:', error);
      alert('Failed to add certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={() => navigate('/user-dashboard')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <DocumentIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add Certificate</h1>
                <p className="text-sm text-gray-500">Upload a new certificate to your profile</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Certificate Name */}
              <div>
                <label htmlFor="certificate" className="block text-sm font-medium text-gray-700">
                  Certificate Name *
                </label>
                <SearchableDropdown
                  value={formData.certificate}
                  onChange={(value) => setFormData(prev => ({ ...prev, certificate: value }))}
                  placeholder="Enter or search certificate name"
                  apiEndpoint="/api/certificate-names/search"
                  className="mt-1"
                />
                {errors.certificate && (
                  <p className="mt-1 text-sm text-red-600">{errors.certificate}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a category</option>
                  <option value="Safety">Safety</option>
                  <option value="Technical">Technical</option>
                  <option value="Professional">Professional</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Training">Training</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* Provider */}
              <div>
                <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
                  Provider *
                </label>
                <SearchableDropdown
                  value={formData.provider}
                  onChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}
                  placeholder="Enter or search provider name"
                  apiEndpoint="/api/suppliers/search"
                  className="mt-1"
                />
                {errors.provider && (
                  <p className="mt-1 text-sm text-red-600">{errors.provider}</p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    id="issueDate"
                    name="issueDate"
                    value={formData.issueDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.issueDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.issueDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Cost */}
              <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                  Cost (Optional)
                </label>
                <input
                  type="text"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  placeholder="e.g., £150"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="certificateFile" className="block text-sm font-medium text-gray-700">
                  Certificate File *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="certificateFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="certificateFile"
                          name="certificateFile"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                    {formData.certificateFile && (
                      <p className="text-sm text-green-600">
                        Selected: {formData.certificateFile.name}
                      </p>
                    )}
                  </div>
                </div>
                {errors.certificateFile && (
                  <p className="mt-1 text-sm text-red-600">{errors.certificateFile}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/user-dashboard')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCertificateCreate;
