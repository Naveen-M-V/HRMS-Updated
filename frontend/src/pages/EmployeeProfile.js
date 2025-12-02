import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar,
  Clock,
  Plus,
  Filter,
  ChevronDown,
  Briefcase,
  FileText,
  UserGroup,
  AlertCircle,
  FolderOpen,
  Upload,
  Phone,
  CreditCard,
  Shield,
  Home,
  Users,
  Download
} from 'lucide-react';
import axios from '../utils/axiosConfig';
import AddLeaveModal from '../components/AddLeaveModal';

const EmployeeProfile = () => {
  const [showLeaveModal, setShowLeaveModal] = React.useState(false);
  // Dummy refreshAbsences stub
  const refreshAbsences = () => {};
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'employment', label: 'Employment' },
    { id: 'emergencies', label: 'Emergencies' },
    { id: 'documents', label: 'Documents' },
    { id: 'absence', label: 'Absence' },
    { id: 'overtime', label: 'Overtime' }
  ];

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    try {
      // Validate MongoDB ObjectId format (24 hex characters)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!objectIdPattern.test(employeeId)) {
        console.error('Invalid employee ID format:', employeeId);
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/employees/${employeeId}`);
      
      if (response.data.success && response.data.data) {
        // Successfully fetched employee data
        setEmployee(response.data.data);
      } else {
        console.error('Employee not found or API returned unsuccessful response');
        setEmployee(null);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      if (error.response?.status === 404) {
        console.error('Employee not found (404)');
      } else if (error.response?.status === 400) {
        console.error('Invalid request (400)');
      }
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const sendRegistrationEmail = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/employees/${employeeId}/send-registration`);
      if (response.data.success) {
        alert('Registration email sent successfully!');
      } else {
        alert('Failed to send registration email');
      }
    } catch (error) {
      console.error('Error sending registration email:', error);
      alert('Failed to send registration email');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* Employee Header - Pixel-accurate, screenshot-matched */}
<div className="bg-white border border-[#0056b3] rounded-lg p-6 mb-8">
  <div className="flex items-center gap-8">
    {/* Avatar */}
    <div className="relative">
      <div className="w-[160px] h-[160px] rounded-full bg-[#0056b3] flex items-center justify-center ring-4 ring-[#e6f0fa] overflow-hidden">
  {employee.profilePhoto ? (
    <img
      src={employee.profilePhoto}
      alt={employee.name || 'Employee'}
      className="w-full h-full object-cover rounded-full"
    />
  ) : (
    <span className="text-4xl font-bold text-white select-none">
      {employee.initials || (employee.name ? employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '')}
    </span>
  )}
</div>
      {/* Edit Icon */}
      <button
        className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md border border-gray-200 hover:bg-blue-50 transition-colors"
        title="Edit photo"
        tabIndex={0}
      >
        <svg className="w-5 h-5 text-[#e00070]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6 3 3-6 6H9v-3z" />
        </svg>
      </button>
    </div>
    {/* Details */}
    <div className="flex flex-col gap-1 text-left">
      <span className="text-2xl font-bold text-gray-900 leading-tight">
  {employee.name || employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : ''}
</span>
<span className="text-base text-gray-700">
  {employee.jobRole || employee.jobTitle || employee.position || ''}
</span>
<span className="flex items-center text-base text-gray-600 mt-1">
  <svg className="w-4 h-4 mr-2 text-[#0056b3]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 21a2 2 0 01-2.828 0l-4.243-4.343a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" /></svg>
  {employee.officeLocation || employee.workLocation || employee.OrganisationName || employee.office || ''}
</span>
<span className="flex items-center text-base text-gray-600 mt-1">
  <Mail className="w-4 h-4 mr-2 text-[#0056b3]" />
  {employee.email || employee.emailAddress || ''}
</span>
<span className="flex items-center text-base text-gray-600 mt-1">
  <Phone className="w-4 h-4 mr-2 text-[#0056b3]" />
  {employee.phoneNumber || employee.mobileNumber || employee.phone || employee.workPhone || ''}
</span>
    </div>
  </div>
</div>

      {/* Employee Identity Section */}
      {/* Avatar and info now in header above, so this section is removed */}

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'personal' && <PersonalTab employee={employee} />}
        {activeTab === 'employment' && <EmploymentTab employee={employee} />}
        {activeTab === 'emergencies' && <EmergenciesTab employee={employee} />}
        {activeTab === 'documents' && <DocumentsTab employee={employee} />}
        {activeTab === 'absence' && (
  <AbsenceTab employee={employee} onAddLeave={() => setShowLeaveModal(true)} />
)}
{showLeaveModal && (
  <AddLeaveModal
    employee={employee}
    onClose={() => setShowLeaveModal(false)}
    onSuccess={refreshAbsences}
  />
)}
        {activeTab === 'overtime' && <OvertimeTab employee={employee} />}
      </div>
    </div>
  );
};

// Absence Tab Component
const AbsenceTab = ({ employee, onAddLeave }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Side */}
      <div className="space-y-6">
        {/* Filter Dropdown */}
        <div className="relative">
          <select className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white">
            <option>Filter absences</option>
            <option>All absences</option>
            <option>This month</option>
            <option>This year</option>
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Annual Leave Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Annual leave to take</h3>
          <div className="text-3xl font-bold text-gray-900 mb-4">
            {employee.leaveBalance?.taken || 0} / {employee.leaveBalance?.total || 12} days
          </div>
          <div className="space-y-3">
            <button
  type="button"
  className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium"
  onClick={onAddLeave}
>
  Add annual leave
</button>
            <button
  type="button"
  className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium"
  onClick={onAddLeave}
>
  Add time off
</button>
            <button className="w-full px-4 py-2 text-blue-600 hover:text-blue-800 font-medium border border-blue-600 rounded-lg">
              Update carryover
            </button>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">All absences</h3>
        
        {/* Summary Boxes */}
        <div className="grid grid-cols-2 gap-4">
          {/* Sickness */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Sickness</h4>
              <button className="p-1 text-pink-600 hover:bg-pink-50 rounded">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {employee.absences?.sicknessCount || 0}
            </div>
            <div className="text-sm text-gray-500">occurrences</div>
          </div>

          {/* Lateness */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Lateness</h4>
              <button className="p-1 text-pink-600 hover:bg-pink-50 rounded">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {employee.absences?.latenessCount || 0}
            </div>
            <div className="text-sm text-gray-500">occurrences</div>
          </div>
        </div>

        {/* Absence List */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">Recent Absences</h4>
          </div>
          <div className="divide-y divide-gray-200">
            {employee.recentAbsences?.map((absence, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{absence.type}</div>
                  <div className="text-sm text-gray-500">{absence.date}</div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  absence.status === 'Approved' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {absence.status}
                </span>
              </div>
            )) || (
              <div className="p-4 text-center text-gray-500">
                No absences recorded
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmploymentTab = ({ employee }) => {
  return (
    <div className="space-y-8">
      {/* Pay Details Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pay Details</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
              <div className="text-gray-900 font-medium">{employee.salary || 'Not specified'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payroll cycle</label>
              <div className="text-gray-900 font-medium">{employee.payrollCycle || 'Not specified'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank name</label>
              <div className="text-gray-900 font-medium">{employee.bankName || 'Not specified'}</div>
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Account number</label>
              <div className="text-gray-900 font-medium">{employee.accountNumber || 'Not specified'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitive Details Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
  <div className="p-6 border-b border-gray-200">
    <div className="flex items-center space-x-2">
      <Shield className="w-5 h-5 text-orange-500" />
      <h3 className="text-lg font-semibold text-gray-900">Sensitive Details</h3>
    </div>
  </div>
  <div className="p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tax code</label>
        <div className="text-gray-900 font-medium">{employee.taxCode || employee.taxcode || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">National Insurance Number</label>
        <div className="text-gray-900 font-medium">{employee.niNumber || employee.nationalInsuranceNumber || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Passport number</label>
        <div className="text-gray-900 font-medium">{employee.passportNumber || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Passport country</label>
        <div className="text-gray-900 font-medium">{employee.passportCountry || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Passport expiry date</label>
        <div className="text-gray-900 font-medium">{employee.passportExpiryDate || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visa number</label>
        <div className="text-gray-900 font-medium">{employee.visaNumber || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visa expiry date</label>
        <div className="text-gray-900 font-medium">{employee.visaExpiryDate || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Driving licence number</label>
        <div className="text-gray-900 font-medium">{employee.licenceNumber || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Licence country</label>
        <div className="text-gray-900 font-medium">{employee.licenceCountry || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Licence class</label>
        <div className="text-gray-900 font-medium">{employee.licenceClass || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Licence expiry date</label>
        <div className="text-gray-900 font-medium">{employee.licenceExpiryDate || 'Not specified'}</div>
      </div>
    </div>
  </div>
</div>
    </div>
  );
};

const OvertimeTab = ({ employee }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Overtime Records</h3>
    <div className="text-center text-gray-500 py-8">
      Overtime tracking coming soon
    </div>
  </div>
);

const PersonalTab = ({ employee }) => {
  return (
    <div className="space-y-8">
      {/* Basic Details Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Basic Details</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
              <div className="text-gray-900 font-medium">{employee.name || 'Not specified'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <div className="text-gray-900 font-medium">{employee.gender || 'Not specified'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of birth</label>
              <div className="text-gray-900 font-medium">{employee.dateOfBirth || 'Not specified'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile number</label>
              <div className="text-gray-900 font-medium">{employee.mobileNumber || employee.phone || 'Not specified'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Details Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Address Details</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address line 1</label>
              <div className="text-gray-900 font-medium">{employee.addressLine1 || 'Not specified'}</div>
            </div>
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address line 2</label>
              <div className="text-gray-900 font-medium">{employee.addressLine2 || 'Not specified'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <div className="text-gray-900 font-medium">{employee.city || 'Not specified'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postal code</label>
              <div className="text-gray-900 font-medium">{employee.postalCode || 'Not specified'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <div className="text-gray-900 font-medium">{employee.country || 'Not specified'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmergenciesTab = ({ employee }) => {
  const contactName = employee.emergencyContactName;
  const contactRelation = employee.emergencyContactRelation;
  const contactPhone = employee.emergencyContactPhone;
  const contactEmail = employee.emergencyContactEmail;
  const hasContact = contactName || contactRelation || contactPhone || contactEmail;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
      </div>
      {hasContact ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-gray-900 text-lg font-semibold">{contactName || '-'}</span>
            {contactRelation && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">{contactRelation}</span>
            )}
          </div>
          <div className="space-y-2 mt-2">
            {contactPhone && (
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <a href={`tel:${contactPhone}`} className="hover:text-blue-600 transition-colors">{contactPhone}</a>
              </div>
            )}
            {contactEmail && (
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <a href={`mailto:${contactEmail}`} className="hover:text-blue-600 transition-colors">{contactEmail}</a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No emergency contact added.</h3>
        </div>
      )}
    </div>
  );
};

// Documents Tab with Document Manager
const DocumentsTab = ({ employee }) => {
  // Assume employee.folders or employee.documents is the real data array
  const folders = employee.folders || [];
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [documents, setDocuments] = useState([]);

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    setDocuments(folder.documents || []);
  };

  const handleBackToFolders = () => {
    setSelectedFolder(null);
    setDocuments([]);
  };

  if (!folders.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found.</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
      </div>
      {!selectedFolder ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => handleFolderClick(folder)}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <FolderOpen className="w-10 h-10 text-blue-600 group-hover:text-blue-700 transition-colors" />
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  {folder.documents ? folder.documents.length : 0} files
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {folder.name}
              </h4>
              <p className="text-sm text-gray-500">
                Last updated: {folder.documents?.[0]?.uploaded || 'N/A'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToFolders}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back
              </button>
              <div>
                <h4 className="font-semibold text-gray-900">{selectedFolder.name}</h4>
                <p className="text-sm text-gray-500">{documents.length} documents</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {documents.length ? documents.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{doc.name}</h5>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>Uploaded {doc.uploaded}</span>
                        {doc.version && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {doc.version}
                            </span>
                          </>
                        )}
                        {doc.expiry && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                              Expires {doc.expiry}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-4 text-center text-gray-500">No documents in this folder.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
