// src/pages/ViewCertificate.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCertificates } from "../context/CertificateContext";

export default function ViewCertificate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    certificates,
    deleteCertificate,
    updateCertificateWithFile,
    uploadCertificateFile,
  } = useCertificates();

  const [certificate, setCertificate] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const cert = certificates.find(
      (c) => (c.id || c._id) === id || (c.id || c._id) === parseInt(id)
    );
    if (cert) setCertificate(cert);
  }, [id, certificates]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDeleteCertificate = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete the certificate "${certificate.certificate}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteCertificate(certificate.id || certificate._id);
        navigate("/certificates");
      } catch (error) {
        console.error("Failed to delete certificate:", error);
        alert("Failed to delete certificate. Please try again.");
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit. Please select a smaller file.");
        e.target.value = "";
        return;
      }
      if (
        file.type === "application/pdf" ||
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg"
      ) {
        setSelectedFile(file);
      } else {
        alert("Please select a PDF, JPEG, or PNG file only.");
        e.target.value = "";
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }
    const certificateId = certificate?.id || certificate?._id;
    if (!certificateId) {
      alert("Certificate ID not found. Please refresh the page and try again.");
      return;
    }

    setUploading(true);
    try {
      const updatedCertificate = await uploadCertificateFile(
        certificateId,
        selectedFile
      );
      setCertificate(updatedCertificate);
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById("certificateFileInput");
      if (fileInput) fileInput.value = "";

      alert("Certificate file updated successfully!");
    } catch (error) {
      console.error("Failed to upload certificate file:", error);
      alert("Failed to upload certificate file. " + (error.message || "Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete the certificate file? This action cannot be undone."
      )
    ) {
      setUploading(true);
      try {
        const certificateId = certificate.id || certificate._id;
        const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5003';
        
        const response = await fetch(`${apiUrl}/api/certificates/${certificateId}/file`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete file');
        }

        const data = await response.json();
        
        // Update the certificate state to remove file data
        setCertificate(prev => ({
          ...prev,
          certificateFile: null,
          fileData: null,
          fileSize: null,
          mimeType: null
        }));
        
        alert("Certificate file deleted successfully!");
      } catch (error) {
        console.error("Failed to delete certificate file:", error);
        alert("Failed to delete certificate file: " + (error.message || "Please try again."));
      } finally {
        setUploading(false);
      }
    }
  };

  if (!certificate) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Certificate not found</h2>
          <Link to="/reporting/certificates" className="text-blue-600 hover:underline">
            Back to Certificates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">View Certificate</h1>
        {/*<div className="flex gap-2">
          <Link
            to="/reporting/certificates"
            className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            View certificate list
          </Link>*/}
          <button
            onClick={() => {
              if (certificate.profileName) {
                navigate("/profiles");
              } else {
                alert("Profile information not available");
              }
            }}
            className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            View profile
          </button>
          <Link
            to="/dashboard/createcertificate"
            className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            Add another certificate
          </Link>
          <Link
            to={`/editcertificate/${certificate.id || certificate._id}`}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Edit certificate
          </Link>
          <button
            onClick={handleDeleteCertificate}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete certificate
          </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Certificate Details */}
        <div className="col-span-8">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">{certificate.certificate}</h2>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Certificate:</span>
                  <span className="font-medium">{certificate.certificate}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Issued:</span>
                  <span className="font-medium">{certificate.issueDate}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Created On:</span>
                  <span className="font-medium">{formatDate(certificate.createdOn)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Last Updated:</span>
                  <span className="font-medium">{formatDate(certificate.updatedOn)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Updated by:</span>
                  <span className="font-medium">System Administrator</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Issue Date:</span>
                  <span className="font-medium">{certificate.issueDate}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Expiry Date:</span>
                  <span className="font-medium">{certificate.expiryDate}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Archived:</span>
                  <span className="font-medium">{certificate.archived || "No"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Approval Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      certificate.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : certificate.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {certificate.status}
                  </span>
                </div>
              </div>
            </div>

            {certificate.description && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 text-sm">{certificate.description}</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium text-gray-800 mb-2">Provider Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider:</span>
                  <span className="font-medium">{certificate.provider || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium">£{certificate.cost || "0.00"}</span>
                </div>
              </div>
            </div>

            {certificate.profileName && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium text-gray-800 mb-2">Profile Information</h3>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profile Name:</span>
                    <span className="font-medium">{certificate.profileName}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - File Upload/Actions */}
        <div className="col-span-4">
          <div className="bg-white rounded-lg border p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              {certificate.certificateFile ? (
                <>
                  <p className="text-sm text-gray-600 mb-2">
                    Current file:{" "}
                    {certificate.certificateFile?.originalname ||
                      certificate.certificate?.replace(/[^a-zA-Z0-9]/g, "_")}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Added: {formatDate(certificate.createdOn)} 14:37
                  </p>
                  <div className="flex gap-2 justify-center mb-4">
                    <button
                      onClick={() => {
                        const fileUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5003'}/api/certificates/${
                          certificate.id || certificate._id
                        }/file`;
                        window.open(fileUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      View Certificate
                    </button>
                    <button
                      onClick={handleDeleteFile}
                      disabled={uploading}
                      className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      {uploading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-600 mb-4">No certificate file uploaded</p>
              )}

              <div className="mb-4">
                <input
                  id="certificateFileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="certificateFileInput"
                  className="inline-block px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
                >
                  Choose File (PDF, JPG, PNG)
                </label>
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-2">Selected: {selectedFile.name}</p>
                )}
              </div>

              {selectedFile && (
                <button
                  onClick={handleFileUpload}
                  disabled={uploading}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {uploading
                    ? "Uploading..."
                    : certificate.certificateFile
                    ? "Update File"
                    : "Upload File"}
                </button>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-gray-800 mb-2">File Requirements</h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">File Required:</span>
                  <span className="font-medium">{certificate.fileRequired || "Yes"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium">{certificate.active || "Yes"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link
          to="/certificates"
          className="inline-flex items-center px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
        >
          ← Back to Certificates
        </Link>
      </div>
    </div>
  );
}
