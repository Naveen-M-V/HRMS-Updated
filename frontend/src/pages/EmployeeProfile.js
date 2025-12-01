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
  Upload
} from 'lucide-react';
import axios from '../utils/axiosConfig';

const EmployeeProfile = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('absence');

  const tabs = [
    { id: 'absence', label: 'Absence' },
    { id: 'employment', label: 'Employment' },
    { id: 'overtime', label: 'Overtime' },
    { id: 'personal', label: 'Personal' },
    { id: 'emergencies', label: 'Emergencies' },
    { id: 'documents', label: 'Documents' }
  ];

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/employees/${employeeId}`);
      setEmployee(response.data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
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
      await axios.post(`/api/employees/${employeeId}/send-registration`);
      alert('Registration email sent successfully!');
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Employee Profile</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Employee Identity Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            {/* Left Side - Avatar and Info */}
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {getInitials(employee.name)}
                </span>
              </div>
              
              {/* Employee Info */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a 
                    href={`mailto:${employee.email}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {employee.email}
                  </a>
                </div>
                <button
                  onClick={sendRegistrationEmail}
                  className="mt-3 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm font-medium"
                >
                  Send registration email
                </button>
              </div>
            </div>

            {/* Right Side - Working Status */}
            <div className="flex flex-col items-end space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {employee.workingStatus || 'Working from usual location'}
                  </span>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Set working status
              </button>
            </div>
          </div>
        </div>
      </div>

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
        {activeTab === 'absence' && <AbsenceTab employee={employee} />}
        {activeTab === 'employment' && <EmploymentTab employee={employee} />}
        {activeTab === 'overtime' && <OvertimeTab employee={employee} />}
        {activeTab === 'personal' && <PersonalTab employee={employee} />}
        {activeTab === 'emergencies' && <EmergenciesTab employee={employee} />}
        {activeTab === 'documents' && <DocumentsTab employee={employee} />}
      </div>
    </div>
  );
};

// Absence Tab Component
const AbsenceTab = ({ employee }) => {
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
            <button className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium">
              Add annual leave
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

// Placeholder Tab Components
const EmploymentTab = ({ employee }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Department</label>
        <div className="mt-1 text-gray-900">{employee.department || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Position</label>
        <div className="mt-1 text-gray-900">{employee.position || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Start Date</label>
        <div className="mt-1 text-gray-900">{employee.startDate || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Employment Type</label>
        <div className="mt-1 text-gray-900">{employee.employmentType || 'Not specified'}</div>
      </div>
    </div>
  </div>
);

const OvertimeTab = ({ employee }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Overtime Records</h3>
    <div className="text-center text-gray-500 py-8">
      Overtime tracking coming soon
    </div>
  </div>
);

const PersonalTab = ({ employee }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <div className="mt-1 text-gray-900">{employee.phone || 'Not specified'}</div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <div className="mt-1 text-gray-900">{employee.address || 'Not specified'}</div>
      </div>
    </div>
  </div>
);

const EmergenciesTab = ({ employee }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts</h3>
    <div className="text-center text-gray-500 py-8">
      Emergency contact management coming soon
    </div>
  </div>
);

// Documents Tab with Document Manager
const DocumentsTab = ({ employee }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      // Mock data for now
      setFolders([
        { id: 1, name: 'Employment Documents', count: 3 },
        { id: 2, name: 'Certifications', count: 2 },
        { id: 3, name: 'Performance Reviews', count: 5 }
      ]);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {!selectedFolder ? (
        /* Folder Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => setSelectedFolder(folder)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <FolderOpen className="w-8 h-8 text-blue-600 mb-3" />
              <h4 className="font-medium text-gray-900">{folder.name}</h4>
              <p className="text-sm text-gray-500 mt-1">{folder.count} documents</p>
            </div>
          ))}
        </div>
      ) : (
        /* Document List */
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedFolder(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h4 className="font-medium text-gray-900">{selectedFolder.name}</h4>
            </div>
            <button className="px-3 py-1 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm">
              Add Folder
            </button>
          </div>
          <div className="p-4">
            <div className="text-center text-gray-500 py-8">
              Documents in {selectedFolder.name} will appear here
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
