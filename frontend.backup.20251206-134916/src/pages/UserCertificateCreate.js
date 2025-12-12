// src/pages/UserCertificateCreate.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  DocumentIcon, 
  ArrowLeftIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import SearchableDropdown from '../components/SearchableDropdown';
import { useAlert } from "../components/AlertNotification";
import { getCertificatesForMultipleJobRoles, allCertificates } from '../data/certificateJobRoleMapping';
import { DatePicker } from '../components/ui/date-picker';
import dayjs from 'dayjs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const UserCertificateCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTab = searchParams.get('returnTab') || 'overview';
  const { success, error, warning, info } = useAlert();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
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
  const [suggestedCertificates, setSuggestedCertificates] = useState({ mandatory: [], alternative: [] });
  const [profileJobRoles, setProfileJobRoles] = useState([]);
  const [providers, setProviders] = useState([]);
  const [certificateNames, setCertificateNames] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003';

  useEffect(() => {
    if (user?.email) {
      fetchUserProfile();
    }
  }, [user]);

  // Load providers and certificate names on component mount
  useEffect(() => {
    fetchProviders();
    fetchCertificateNames();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles/by-email/${user.email}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const profileData = await response.json();
        setUserProfile(profileData);
        
        // Get job roles and suggested certificates
        let jobRoles = [];
        if (profileData.jobRole) {
          jobRoles = Array.isArray(profileData.jobRole) ? profileData.jobRole : [profileData.jobRole];
          jobRoles = jobRoles.filter(Boolean);
        }
        setProfileJobRoles(jobRoles);
        
        if (jobRoles.length > 0) {
          const certificates = getCertificatesForMultipleJobRoles(jobRoles);
          setSuggestedCertificates({
            mandatory: certificates.mandatory || [],
            alternative: certificates.alternative || []
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchCertificateNames = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certificate-names`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCertificateNames(data);
      }
    } catch (error) {
      console.error('Error fetching certificate names:', error);
    }
  };

  const handleProviderSearch = async (searchTerm) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers/search?q=${encodeURIComponent(searchTerm)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (error) {
      console.error('Error searching providers:', error);
    }
  };

  const handleAddProvider = async (providerName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: providerName }),
      });
      
      if (response.ok) {
        await fetchProviders();
        setFormData(prev => ({ ...prev, provider: providerName }));
      }
    } catch (error) {
      console.error('Error adding provider:', error);
    }
  };

  const handleCertificateNameSearch = async (searchTerm) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certificate-names/search?q=${encodeURIComponent(searchTerm)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCertificateNames(data);
      }
    } catch (error) {
      console.error('Error searching certificate names:', error);
    }
  };

  const handleAddCertificateName = async (certName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/certificate-names`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: certName }),
      });
      
      if (response.ok) {
        await fetchCertificateNames();
        setFormData(prev => ({ ...prev, certificate: certName }));
      }
    } catch (error) {
      console.error('Error adding certificate name:', error);
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
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (formData.certificateFile.size > maxSize) {
        newErrors.certificateFile = 'File size must be less than 5MB';
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
      error('User profile not found. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Convert dates to DD/MM/YYYY format
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const formDataToSend = new FormData();
      formDataToSend.append('certificate', formData.certificate);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('issueDate', formatDate(formData.issueDate));
      formDataToSend.append('expiryDate', formatDate(formData.expiryDate));
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
        success('Certificate added successfully!');
        navigate(`/user-dashboard?tab=${returnTab}`);
      } else {
        const errorData = await response.json();
        error(`Failed to add certificate: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error adding certificate:', err);
      error('Failed to add certificate. Please try again.');
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
              onClick={() => navigate(`/user-dashboard?tab=${returnTab}`)}
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
              {/* Job Role Info */}
              {profileJobRoles.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Your Job Role(s)</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileJobRoles.map((role, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Certificates */}
              {(suggestedCertificates.mandatory.length > 0 || suggestedCertificates.alternative.length > 0) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Suggested Certificates for Your Role</h3>
                  
                  {/* Mandatory Certificates */}
                  {suggestedCertificates.mandatory.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                        <h4 className="text-sm font-medium text-red-700">Mandatory Certificates</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggestedCertificates.mandatory.map((cert, idx) => {
                          const certCode = cert.code || cert;
                          const certInfo = allCertificates[certCode];
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, certificate: cert.description || certInfo?.name || certCode }))}
                              className="text-left px-3 py-2 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                            >
                              <div className="text-xs font-medium text-red-900">{certCode}</div>
                              <div className="text-xs text-red-700">{cert.description || certInfo?.name || 'Unknown Certificate'}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Alternative Certificates */}
                  {suggestedCertificates.alternative.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        <h4 className="text-sm font-medium text-green-700">Alternative Certificates</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {suggestedCertificates.alternative.map((cert, idx) => {
                          const certCode = cert.code || cert;
                          const certInfo = allCertificates[certCode];
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, certificate: cert.description || certInfo?.name || certCode }))}
                              className="text-left px-3 py-2 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                            >
                              <div className="text-xs font-medium text-green-900">{certCode}</div>
                              <div className="text-xs text-green-700">{cert.description || certInfo?.name || 'Unknown Certificate'}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-3">
                    Click on a certificate to auto-fill the name, or enter a custom certificate below.
                  </p>
                </div>
              )}

              {/* Certificate Name */}
              <div>
                <label htmlFor="certificate" className="block text-sm font-medium text-gray-700">
                  Certificate Name *
                </label>
                <SearchableDropdown
                  name="certificate"
                  value={formData.certificate}
                  onChange={(e) => setFormData(prev => ({ ...prev, certificate: e.target.value }))}
                  options={certificateNames}
                  placeholder="Type to search certificate names or add new..."
                  onSearch={handleCertificateNameSearch}
                  onAddNew={handleAddCertificateName}
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
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Safety">Safety</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                  name="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                  options={providers}
                  placeholder="Type to search providers or add new..."
                  onSearch={handleProviderSearch}
                  onAddNew={handleAddProvider}
                  className="mt-1"
                />
                {errors.provider && (
                  <p className="mt-1 text-sm text-red-600">{errors.provider}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  You can type to search existing providers or add a new one
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DatePicker
                    label="Issue Date *"
                    value={formData.issueDate || null}
                    onChange={(date) => handleInputChange({ target: { name: 'issueDate', value: date ? date.format('YYYY-MM-DD') : '' } })}
                    error={!!errors.issueDate}
                    helperText={errors.issueDate}
                  />
                </div>

                <div>
                  <DatePicker
                    label="Expiry Date"
                    value={formData.expiryDate || null}
                    onChange={(date) => handleInputChange({ target: { name: 'expiryDate', value: date ? date.format('YYYY-MM-DD') : '' } })}
                    minDate={formData.issueDate || undefined}
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
                    <p className="text-xs text-gray-500">PDF, PNG, JPG up to 5MB</p>
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
                  onClick={() => navigate(`/user-dashboard?tab=${returnTab}`)}
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
