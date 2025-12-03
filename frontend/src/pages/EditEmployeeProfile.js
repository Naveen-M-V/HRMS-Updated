import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAlert } from "../components/AlertNotification";
import { DatePicker } from '../components/ui/date-picker';
import axios from '../utils/axiosConfig';
import ConfirmDialog from '../components/ConfirmDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function EditEmployeeProfile() {
  const { success, error } = useAlert();
  const [activeTab, setActiveTab] = useState("Basic Info");
  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    mobileNumber: "",
    dateOfBirth: "",
    gender: "",
    jobTitle: "",
    department: "",
    team: "",
    officeLocation: "",
    managerId: "",
    employeeId: "",
    status: "Active",
    startDate: "",
    // Emergency Contact
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    emergencyContactEmail: "",
    // Address
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "",
  });
  
  const { id } = useParams();
  const navigate = useNavigate();

  const tabs = ["Basic Info", "Contact", "Employment", "Emergency Contact", "Address"];

  useEffect(() => {
    if (!id) {
      navigate('/employees');
      return;
    }
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    setEmployeeLoading(true);
    try {
      const response = await axios.get(`/api/employees/${id}`);
      
      if (response.data.success && response.data.data) {
        const emp = response.data.data;
        setFormData({
          firstName: emp.firstName || "",
          lastName: emp.lastName || "",
          email: emp.email || "",
          phoneNumber: emp.phoneNumber || "",
          mobileNumber: emp.mobileNumber || "",
          dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split('T')[0] : "",
          gender: emp.gender || "",
          jobTitle: emp.jobTitle || "",
          department: emp.department || "",
          team: emp.team || "",
          officeLocation: emp.officeLocation || emp.office || "",
          managerId: emp.managerId?._id || emp.managerId || "",
          employeeId: emp.employeeId || "",
          status: emp.status || "Active",
          startDate: emp.startDate ? new Date(emp.startDate).toISOString().split('T')[0] : "",
          emergencyContactName: emp.emergencyContactName || "",
          emergencyContactRelation: emp.emergencyContactRelation || "",
          emergencyContactPhone: emp.emergencyContactPhone || "",
          emergencyContactEmail: emp.emergencyContactEmail || "",
          addressLine1: emp.addressLine1 || "",
          addressLine2: emp.addressLine2 || "",
          city: emp.city || "",
          postalCode: emp.postalCode || "",
          country: emp.country || "",
        });
      } else {
        error('Employee not found');
        navigate('/employees');
      }
    } catch (err) {
      console.error('Error loading employee:', err);
      error('Failed to load employee. Please try again.');
      navigate('/employees');
    } finally {
      setEmployeeLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const employeeData = {
        ...formData,
        office: formData.officeLocation, // Map officeLocation to office
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      };
      
      const response = await axios.put(`/api/employees/${id}`, employeeData);
      
      if (response.data.success) {
        success('Employee updated successfully!');
        navigate(`/employee/${id}`);
      } else {
        error(response.data.message || 'Failed to update employee');
      }
    } catch (err) {
      console.error("Failed to update employee:", err);
      console.error("Error response:", err.response?.data);
      
      // Show detailed validation errors if available
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors.map(e => e.message).join('\n');
        error(`Validation errors:\n${errorMessages}`);
      } else {
        error(err.response?.data?.message || 'Failed to update employee. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await axios.delete(`/api/employees/${id}`);
      
      if (response.data.success) {
        success('Employee deleted successfully!');
        navigate("/employees");
      } else {
        error(response.data.message || 'Failed to delete employee');
      }
    } catch (err) {
      console.error("Failed to delete employee:", err);
      error('Failed to delete employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/employee/${id}`);
  };

  if (employeeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-1/4 bg-white shadow p-4">
        <h2 className="font-semibold mb-4">Edit Employee</h2>
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
          {/* Basic Info */}
          {activeTab === "Basic Info" && (
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
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  id="employeeId"
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="Employee ID"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <DatePicker
                  label="Date of Birth"
                  value={formData.dateOfBirth || null}
                  onChange={(date) => handleChange({ target: { name: 'dateOfBirth', value: date ? date.format('YYYY-MM-DD') : '' } })}
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleChange({ target: { name: 'gender', value } })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Contact */}
          {activeTab === "Contact" && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
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
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  id="mobileNumber"
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="Mobile Number"
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          )}

          {/* Employment */}
          {activeTab === "Employment" && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  id="jobTitle"
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="Job Title"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Department"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                <input
                  id="team"
                  type="text"
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  placeholder="Team"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="officeLocation" className="block text-sm font-medium text-gray-700 mb-2">Office Location</label>
                <input
                  id="officeLocation"
                  type="text"
                  name="officeLocation"
                  value={formData.officeLocation}
                  onChange={handleChange}
                  placeholder="Office Location"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange({ target: { name: 'status', value } })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate || null}
                  onChange={(date) => handleChange({ target: { name: 'startDate', value: date ? date.format('YYYY-MM-DD') : '' } })}
                />
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {activeTab === "Emergency Contact" && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <input
                  id="emergencyContactName"
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  placeholder="Contact Name"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="emergencyContactRelation" className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <input
                  id="emergencyContactRelation"
                  type="text"
                  name="emergencyContactRelation"
                  value={formData.emergencyContactRelation}
                  onChange={handleChange}
                  placeholder="Relationship"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  id="emergencyContactPhone"
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="emergencyContactEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="emergencyContactEmail"
                  type="email"
                  name="emergencyContactEmail"
                  value={formData.emergencyContactEmail}
                  onChange={handleChange}
                  placeholder="Email"
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>
          )}

          {/* Address */}
          {activeTab === "Address" && (
            <div className="space-y-4 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                <input
                  id="addressLine1"
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="Address Line 1"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  id="addressLine2"
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
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
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  id="postalCode"
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Postal Code"
                  className="border p-2 rounded w-full"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  id="country"
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="border p-2 rounded w-full"
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

        <div className="mt-6">
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Employee"}
          </button>
        </div>
      </div>

      {/* Delete Employee Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Employee"
        description="Are you sure you want to delete this employee? This action cannot be undone."
        onConfirm={handleDelete}
        confirmText="Delete Employee"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
