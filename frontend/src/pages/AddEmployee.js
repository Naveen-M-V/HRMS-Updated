import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs"; 


export default function AddEmployee() {
  const navigate = useNavigate();

  // Form data state
  const [formData, setFormData] = useState({
    // Basic details
    title: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "Unspecified",
    ethnicity: "Unspecified",
    dateOfBirth: "",
    emailAddress: "",
    mobileNumber: "",
    workPhone: "",
    jobTitle: "",
    department: "",
    team: "",
    office: "",
    employmentStartDate: "",
    probationEndDate: "",
    // Address details
    address1: "",
    address2: "",
    address3: "",
    townCity: "",
    county: "",
    postcode: "",
    // Emergency contact
    emergencyContacts: [],
    // Salary details
    salary: "0",
    rate: "",
    paymentFrequency: "",
    effectiveFrom: "",
    reason: "",
    payrollNumber: "",
    // Bank details
    accountName: "",
    bankName: "",
    bankBranch: "",
    accountNumber: "",
    sortCode: "",
    // Sensitive details
    taxCode: "",
    niNumber: "",
    // Passport
    passportNumber: "",
    passportCountry: "",
    passportExpiryDate: "",
    // Driving licence
    licenceNumber: "",
    licenceCountry: "",
    licenceClass: "",
    licenceExpiryDate: "",
    // Visa
    visaNumber: "",
    visaExpiryDate: "",
  });

  const [errors, setErrors] = useState({});
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (field === "emailAddress" && emailError) {
      setEmailError("");
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

 const handleSaveEmployee = async () => {
  const newErrors = {};

  // Validate required fields
  if (!formData.firstName) newErrors.firstName = "Required";
  if (!formData.lastName) newErrors.lastName = "Required";
  if (!formData.emailAddress) {
    newErrors.emailAddress = "Required";
    setEmailError("Please provide a valid email address.");
  } else if (!validateEmail(formData.emailAddress)) {
    newErrors.emailAddress = "Invalid";
    setEmailError("Please provide a valid email address.");
  }
  if (!formData.jobTitle) newErrors.jobTitle = "Required";
  if (!formData.department) newErrors.department = "Required";
  if (!formData.office) newErrors.office = "Required";
  if (!formData.employmentStartDate) {
    newErrors.employmentStartDate = "Required";
  }

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  // Save to EmployeeHub schema
  setLoading(true);

  try {
    // ✅ Convert start date format (DD/MM/YYYY → YYYY-MM-DD)
    const formattedStartDate = dayjs(
      formData.employmentStartDate,
      "DD/MM/YYYY"
    ).format("YYYY-MM-DD");

    const employeeData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.emailAddress,
      phone: formData.mobileNumber,
      jobTitle: formData.jobTitle,
      department: formData.department,
      team: formData.team || "",
      office: formData.office,
      startDate: formattedStartDate, // ✅ Correct format
      employmentType: "Full-time",
      status: "Active",
      isActive: true,
    };

    console.log("Payload being sent:", employeeData);

    const response = await axios.post(
      `${process.env.REACT_APP_API_BASE_URL}/employees`,
      employeeData
    );

    if (response.data.success) {
      console.log("Employee saved successfully:", response.data.data);
      alert("Employee created successfully!");
      navigate("/employee-hub");
    }
  } catch (error) {
    console.error("Error saving employee:", error);
    if (error.response?.data?.message) {
      alert(error.response.data.message);
    } else {
      alert("Failed to save employee. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};


  const handleCancel = () => {
    navigate("/employee-hub");
  };

  const renderEmployeeDetails = () => {
    return (
      <div className="space-y-6">
        {/* Basic details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Basic details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <select
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Title</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Miss">Miss</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
              </select>
            </div>

            {/* First name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First name{" "}
                <span className="text-pink-600 text-xs">Required</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>

            {/* Middle name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Middle name
              </label>
              <input
                type="text"
                placeholder="Middle name"
                value={formData.middleName}
                onChange={(e) => handleInputChange("middleName", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Last name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last name{" "}
                <span className="text-pink-600 text-xs">Required</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.lastName ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Unspecified">Unspecified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Ethnicity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ethnicity
              </label>
              <select
                value={formData.ethnicity}
                onChange={(e) => handleInputChange("ethnicity", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Unspecified">Unspecified</option>
                <option value="Asian">Asian</option>
                <option value="Black">Black</option>
                <option value="White">White</option>
                <option value="Mixed">Mixed</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date of birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of birth
              </label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address{" "}
                <span className="text-pink-600 text-xs">Required</span>
              </label>
              <input
                type="email"
                placeholder="Email address"
                value={formData.emailAddress}
                onChange={(e) =>
                  handleInputChange("emailAddress", e.target.value)
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.emailAddress ? "border-red-500" : "border-gray-300"
                }`}
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>

            {/* Mobile number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile number
              </label>
              <input
                type="tel"
                placeholder="Mobile number"
                value={formData.mobileNumber}
                onChange={(e) =>
                  handleInputChange("mobileNumber", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Work phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work phone
              </label>
              <input
                type="tel"
                placeholder="Work phone"
                value={formData.workPhone}
                onChange={(e) => handleInputChange("workPhone", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Job title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job title{" "}
                <span className="text-pink-600 text-xs">Required</span>
              </label>
              <input
                type="text"
                placeholder="Job title"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.jobTitle ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department{" "}
                <span className="text-pink-600 text-xs">Required</span>
              </label>
              <input
                type="text"
                placeholder="Department"
                value={formData.department}
                onChange={(e) => handleInputChange("department", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.department ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>

            {/* Team */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team
              </label>
              <input
                type="text"
                placeholder="Team (optional)"
                value={formData.team}
                onChange={(e) => handleInputChange("team", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Office */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Office{" "}
                <span className="text-pink-600 text-xs">Required</span>
              </label>
              <input
                type="text"
                placeholder="Office location"
                value={formData.office}
                onChange={(e) => handleInputChange("office", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.office ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>

            {/* Employment start date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment start date{" "}
                <span className="text-pink-600 text-xs">Required</span>
              </label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={formData.employmentStartDate}
                onChange={(e) =>
                  handleInputChange("employmentStartDate", e.target.value)
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.employmentStartDate
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.employmentStartDate && (
                <p className="text-red-500 text-xs mt-1">
                  Start date is required.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Probation end date */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Probation Period
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Probation end date
              </label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={formData.probationEndDate}
                onChange={(e) =>
                  handleInputChange("probationEndDate", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Address details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Address details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address 1
              </label>
              <input
                type="text"
                placeholder="Address 1"
                value={formData.address1}
                onChange={(e) => handleInputChange("address1", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address 2
              </label>
              <input
                type="text"
                placeholder="Address 2"
                value={formData.address2}
                onChange={(e) => handleInputChange("address2", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address 3
              </label>
              <input
                type="text"
                placeholder="Address 3"
                value={formData.address3}
                onChange={(e) => handleInputChange("address3", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Town/City
              </label>
              <input
                type="text"
                placeholder="Town/City"
                value={formData.townCity}
                onChange={(e) => handleInputChange("townCity", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County
              </label>
              <input
                type="text"
                placeholder="County"
                value={formData.county}
                onChange={(e) => handleInputChange("county", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postcode
              </label>
              <input
                type="text"
                placeholder="Postcode"
                value={formData.postcode}
                onChange={(e) => handleInputChange("postcode", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Emergency contact */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Emergency contact
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <p className="text-sm text-gray-700">
                Add an emergency contact in case something unexpected happens.
              </p>
            </div>
          </div>
          <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
            Add Emergency Contact
          </button>
        </div>

        {/* Salary details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Salary details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary
              </label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => handleInputChange("salary", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate
              </label>
              <select
                value={formData.rate}
                onChange={(e) => handleInputChange("rate", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select rate</option>
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Annually">Annually</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment frequency
              </label>
              <select
                value={formData.paymentFrequency}
                onChange={(e) =>
                  handleInputChange("paymentFrequency", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select frequency</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective from
              </label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={formData.effectiveFrom}
                onChange={(e) =>
                  handleInputChange("effectiveFrom", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <select
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select reason</option>
                <option value="New starter">New starter</option>
                <option value="Promotion">Promotion</option>
                <option value="Annual increase">Annual increase</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payroll number
              </label>
              <input
                type="text"
                placeholder="ABC123"
                value={formData.payrollNumber}
                onChange={(e) =>
                  handleInputChange("payrollNumber", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Bank details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bank details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name on account
              </label>
              <input
                type="text"
                placeholder="Account name"
                value={formData.accountName}
                onChange={(e) =>
                  handleInputChange("accountName", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Account name. Max 60 chars
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name of bank
              </label>
              <input
                type="text"
                placeholder="Bank name"
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Bank name. Max 60 chars
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank branch
              </label>
              <input
                type="text"
                placeholder="Bank branch"
                value={formData.bankBranch}
                onChange={(e) =>
                  handleInputChange("bankBranch", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Bank branch location
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account number
              </label>
              <input
                type="text"
                placeholder="8 digit number"
                value={formData.accountNumber}
                onChange={(e) =>
                  handleInputChange("accountNumber", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">8 digit number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort code
              </label>
              <input
                type="text"
                placeholder="00-00-00"
                value={formData.sortCode}
                onChange={(e) => handleInputChange("sortCode", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">E.g. 00-00-00</p>
            </div>
          </div>
        </div>

        {/* Sensitive details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sensitive details
          </h3>
          <h4 className="text-base font-semibold text-gray-800 mb-3">
            Tax, NI and eligibility information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax code
              </label>
              <input
                type="text"
                placeholder="Tax code"
                value={formData.taxCode}
                onChange={(e) => handleInputChange("taxCode", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NI number
              </label>
              <input
                type="text"
                placeholder="NI number"
                value={formData.niNumber}
                onChange={(e) => handleInputChange("niNumber", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Passport */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Passport</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passport number
              </label>
              <input
                type="text"
                placeholder="Passport number"
                value={formData.passportNumber}
                onChange={(e) =>
                  handleInputChange("passportNumber", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country of issue
              </label>
              <select
                value={formData.passportCountry}
                onChange={(e) =>
                  handleInputChange("passportCountry", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Country of issue</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="India">India</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passport expiry date
              </label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={formData.passportExpiryDate}
                onChange={(e) =>
                  handleInputChange("passportExpiryDate", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Driving licence */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Driving licence
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Licence number
              </label>
              <input
                type="text"
                placeholder="Licence number"
                value={formData.licenceNumber}
                onChange={(e) =>
                  handleInputChange("licenceNumber", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country of issue
              </label>
              <select
                value={formData.licenceCountry}
                onChange={(e) =>
                  handleInputChange("licenceCountry", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Country of issue</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="India">India</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Licence class
              </label>
              <input
                type="text"
                placeholder="Licence class"
                value={formData.licenceClass}
                onChange={(e) =>
                  handleInputChange("licenceClass", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of expiry
              </label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={formData.licenceExpiryDate}
                onChange={(e) =>
                  handleInputChange("licenceExpiryDate", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Visa */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Visa</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visa number
              </label>
              <input
                type="text"
                placeholder="Visa number"
                value={formData.visaNumber}
                onChange={(e) =>
                  handleInputChange("visaNumber", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visa expiry date
              </label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={formData.visaExpiryDate}
                onChange={(e) =>
                  handleInputChange("visaExpiryDate", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Creation</h1>
        <p className="text-gray-600">Add a new employee to the system</p>
      </div>

      {/* Form Container */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg border border-gray-200 p-8">
        {/* Employee Details Form */}
        {renderEmployeeDetails()}

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEmployee}
            disabled={loading}
            className="px-8 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Saving...' : 'Save Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}