import React from 'react';
import { ComputerDesktopIcon } from '@heroicons/react/24/outline';

const CourseCard = ({ course }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Card Header with Icon and Badge */}
      <div className="relative">
        {/* Thumbnail Image */}
        <div className="w-full h-48 bg-gray-100">
          <img 
            src={course.thumbnail} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Top-left Icon */}
        <div className="absolute top-3 left-3 bg-white rounded-md p-2 shadow-sm">
          <ComputerDesktopIcon className="h-5 w-5 text-gray-600" />
        </div>
        
        {/* Top-right CPD Badge */}
        {course.isCPDCertified && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
            CPD Certified
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 leading-tight">
          {course.title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {course.description}
        </p>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="font-medium">{course.type}</span>
          <span>{course.duration}</span>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-blue-600 bg-opacity-0 hover:bg-opacity-5 transition-all duration-200 pointer-events-none" />
    </div>
  );
};

export default CourseCard;
