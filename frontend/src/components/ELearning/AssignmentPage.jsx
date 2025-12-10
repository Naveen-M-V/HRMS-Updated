import React from 'react';

const AssignmentPage = () => {
  return (
    <div className="px-6 py-6">
      {/* Header with Assign Button */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Assignment</h2>
        <button className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200">
          Assign new courses
        </button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16">
        {/* Empty State Illustration */}
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {/* Empty State Text */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No courses currently assigned
        </h3>
        <p className="text-gray-500 text-center max-w-md mb-6">
          Start assigning courses to your team members to track their progress and ensure compliance.
        </p>

        {/* CTA Button */}
        <button className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200">
          Assign new courses
        </button>
      </div>
    </div>
  );
};

export default AssignmentPage;
