import React from 'react';

const TodoCompletedToggle = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
      <button
        onClick={() => onViewModeChange('todo')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'todo'
            ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        To do
      </button>
      <button
        onClick={() => onViewModeChange('completed')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'completed'
            ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Completed
      </button>
    </div>
  );
};

export default TodoCompletedToggle;
