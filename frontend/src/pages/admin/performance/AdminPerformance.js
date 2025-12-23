import React from 'react';
import { Link } from 'react-router-dom';

const AdminPerformance = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Performance Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/performance/notes" className="p-4 bg-white rounded shadow hover:shadow-md">Manage Notes</Link>
        <Link to="/admin/performance/disciplinary" className="p-4 bg-white rounded shadow hover:shadow-md">Disciplinary Records</Link>
        <Link to="/admin/performance/pips" className="p-4 bg-white rounded shadow hover:shadow-md">Improvement Plans (PIPs)</Link>
      </div>
    </div>
  );
};

export default AdminPerformance;
