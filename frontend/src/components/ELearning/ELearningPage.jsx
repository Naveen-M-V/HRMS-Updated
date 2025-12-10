import React, { useState } from 'react';
import ELearningTabs from './ELearningTabs';
import TodoCompletedToggle from './TodoCompletedToggle';
import SearchBar from './SearchBar';
import CourseList from './CourseList';
import EmptyState from './EmptyState';
import ProgressBar from './ProgressBar';

const ELearningPage = () => {
  const [activeTab, setActiveTab] = useState('assigned');
  const [viewMode, setViewMode] = useState('todo'); // 'todo' or 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [courses] = useState([]); // Empty array for demo

  const tabs = [
    { id: 'assigned', label: 'Assigned to me' },
    { id: 'all', label: 'All courses' },
    { id: 'assignment', label: 'Assignment' },
    { id: 'reporting', label: 'Reporting' },
    { id: 'permissions', label: 'Permissions' }
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">E-Learning</h1>
      </div>

      {/* Tabs */}
      <ELearningTabs 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* Main Content */}
      <div className="flex-1 px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          {/* Todo/Completed Toggle */}
          <TodoCompletedToggle 
            viewMode={viewMode} 
            onViewModeChange={setViewMode} 
          />

          {/* Search Bar */}
          <div className="flex-1 max-w-md ml-6">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search courses..."
            />
          </div>

          {/* Progress Bar */}
          <ProgressBar completed={0} total={0} />
        </div>

        {/* Course List or Empty State */}
        {courses.length === 0 ? (
          <EmptyState viewMode={viewMode} />
        ) : (
          <CourseList courses={courses} viewMode={viewMode} />
        )}
      </div>
    </div>
  );
};

export default ELearningPage;
