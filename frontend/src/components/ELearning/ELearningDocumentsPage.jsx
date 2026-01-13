import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Eye, FileText } from 'lucide-react';
import axios from 'axios';
import '../../utils/axiosConfig';
import { validateDocumentFile } from '../../utils/inputValidation';
import PdfSwipeViewer from './PdfSwipeViewer';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ELearningDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [activeDoc, setActiveDoc] = useState(null);

  const fileInputRef = useRef(null);

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL || 'https://hrms.talentshield.co.uk', []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const resp = await axios.get('/api/documentManagement/documents', {
        params: { category: 'e_learning' },
        withCredentials: true
      });
      setDocuments(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      setError('Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const openUpload = () => {
    setUploadError('');
    setSelectedFiles([]);
    setUploadOpen(true);
  };

  const handleSelectFiles = (fileList) => {
    const next = [];
    const errors = [];

    Array.from(fileList || []).forEach((file) => {
      const validation = validateDocumentFile(file);
      if (!validation.isValid) {
        errors.push(`${file.name}: ${validation.message}`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name}: File size must be less than 10MB`);
        return;
      }

      next.push(file);
    });

    if (errors.length > 0) {
      setUploadError(errors.join(', '));
    } else {
      setUploadError('');
    }

    setSelectedFiles(next);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadError('Please select at least one PDF');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const token = localStorage.getItem('auth_token');

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'e_learning');
        formData.append('tags', 'e-learning');
        formData.append('accessControl', JSON.stringify({ visibility: 'all', allowedUserIds: [] }));

        const uploadUrlBase = '/api/documentManagement/documents';
        const uploadUrl = token ? `${uploadUrlBase}?token=${encodeURIComponent(token)}` : uploadUrlBase;

        await axios.post(uploadUrl, formData, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          },
          withCredentials: true
        });
      }

      setUploadOpen(false);
      setSelectedFiles([]);
      await fetchDocuments();
    } catch (e) {
      setUploadError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const isPdf = (doc) => {
    const name = doc?.name || doc?.fileName || '';
    const ext = name.split('.').pop()?.toLowerCase();
    return doc?.mimeType === 'application/pdf' || ext === 'pdf';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const download = (doc) => {
    if (!doc?._id) return;
    const token = localStorage.getItem('auth_token');
    const url = `${apiBase}/api/documentManagement/documents/${doc._id}/download` + (token ? `?token=${encodeURIComponent(token)}` : '');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Documents</h2>
          <p className="text-sm text-gray-600 mt-1">Upload PDF documents and view them in-app with swipe navigation.</p>
        </div>

        <button
          onClick={openUpload}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload Documents
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-600">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <div className="text-gray-600">No documents uploaded yet.</div>
          </div>
        ) : (
          <div className="divide-y">
            {documents.filter(isPdf).map((doc) => (
              <div key={doc._id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{doc.name || doc.fileName}</div>
                  <div className="text-xs text-gray-500">Uploaded {formatDate(doc.createdAt)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveDoc(doc)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => download(doc)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
                    title="Download"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploadOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !uploading && setUploadOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b">
              <div className="text-lg font-semibold text-gray-900">Upload PDF</div>
              <div className="text-sm text-gray-600">Only PDF files are allowed.</div>
            </div>

            <div className="p-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleSelectFiles(e.target.files)}
                disabled={uploading}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg p-6 text-center text-gray-700"
              >
                Click to choose PDF files
              </button>

              {uploadError && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{uploadError}</div>
              )}

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Selected</div>
                  <div className="space-y-2">
                    {selectedFiles.map((f) => (
                      <div key={f.name} className="text-sm text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
                        {f.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t flex gap-3">
              <button
                onClick={() => setUploadOpen(false)}
                disabled={uploading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeDoc && (
        <PdfSwipeViewer
          document={activeDoc}
          onClose={() => setActiveDoc(null)}
        />
      )}
    </div>
  );
};

export default ELearningDocumentsPage;
