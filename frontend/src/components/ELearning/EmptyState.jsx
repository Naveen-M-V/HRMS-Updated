import React from 'react';

const EmptyState = ({ viewMode }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Illustration */}
      <div className="mb-8">
        <svg
          className="w-32 h-32 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>

      {/* Text */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        No courses to {viewMode === 'todo' ? 'do' : 'review'}
      </h2>
      <p className="text-gray-500 text-center max-w-md">
        {viewMode === 'todo' 
          ? "You don't have any assigned courses at the moment. Check back later for new assignments."
          : "You haven't completed any courses yet. Start with your assigned courses to see them here."
        }
      </p>

      {/* Action Button */}
      {viewMode === 'todo' && (
        <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Browse All Courses
        </button>
      )}
    </div>
  );
};

export default EmptyState;
