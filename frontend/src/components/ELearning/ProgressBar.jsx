import React from 'react';

const ProgressBar = ({ completed, total }) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <div className="flex items-center space-x-3">
      <div className="flex flex-col items-end">
        <div className="text-sm font-medium text-gray-900">
          {completed}/{total} complete
        </div>
        <div className="text-xs text-gray-500">
          {percentage.toFixed(0)}% done
        </div>
      </div>
      
      {/* Circular Progress Indicator */}
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#E5E7EB"
            strokeWidth="4"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#3B82F6"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - percentage / 100)}`}
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
