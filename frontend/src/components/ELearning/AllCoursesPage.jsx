import React, { useState } from 'react';
import Filters from './Filters';
import CourseCard from './CourseCard';

// Sample static JSON course data
const sampleCourses = [
  {
    id: 1,
    title: "Health and Safety in the Workplace",
    description: "Learn essential health and safety protocols, risk assessment, and emergency procedures to maintain a safe working environment.",
    thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop",
    type: "Compliance",
    isCPDCertified: true,
    duration: "2 hours"
  },
  {
    id: 2,
    title: "Data Protection and Privacy Fundamentals",
    description: "Understanding GDPR, data protection principles, and how to handle sensitive information securely in the workplace.",
    thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop",
    type: "Compliance",
    isCPDCertified: true,
    duration: "1.5 hours"
  },
  {
    id: 3,
    title: "Effective Communication Skills",
    description: "Develop professional communication techniques, active listening, and presentation skills for workplace success.",
    thumbnail: "https://images.unsplash.com/photo-1512386145456-7cbcd3ce2a6e?w=400&h=200&fit=crop",
    type: "Soft Skills",
    isCPDCertified: true,
    duration: "3 hours"
  },
  {
    id: 4,
    title: "Fire Safety and Emergency Evacuation",
    description: "Comprehensive training on fire prevention, emergency procedures, and evacuation protocols for workplace safety.",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop",
    type: "Safety",
    isCPDCertified: true,
    duration: "1 hour"
  },
  {
    id: 5,
    title: "Mental Health Awareness in the Workplace",
    description: "Understanding mental health issues, supporting colleagues, and creating a mentally healthy work environment.",
    thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=200&fit=crop",
    type: "Wellness",
    isCPDCertified: true,
    duration: "2.5 hours"
  },
  {
    id: 6,
    title: "Cybersecurity Essentials for Employees",
    description: "Learn about common cyber threats, password security, and best practices for protecting company data.",
    thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop",
    type: "IT Security",
    isCPDCertified: true,
    duration: "2 hours"
  }
];

const AllCoursesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const filteredCourses = sampleCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || course.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="px-6 py-6">
      {/* Page Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">All courses</h2>

      {/* Filters */}
      <Filters 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No courses found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default AllCoursesPage;
