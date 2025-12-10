import React from 'react';

const ManagerCard = ({ manager, onRemove }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
      {/* Left Side: Avatar and Info */}
      <div className="flex items-center space-x-4">
        {/* Blue Circular Avatar */}
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-lg">
            {manager.initials}
          </span>
        </div>
        
        {/* Name and Role */}
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            {manager.name}
          </h3>
          <p className="text-gray-600 text-sm">
            {manager.role}
          </p>
        </div>
      </div>

      {/* Right Side: Remove Button */}
      <button
        onClick={onRemove}
        className="border border-pink-500 text-pink-500 hover:bg-pink-50 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Remove permission
      </button>
    </div>
  );
};

export default ManagerCard;
