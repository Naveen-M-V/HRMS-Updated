import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { CheckIcon } from "@heroicons/react/24/solid";

dayjs.extend(customParseFormat); 

export default function AddEmployee() {
  const navigate = useNavigate();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

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
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    emergencyContactEmail: "",
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

  // Step definitions
  const steps = [
    { id: 1, name: "Basic Details", description: "Personal information" },
    { id: 2, name: "Address Details", description: "Home address" },
    { id: 3, name: "Emergency Contact", description: "Emergency contact info" },
    { id: 4, name: "Account & Pay Details", description: "Salary and bank info" },
    { id: 5, name: "Sensitive Details", description: "Tax and document info" }
  ];

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

  // Step navigation functions
  const goToStep = (stepNumber) => {
    if (stepNumber >= 1 && stepNumber <= totalSteps) {
      setCurrentStep(stepNumber);
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Validation for current step
  const validateCurrentStep = () => {
    const newErrors = {};
    
    if (currentStep === 1) {
      // Basic Details validation
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
      } else {
        const parsedDate = dayjs(formData.employmentStartDate, "DD/MM/YYYY", true);
        if (!parsedDate.isValid()) {
          newErrors.employmentStartDate = "Invalid date format. Please use DD/MM/YYYY";
        }
      }
    }
    // Steps 2, 3, 4, 5 have no required fields, so they can be skipped
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveEmployee = async () => {
    // Final validation before saving
    if (!validateCurrentStep()) {
      return;
    }

    // Save to EmployeeHub schema
    setLoading(true);

    try {
      // Convert start date format (DD/MM/YYYY → YYYY-MM-DD)
      let formattedStartDate;
      
      // Check if the date is valid before formatting
      const parsedDate = dayjs(formData.employmentStartDate, "DD/MM/YYYY", true);
      if (!parsedDate.isValid()) {
        throw new Error("Invalid date format. Please use DD/MM/YYYY format.");
      }
      
      formattedStartDate = parsedDate.format("YYYY-MM-DD");

      const employeeData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.emailAddress,
        phone: formData.mobileNumber,
        jobTitle: formData.jobTitle,
        department: formData.department,
        team: formData.team || "",
        office: formData.office,
        startDate: formattedStartDate,
        employmentType: "Full-time",
        status: "Active",
        isActive: true,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/employees`,
        employeeData
      );

      if (response.data.success) {
        alert("Employee created successfully!");
        navigate("/employee-hub");
      }
    } catch (error) {
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

  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isClickable = step.id <= currentStep || step.id === currentStep + 1;
            
            return (
              <div key={step.id} className="flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => isClickable && goToStep(step.id)}
                    disabled={!isClickable}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      isCompleted
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : isCurrent
                        ? "bg-purple-600 text-white"
                        : isClickable
                        ? "bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </button>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      isCurrent ? "text-purple-600" : "text-gray-600"
                    }`}>
                      {step.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    step.id < currentStep ? "bg-purple-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicDetails();
      case 2:
        return renderAddressDetails();
      case 3:
        return renderEmergencyContact();
      case 4:
        return renderAccountPayDetails();
      case 5:
        return renderSensitiveDetails();
      default:
        return renderBasicDetails();
    }
  };

  const renderBasicDetails = () => {
    return (
      <div className="space-y-6">
        {/* Basic details */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Basic Details
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
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Probation Period
          </h4>
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAddressDetails = () => {
    return (
      <div className="space-y-6">

        {/* Address details */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Address Details
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

  const renderEmergencyContact = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Emergency Contact
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <p className="text-sm text-gray-700">
                Add an emergency contact in case something unexpected happens.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                placeholder="Full name"
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship
              </label>
              <select
                value={formData.emergencyContactRelation}
                onChange={(e) => handleInputChange("emergencyContactRelation", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select relationship</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Child">Child</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="Phone number"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Email address"
                value={formData.emergencyContactEmail}
                onChange={(e) => handleInputChange("emergencyContactEmail", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAccountPayDetails = () => {
    return (
      <div className="space-y-6">
        {/* Salary details */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Salary Details
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate
              </label>
              <select
                value={formData.rate}
                onChange={(e) => handleInputChange("rate", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                onChange={(e) => handleInputChange("paymentFrequency", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select frequency</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Monthly">Monthly</option>
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
                onChange={(e) => handleInputChange("payrollNumber", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Bank details */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Bank Details
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name on account
              </label>
              <input
                type="text"
                placeholder="Account name"
                value={formData.accountName}
                onChange={(e) => handleInputChange("accountName", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account number
              </label>
              <input
                type="text"
                placeholder="8 digit number"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSensitiveDetails = () => {
    return (
      <div className="space-y-6">
        {/* Tax and NI */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Tax & NI Information
          </h3>
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Passport */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Passport</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passport number
              </label>
              <input
                type="text"
                placeholder="Passport number"
                value={formData.passportNumber}
                onChange={(e) => handleInputChange("passportNumber", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country of issue
              </label>
              <select
                value={formData.passportCountry}
                onChange={(e) => handleInputChange("passportCountry", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                onChange={(e) => handleInputChange("passportExpiryDate", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Driving licence */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Driving Licence
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Licence number
              </label>
              <input
                type="text"
                placeholder="Licence number"
                value={formData.licenceNumber}
                onChange={(e) => handleInputChange("licenceNumber", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country of issue
              </label>
              <select
                value={formData.licenceCountry}
                onChange={(e) => handleInputChange("licenceCountry", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                Date of expiry
              </label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={formData.licenceExpiryDate}
                onChange={(e) => handleInputChange("licenceExpiryDate", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Visa */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Visa</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visa number
              </label>
              <input
                type="text"
                placeholder="Visa number"
                value={formData.visaNumber}
                onChange={(e) => handleInputChange("visaNumber", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                onChange={(e) => handleInputChange("visaExpiryDate", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Employee</h1>
        <p className="text-gray-600">Follow the simple 5 steps to complete your employee creation</p>
      </div>

      {/* Form Container */}
      <div className="max-w-6xl mx-auto bg-white rounded-lg border border-gray-200 p-8">
        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
              currentStep === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Prev
          </button>

          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            
            {currentStep === totalSteps ? (
              <button
                onClick={handleSaveEmployee}
                disabled={loading}
                className="px-8 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Saving...' : 'Save Employee'}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="px-8 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}