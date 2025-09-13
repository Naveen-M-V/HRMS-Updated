import React, { useState } from 'react';
import { getCertificatesForJobRole, getAllJobRoles, allCertificates } from '../data/certificateJobRoleMapping';

const CertificateDemo = () => {
  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [availableCertificates, setAvailableCertificates] = useState({ mandatory: [], optional: [] });

  const handleJobRoleChange = (e) => {
    const jobRole = e.target.value;
    setSelectedJobRole(jobRole);
    
    if (jobRole) {
      const certificates = getCertificatesForJobRole(jobRole);
      setAvailableCertificates(certificates);
    } else {
      setAvailableCertificates({ mandatory: [], optional: [] });
    }
  };

  const jobRoles = getAllJobRoles();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Dynamic Certificate Selection Demo
      </h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Job Role:
        </label>
        <select
          value={selectedJobRole}
          onChange={handleJobRoleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a job role...</option>
          {jobRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {selectedJobRole && (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-3">
              Mandatory Certificates ({availableCertificates.mandatory.length})
            </h3>
            {availableCertificates.mandatory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableCertificates.mandatory.map((cert) => (
                  <div key={cert.code} className="bg-white p-3 rounded border">
                    <div className="font-medium text-red-700">{cert.code}</div>
                    <div className="text-sm text-gray-600">{cert.description}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Category: {cert.category}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No mandatory certificates defined for this role.</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              Optional Certificates ({availableCertificates.optional.length})
            </h3>
            {availableCertificates.optional.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableCertificates.optional.map((cert) => (
                  <div key={cert.code} className="bg-white p-3 rounded border">
                    <div className="font-medium text-blue-700">{cert.code}</div>
                    <div className="text-sm text-gray-600">{cert.description}</div>
                    <div className="text-xs text-green-600 mt-1">
                      Category: {cert.category}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No optional certificates defined for this role.</p>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Certificate Summary for: <span className="text-blue-600">{selectedJobRole}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-red-100 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {availableCertificates.mandatory.filter(c => c.category === 'Safety').length}
                </div>
                <div className="text-sm text-red-700">Safety</div>
              </div>
              <div className="bg-orange-100 p-3 rounded">
                <div className="text-2xl font-bold text-orange-600">
                  {availableCertificates.mandatory.filter(c => c.category === 'Craft').length}
                </div>
                <div className="text-sm text-orange-700">Craft</div>
              </div>
              <div className="bg-purple-100 p-3 rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {availableCertificates.mandatory.filter(c => c.category === 'NRSWA').length}
                </div>
                <div className="text-sm text-purple-700">NRSWA</div>
              </div>
              <div className="bg-green-100 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {availableCertificates.mandatory.filter(c => c.category === 'Security').length}
                </div>
                <div className="text-sm text-green-700">Security</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">How it works:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Select a job role from the dropdown above</li>
          <li>• The system automatically displays all relevant certificates</li>
          <li>• Certificates are categorized as Mandatory (Safety, Craft, NRSWA, Security) and Optional</li>
          <li>• This same logic is now integrated into the Create Certificate page</li>
          <li>• When creating a certificate, users can only select certificates relevant to the profile's job role</li>
        </ul>
      </div>
    </div>
  );
};

export default CertificateDemo;
