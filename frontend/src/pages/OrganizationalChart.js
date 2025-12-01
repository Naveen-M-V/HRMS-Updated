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
import EmployeeQuickView from "../components/EmployeeQuickView";

export default function OrganizationalChart() {
  const navigate = useNavigate();
  const [orgData, setOrgData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
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
            relative bg-white border-2 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer min-w-[320px] max-w-[380px]
            ${level === 0 ? "border-blue-400 bg-gradient-to-br from-blue-50 to-white" : "border-gray-200 hover:border-blue-300"}
            ${selectedEmployee?.id === employee.id ? "ring-2 ring-blue-500 ring-offset-2" : ""}
          `}
          onClick={() => {
            setSelectedEmployee(employee);
            setShowQuickView(true);
          }}
        >
          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md"
                style={{ backgroundColor: employee.color || "#3B82F6" }}
              >
                {employee.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={employee.fullName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  employee.initials || `${employee.firstName[0]}${employee.lastName[0]}`
                )}
              </div>
              
              {/* Employee info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate text-base leading-tight">
                  {employee.fullName}
                </h3>
                <p className="text-sm text-gray-600 truncate mt-0.5 font-medium">{employee.jobTitle}</p>
                <div className="flex flex-col gap-1 mt-2">
                  {employee.department && (
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <BuildingOfficeIcon className="w-3.5 h-3.5 text-blue-500" />
                      <span className="truncate">{employee.department}</span>
                    </span>
                  )}
                  {employee.team && (
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <UserGroupIcon className="w-3.5 h-3.5 text-green-500" />
                      <span className="truncate">{employee.team}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Show/Hide Reports Button */}
            {hasReports && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNodeExpansion(employee.id);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors py-1"
                >
                  {isExpanded ? (
                    <>
                      <span>Hide {employee.directReportsCount} direct report{employee.directReportsCount !== 1 ? "s" : ""}</span>
                      <ChevronDownIcon className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Show {employee.directReportsCount} direct report{employee.directReportsCount !== 1 ? "s" : ""}</span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Direct reports */}
        {hasReports && isExpanded && (
          <div className="relative mt-6 ml-10">
            {/* Vertical connector line from parent */}
            <div className="absolute left-0 top-0 w-0.5 h-10 bg-blue-300 -translate-x-5" />
            
            {/* Reports container */}
            <div className="space-y-6">
              {employee.directReports.map((report, index) => (
                <div key={report.id} className="relative">
                  {/* Horizontal connector */}
                  <div className="absolute left-0 top-8 w-5 h-0.5 bg-blue-300 -translate-x-5" />
                  
                  {/* Vertical connector for multiple reports */}
                  {employee.directReports.length > 1 && (
                    <>
                      {index === 0 && (
                        <div className="absolute left-0 top-8 w-0.5 h-full bg-blue-300 -translate-x-5" />
                      )}
                      {index === employee.directReports.length - 1 && (
                        <div className="absolute left-0 top-0 w-0.5 h-8 bg-blue-300 -translate-x-5" />
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <UserGroupIcon className="h-9 w-9 text-blue-600" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">Organizational chart</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 border border-pink-200">
                    labs
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  This is an experimental feature, 
                  <a href="#" className="text-blue-600 hover:text-blue-700 ml-1">send us feedback</a> to tell us what you love and what doesn't work for you.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrgChart}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Print chart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-72">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Department filter */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-56 h-12 border-2">
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
            <div className="flex items-center gap-1 bg-white border-2 border-gray-300 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="px-3 py-1.5 hover:bg-gray-100 rounded font-bold text-gray-700 transition-colors"
                title="Zoom out"
              >
                <span className="text-lg">−</span>
              </button>
              <span className="text-sm font-semibold px-3 py-1 min-w-[60px] text-center text-gray-700">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="px-3 py-1.5 hover:bg-gray-100 rounded font-bold text-gray-700 transition-colors"
                title="Zoom in"
              >
                <span className="text-lg">+</span>
              </button>
              <button
                onClick={handleZoomReset}
                className="px-3 py-1.5 hover:bg-gray-100 rounded font-bold text-gray-700 transition-colors ml-1"
                title="Reset zoom"
              >
                <span className="text-base">⟲</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-96 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-center">
              <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-600 font-medium text-lg">Loading organizational chart...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-gray-200">
            <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-600">
              {searchTerm || departmentFilter !== "all" 
                ? "Try adjusting your search or filters"
                : "No employees available in the organizational chart"
              }
            </p>
          </div>
        ) : (
          <div
            ref={chartRef}
            className="overflow-auto bg-white rounded-xl border-2 border-gray-200 p-10 shadow-sm"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          >
            <div className="inline-block min-w-full">
              {filteredData.map(root => (
                <div key={root.id} className="mb-8">
                  <EmployeeCard employee={root} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Employee Quick View Modal */}
      <EmployeeQuickView
        employee={selectedEmployee}
        isOpen={showQuickView}
        onClose={() => {
          setShowQuickView(false);
          setSelectedEmployee(null);
        }}
        onViewFullProfile={() => {
          if (selectedEmployee) {
            navigate(`/employee-hub?employee=${selectedEmployee.id}`);
          }
        }}
      />

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
