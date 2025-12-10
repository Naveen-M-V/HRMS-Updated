import React from 'react';

const CourseList = ({ courses, viewMode }) => {
  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <div
          key={course.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {course.description}
              </p>
            </div>
            {course.status && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                course.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {course.status}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {course.duration && (
                <span className="mr-4">Duration: {course.duration}</span>
              )}
              {course.progress && (
                <span>Progress: {course.progress}%</span>
              )}
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              {viewMode === 'completed' ? 'Review' : 'Start'} →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseList;
