// src/pages/EditCertificate.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCertificates } from "../context/CertificateContext";
import { useProfiles } from "../context/ProfileContext";
import { getCertificatesForJobRole, getAllJobRoles } from "../data/certificateJobRoleMapping";
import SearchableDropdown from "../components/SearchableDropdown";

export default function EditCertificate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { certificates, updateCertificate } = useCertificates();
  const { profiles } = useProfiles();
  
  const [formData, setFormData] = useState({
    certificate: "",
    description: "",
    issueDate: "",
    expiryDate: "",
    profileName: "",
    approvalStatus: "",
    isInterim: "",
    fileRequired: "",
    timeLogged: {
      days: "",
      hours: "",
      minutes: ""
    },
    supplier: "",
    totalCost: "",
    archived: ""
  });

  const [availableCertificates, setAvailableCertificates] = useState({ mandatory: [], optional: [] });
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  // Load suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const cert = certificates.find(c => (c.id || c._id) === id || (c.id || c._id) === parseInt(id));
    if (cert) {
      console.log('Loading certificate data:', cert);
      // Format dates to YYYY-MM-DD for date inputs
      const formatDate = (dateString) => {
        if (!dateString) return "";
        
        try {
          // Try to create a date object from the string
          const date = new Date(dateString);
          
          // Check if it's a valid date
          if (isNaN(date.getTime())) {
            console.warn('Invalid date string received:', dateString);
            return "";
          }
          
          // Adjust for timezone to ensure consistent date
          const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
          const formattedDate = localDate.toISOString().split('T')[0];
          
          console.log('Formatting date:', {
            original: dateString,
            parsed: date.toISOString(),
            formatted: formattedDate
          });
          
          return formattedDate;
        } catch (error) {
          console.error('Error formatting date:', dateString, error);
          return "";
        }
      };

      setFormData({
        certificate: cert.certificate || "",
        description: cert.description || cert.certificate || "",
        issueDate: formatDate(cert.issueDate),
        expiryDate: formatDate(cert.expiryDate),
        profileName: cert.profileName || "",
        approvalStatus: cert.status || "",
        isInterim: cert.isInterim || "Jobs",
        fileRequired: cert.fileRequired || "",
        timeLogged: {
          days: cert.timeLogged?.days || "0",
          hours: cert.timeLogged?.hours || "0",
          minutes: cert.timeLogged?.minutes || "0"
        },
        supplier: cert.provider || cert.supplier || "",
        totalCost: cert.cost || cert.totalCost || "",
        archived: cert.archived || "Unarchived"
      });
    }
  }, [id, certificates]);

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
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/suppliers`);
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
        console.log('Suppliers loaded:', data);
      } else {
        console.error('Failed to fetch suppliers:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
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
        setFormData(prev => ({ ...prev, supplier: supplierName }));
      } else {
        console.error('Failed to add supplier:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('timeLogged.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        timeLogged: {
          ...prev.timeLogged,
          [field]: value
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
    
    // Update certificate with new data - mapping to certificate page fields
    const formatDateForSubmit = (dateString) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date for submission:', dateString);
          return null;
        }
        const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        const isoString = utcDate.toISOString();
        console.log('Formatting date for submission:', {
          input: dateString,
          output: isoString
        });
        return isoString;
      } catch (error) {
        console.error('Error formatting date for submission:', dateString, error);
        return null;
      }
    };

    const updatedCert = {
      certificate: formData.certificate,
      description: formData.description,
      issueDate: formatDateForSubmit(formData.issueDate),
      expiryDate: formatDateForSubmit(formData.expiryDate),
      profileName: formData.profileName || "N/A", // This should come from form
      provider: formData.supplier,
      fileRequired: formData.fileRequired,
      active: "Yes", // Default active status
      status: formData.approvalStatus,
      cost: formData.totalCost,
      // Additional fields for backend
      approvalStatus: formData.approvalStatus,
      isInterim: formData.isInterim,
      timeLogged: formData.timeLogged,
      supplier: formData.supplier,
      totalCost: formData.totalCost,
      archived: formData.archived
    };

    try {
      await updateCertificate(id, updatedCert);
      navigate("/reporting/certificates");
    } catch (error) {
      console.error('Failed to update certificate:', error);
      // Still navigate back even if update fails (fallback was applied)
      navigate("/reporting/certificates");
    }
  };

  const handleCancel = () => {
    navigate("/reporting/certificates");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Edit Certificate</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white space-y-6">
        {/* Account */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">Account</label>
          <div className="col-span-8">
            <input
              type="text"
              value="Vitrux Ltd"
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-50"
            />
          </div>
        </div>

        {/* Name */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">Name</label>
          <div className="col-span-10">
            <input
              type="text"
              name="certificate"
              value={formData.certificate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">Description</label>
          <div className="col-span-10">
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Issue Date */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">Issue Date</label>
          <div className="col-span-10">
            <input
              type="date"
              name="issueDate"
              value={formData.issueDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Expiry Date */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">Expiry Date</label>
          <div className="col-span-10">
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Profile Name */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">Profile Name</label>
          <div className="col-span-10">
            <input
              type="text"
              name="profileName"
              value={formData.profileName}
              onChange={handleChange}
              placeholder="Enter profile name"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Approval Status */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">Approval Status</label>
          <div className="col-span-10">
            <select
              name="approvalStatus"
              value={formData.approvalStatus}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Status</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Is Interim */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">Is Interim</label>
          <div className="col-span-10">
            <select
              name="isInterim"
              value={formData.isInterim}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        {/* File Required */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">File Required</label>
          <div className="col-span-10">
            <select
              name="fileRequired"
              value={formData.fileRequired}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="True">True</option>
              <option value="False">False</option>
            </select>
          </div>
        </div>

        
        {/* Supplier */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">Supplier</label>
          <div className="col-span-10">
            <SearchableDropdown
              name="supplier"
              value={formData.supplier}
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
        </div>

        {/* Total Cost */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">Total Cost</label>
          <div className="col-span-10">
            <input
              type="text"
              name="totalCost"
              value={formData.totalCost}
              onChange={handleChange}
              placeholder="Enter total cost of the certificate"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Archived */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <label className="col-span-2 text-right font-medium">Archived</label>
          <div className="col-span-10">
            <select
              name="archived"
              value={formData.archived}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Unarchived">Unarchived</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
