import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, UploadCloud, File as FileIcon, Folder as FolderIcon, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DocumentUploadModal = ({ isOpen, onClose, employeeId }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      // Reset state on open
      setFiles([]);
      setSelectedFolder('');
      setUploadSuccess(false);
      setUploadProgress(0);
    }
  }, [isOpen]);

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.REACT_APP_API_URL || 'https://hrms.talentshield.co.uk';
      const response = await axios.get(`${apiUrl}/api/documentManagement/folders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFolders(response.data.folders || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0 || !selectedFolder) {
      alert('Please select a folder and at least one file.');
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.REACT_APP_API_URL || 'https://hrms.talentshield.co.uk';
      
      await axios.post(`${apiUrl}/api/documentManagement/folders/${selectedFolder}/documents`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setUploadSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000); // Close modal after 2 seconds on success

    } catch (error) {
      console.error('Error uploading documents:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Upload Document</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-8">
            {uploadSuccess ? (
              <div className="text-center py-8">
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-2xl font-semibold text-gray-800">Upload Successful!</h3>
                <p className="text-gray-500 mt-2">Your documents have been uploaded.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Folder Selection */}
                <div>
                  <label htmlFor="folder-select" className="block text-sm font-medium text-gray-700 mb-2">Select Folder</label>
                  <div className="relative">
                    <FolderIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      id="folder-select"
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="" disabled>Choose a folder...</option>
                      {folders.map(folder => (
                        <option key={folder._id} value={folder._id}>{folder.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* File Dropzone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attach Files</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                    </div>
                  </div>
                </div>

                {/* Selected Files Preview */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Selected files:</h4>
                    <ul className="space-y-2">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center gap-2">
                            <FileIcon className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-800">{file.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-sm text-center text-gray-600 mt-2">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {!uploadSuccess && (
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0 || !selectedFolder}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentUploadModal;
