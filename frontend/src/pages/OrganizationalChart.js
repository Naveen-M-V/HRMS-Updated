import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  UserIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import ConfirmDialog from "../components/ConfirmDialog";

export default function OrganizationalChart() {
  const navigate = useNavigate();
  const [orgData, setOrgData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState("tree"); // "tree" or "compact"
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState([]);
  
  // Manager update state
  const [showManagerDialog, setShowManagerDialog] = useState(false);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [updatingManager, setUpdatingManager] = useState(false);

  const chartRef = useRef(null);

  // Fetch organizational chart data
  const fetchOrgChart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/employees/org-chart");
      if (response.data.success) {
        setOrgData(response.data.data);
        
        // Extract departments for filter
        const depts = new Set();
        const extractDepartments = (nodes) => {
          nodes.forEach(node => {
            if (node.department) depts.add(node.department);
            if (node.directReports && node.directReports.length > 0) {
              extractDepartments(node.directReports);
            }
          });
        };
        extractDepartments(response.data.data);
        setDepartments(Array.from(depts).sort());
        
        // Expand root nodes by default
        const rootIds = new Set(response.data.data.map(node => node.id));
        setExpandedNodes(rootIds);
      }
    } catch (err) {
      console.error("Error fetching organizational chart:", err);
      setError("Failed to load organizational chart. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgChart();
  }, [fetchOrgChart]);

  // Toggle node expansion
  const toggleNodeExpansion = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Filter nodes based on search and department
  const filterNodes = useCallback((nodes, search = "", dept = "all") => {
    return nodes.filter(node => {
      const matchesSearch = !search || 
        node.fullName.toLowerCase().includes(search.toLowerCase()) ||
        node.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        node.department?.toLowerCase().includes(search.toLowerCase()) ||
        node.team?.toLowerCase().includes(search.toLowerCase());
      
      const matchesDept = dept === "all" || node.department === dept;
      
      return matchesSearch && matchesDept;
    }).map(node => ({
      ...node,
      directReports: filterNodes(node.directReports || [], search, dept)
    }));
  }, []);

  // Get filtered data
  const filteredData = filterNodes(orgData, searchTerm, departmentFilter);

  // Employee card component
  const EmployeeCard = ({ employee, level = 0, isLast = false }) => {
    const isExpanded = expandedNodes.has(employee.id);
    const hasReports = employee.directReports && employee.directReports.length > 0;
    
    return (
      <div className="relative">
        {/* Employee card */}
        <div
          className={`
            relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
            ${level === 0 ? "border-blue-300 bg-blue-50" : "border-gray-200"}
            ${selectedEmployee?.id === employee.id ? "ring-2 ring-blue-500" : ""}
          `}
          onClick={() => {
            setSelectedEmployee(employee);
            setShowEmployeeModal(true);
          }}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                style={{ backgroundColor: employee.color || "#3B82F6" }}
              >
                {employee.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={employee.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  employee.initials || `${employee.firstName[0]}${employee.lastName[0]}`
                )}
              </div>
              
              {/* Employee info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {employee.fullName}
                </h3>
                <p className="text-sm text-gray-600 truncate">{employee.jobTitle}</p>
                <div className="flex items-center gap-4 mt-1">
                  {employee.department && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <BuildingOfficeIcon className="w-3 h-3" />
                      {employee.department}
                    </span>
                  )}
                  {employee.team && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <UserGroupIcon className="w-3 h-3" />
                      {employee.team}
                    </span>
                  )}
                </div>
                {hasReports && (
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNodeExpansion(employee.id);
                      }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                      )}
                      {employee.directReportsCount} direct report{employee.directReportsCount !== 1 ? "s" : ""}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Direct reports */}
        {hasReports && isExpanded && (
          <div className="relative mt-4 ml-8">
            {/* Connector line */}
            <div className="absolute left-0 top-0 w-px h-8 bg-gray-300 -translate-x-4" />
            
            {/* Reports container */}
            <div className="space-y-4">
              {employee.directReports.map((report, index) => (
                <div key={report.id} className="relative">
                  {/* Horizontal connector */}
                  <div className="absolute left-0 top-6 w-4 h-px bg-gray-300 -translate-x-4" />
                  
                  {/* Vertical connector for multiple reports */}
                  {employee.directReports.length > 1 && (
                    <>
                      {index === 0 && (
                        <div className="absolute left-0 top-6 w-px h-full bg-gray-300 -translate-x-4" />
                      )}
                      {index === employee.directReports.length - 1 && (
                        <div className="absolute left-0 top-0 w-px h-6 bg-gray-300 -translate-x-4" />
                      )}
                    </>
                  )}
                  
                  <EmployeeCard
                    employee={report}
                    level={level + 1}
                    isLast={index === employee.directReports.length - 1}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  // Update manager
  const handleUpdateManager = async () => {
    if (!selectedEmployee || !selectedManager) return;
    
    setUpdatingManager(true);
    try {
      const response = await axios.patch(
        `/api/employees/${selectedEmployee.id}/manager`,
        { managerId: selectedManager === "none" ? null : selectedManager }
      );
      
      if (response.data.success) {
        setShowManagerDialog(false);
        setSelectedManager("");
        fetchOrgChart(); // Refresh data
      }
    } catch (err) {
      console.error("Error updating manager:", err);
      setError("Failed to update manager. Please try again.");
    } finally {
      setUpdatingManager(false);
    }
  };

  // Load available managers for dialog
  const loadManagers = async () => {
    try {
      const response = await axios.get("/api/employees");
      if (response.data.success) {
        setAvailableManagers(response.data.data.filter(emp => 
          emp.isActive && emp.id !== selectedEmployee?.id
        ));
      }
    } catch (err) {
      console.error("Error loading managers:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Organizational Chart</h1>
                <p className="text-sm text-gray-500">Visualize your company's reporting structure</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrgChart}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Department filter */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Zoom controls */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-white rounded transition-colors"
                title="Zoom out"
              >
                <span className="text-sm font-medium">−</span>
              </button>
              <span className="text-sm font-medium px-2">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-white rounded transition-colors"
                title="Zoom in"
              >
                <span className="text-sm font-medium">+</span>
              </button>
              <button
                onClick={handleZoomReset}
                className="p-1 hover:bg-white rounded transition-colors"
                title="Reset zoom"
              >
                <span className="text-sm font-medium">⟲</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading organizational chart...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500">
              {searchTerm || departmentFilter !== "all" 
                ? "Try adjusting your search or filters"
                : "No employees available in the organizational chart"
              }
            </p>
          </div>
        ) : (
          <div
            ref={chartRef}
            className="overflow-auto bg-white rounded-lg border p-8"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          >
            <div className="inline-block min-w-full">
              {filteredData.map(root => (
                <EmployeeCard key={root.id} employee={root} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Employee detail modal */}
      {showEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowEmployeeModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Employee Details</h2>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-xl"
                  style={{ backgroundColor: selectedEmployee.color || "#3B82F6" }}
                >
                  {selectedEmployee.initials || `${selectedEmployee.firstName[0]}${selectedEmployee.lastName[0]}`}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedEmployee.fullName}</h3>
                  <p className="text-gray-600">{selectedEmployee.jobTitle}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <BriefcaseIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Department:</span>
                  <span>{selectedEmployee.department || "Not specified"}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <UserGroupIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Team:</span>
                  <span>{selectedEmployee.team || "Not specified"}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Email:</span>
                  <span>{selectedEmployee.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <UserGroupIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Direct Reports:</span>
                  <span>{selectedEmployee.directReportsCount}</span>
                </div>
                
                {selectedEmployee.managerName && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">Reports to:</span>
                    <span>{selectedEmployee.managerName}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    loadManagers();
                    setShowManagerDialog(true);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update Manager
                </button>
                <button
                  onClick={() => navigate(`/employee-hub?employee=${selectedEmployee.id}`)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Full Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manager update dialog */}
      <ConfirmDialog
        open={showManagerDialog}
        onClose={() => {
          setShowManagerDialog(false);
          setSelectedManager("");
        }}
        title="Update Manager"
        description={`Change the manager for ${selectedEmployee?.fullName}`}
        confirmText="Update"
        cancelText="Cancel"
        onConfirm={handleUpdateManager}
        loading={updatingManager}
        showNoteInput={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Manager
            </label>
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Manager</SelectItem>
                {availableManagers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName} - {manager.jobTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
