import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Tabs from './Tabs';
import AssignedPage from './AssignedPage';
import AllCoursesPage from './AllCoursesPage';
import AssignmentPage from './AssignmentPage';
import ReportingPage from './ReportingPage';
import PermissionsPage from './PermissionsPage';
import ELearningDocumentsPage from './ELearningDocumentsPage';

const ELearningPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'assigned', label: 'Assigned to me', path: '/e-learning/assigned' },
    { id: 'all-courses', label: 'All courses', path: '/e-learning/all-courses' },
    { id: 'assignment', label: 'Assignment', path: '/e-learning/assignment' },
    { id: 'reporting', label: 'Reporting', path: '/e-learning/reporting' },
    { id: 'permissions', label: 'Permissions', path: '/e-learning/permissions' },
    { id: 'documents', label: 'Documents', path: '/e-learning/documents' }
  ];

  const activeTab = tabs.find(tab => location.pathname === tab.path)?.id || 'assigned';

  const handleTabChange = (tabId) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      navigate(tab.path);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">E-Learning</h1>
      </div>

      {/* Tabs */}
      <Tabs 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />

      {/* Main Content */}
      <div className="flex-1">
        <Routes>
          <Route path="/assigned" element={<AssignedPage />} />
          <Route path="/all-courses" element={<AllCoursesPage />} />
          <Route path="/assignment" element={<AssignmentPage />} />
          <Route path="/reporting" element={<ReportingPage />} />
          <Route path="/permissions" element={<PermissionsPage />} />
          <Route path="/documents" element={<ELearningDocumentsPage />} />
          <Route path="/" element={<AssignedPage />} />
        </Routes>
      </div>
    </div>
  );
};

export default ELearningPage;
