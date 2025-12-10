import React, { useState } from 'react';
import TodoCompletedToggle from './TodoCompletedToggle';
import SearchBar from './SearchBar';
import EmptyState from './EmptyState';
import ProgressBar from './ProgressBar';

const AssignedPage = () => {
  const [viewMode, setViewMode] = useState('todo'); // 'todo' or 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [courses] = useState([]); // Empty array for demo

  return (
    <div className="px-6 py-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Course cards would go here */}
        </div>
      )}
    </div>
  );
};

export default AssignedPage;
