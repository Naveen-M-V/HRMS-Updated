import React from 'react';

const ReportingPage = () => {
  return (
    <div className="px-6 py-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Reporting</h2>
      
      {/* Placeholder Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Reporting Dashboard
        </h3>
        <p className="text-gray-500 mb-4">
          Comprehensive reporting and analytics for E-Learning progress and completion rates.
        </p>
        <p className="text-sm text-gray-400">
          This section is currently under development.
        </p>
      </div>
    </div>
  );
};

export default ReportingPage;
