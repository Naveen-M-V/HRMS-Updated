import React from "react";
import { useParams, Link } from "react-router-dom";

export default function StaffDetail() {
  const { id } = useParams();

  // Dummy data for now (replace with API later)
  const staffData = {
    1001: {
      firstname: "David",
      lastname: "Williams",
      email: "david.williams@vitrux.co.uk",
      company: "VitruX Ltd",
      jobTitle: "Director",
      role: "Administrator",
      jobLevel: "Managerial",
    },
    1002: {
      firstname: "John",
      lastname: "Maxwell",
      email: "john.maxwell@vitrux.co.uk",
      company: "VitruX Ltd",
      jobTitle: "Head of Delivery",
      role: "Manager",
      jobLevel: "Senior",
    },
  };

  const staff = staffData[id];

  if (!staff) {
    return <div className="p-6">User not found</div>;
  }

  return (
    <div className="p-6">
      <Link to="/dashboard/sharestaff" className="text-blue-600 underline mb-4 block">
        ← Back to Staff List
      </Link>

      <h1 className="text-2xl font-bold mb-4">
        {staff.firstname} {staff.lastname}
      </h1>

      <div className="grid grid-cols-3 gap-6">
        {/* User Details */}
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">User Details</h2>
          <p><strong>Staff ID:</strong> {id}</p>
          <p><strong>Email:</strong> {staff.email}</p>
          <p><strong>Company:</strong> {staff.company}</p>
        </div>

        {/* Job Details */}
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Job, Team & Training</h2>
          <p><strong>Role:</strong> {staff.role}</p>
          <p><strong>Job Title:</strong> {staff.jobTitle}</p>
          <p><strong>Job Level:</strong> {staff.jobLevel}</p>
        </div>

        {/* Compliance Summary */}
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Compliance Summary</h2>
          <p>No applicable compliance matrix found.</p>
        </div>
      </div>

      {/* Training Certificates */}
      <div className="mt-6 p-4 border rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Active Training Certificates</h2>
        <p>No data available in table.</p>
      </div>
    </div>
  );
}
