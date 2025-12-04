import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Folder,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  FileText,
  Download,
  Upload,
  Plus,
  Eye,
  Archive,
  MoreVertical,
  Image,
  File,
  FileArchive,
  Home,
  Users,
  Clock
} from 'lucide-react';
import axios from 'axios';
import UploadComponent from '../components/DocumentManagement/UploadComponent';
import CreateFolderModal from '../components/DocumentManagement/CreateFolderModal';

const FolderView = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [folder, setFolder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemMenu, setShowItemMenu] = useState(null);

  // Fetch folder contents
  useEffect(() => {
    if (folderId) {
      fetchFolderContents();
    }
  }, [folderId]);

  const fetchFolderContents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.REACT_APP_API_URL || 'https://hrms.athryan.com';
      
      const response = await axios.get(`${apiUrl}/api/documentManagement/folders/${folderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setFolder(response.data.folder);
      setItems(response.data.contents || []);
    } catch (error) {
      console.error('Error fetching folder contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      navigate(`/documents/${item._id}`);
    } else {
      // Handle file click - download or preview
      handleDownload(item);
    }
  };

  const handleDownload = async (document) => {
    try {
      const token = localStorage.getItem('auth_token');
      const apiUrl = process.env.REACT_APP_API_URL || 'https://hrms.athryan.com';
      
      const response = await axios.get(
        `${apiUrl}/api/documentManagement/documents/${document._id}/download`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Filter items based on search
    // This is already handled by the filteredItems below
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
      return Image;
    } else if (['pdf'].includes(extension)) {
      return FileText;
    } else if (['zip', 'rar', '7z'].includes(extension)) {
      return FileArchive;
    } else {
      return File;
    }
  };

  const handleDocumentUploaded = () => {
    setShowUploadModal(false);
    fetchFolderContents();
  };

  const handleFolderCreated = () => {
    setShowCreateFolderModal(false);
    fetchFolderContents();
  };

  const handleCreateReport = () => {
    // Implement create report functionality
    console.log('Create report clicked');
  };

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEmpty = filteredItems.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Area - Full Width Layout */}
      <div className="flex">
        {/* Sidebar - Fixed Width */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <div className="space-y-1">
              <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <Home className="w-5 h-5" />
                <span>Home</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <Users className="w-5 h-5" />
                <span>Employees</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5" />
                <span>Calendar</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <Clock className="w-5 h-5" />
                <span>Rotas & shifts</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                <Eye className="w-5 h-5" />
                <span>Clock-ins</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium">
                <Folder className="w-5 h-5" />
                <span>Documents</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ChevronRight className="w-4 h-4" />
                  <span>{folder?.name || 'Folder'}</span>
                </div>
              </div>
              
              {/* Search and Actions */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search all folders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
                
                {/* View Dropdown */}
                <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option>View 10 per page</option>
                  <option>View 25 per page</option>
                  <option>View 50 per page</option>
                </select>
                
                {/* Create Report Button */}
                <button
                  onClick={handleCreateReport}
                  className="px-4 py-2 text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
                  style={{ backgroundColor: '#e00070' }}
                >
                  Create report
                </button>
              </div>
            </div>
          </div>

          {/* Folder Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : isEmpty ? (
              /* Empty State */
              <div className="bg-white rounded-lg border border-gray-200 p-12">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="p-6 bg-gray-100 rounded-full">
                      <Folder className="w-16 h-16 text-gray-400" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">No documents yet</h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Get started by uploading your first document or creating a folder
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Document
                    </button>
                    <button
                      onClick={() => setShowCreateFolderModal(true)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Create Folder
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Folders Table */
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Table Header */}
                <div className="border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm font-medium text-gray-700">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-3">Date created</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {filteredItems.map((item, index) => {
                    const Icon = item.type === 'folder' ? Folder : getFileIcon(item.name || item.fileName);
                    
                    return (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleItemClick(item)}
                      >
                        {/* Name */}
                        <div className="col-span-5 flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                              {item.name || item.fileName}
                            </div>
                            {item.description && (
                              <div className="text-sm text-gray-500">{item.description}</div>
                            )}
                          </div>
                        </div>

                        {/* Type */}
                        <div className="col-span-2 flex items-center">
                          <span className="text-sm text-gray-600">
                            {item.type === 'folder' ? 'Folder' : (item.fileType || 'File')}
                          </span>
                        </div>

                        {/* Size */}
                        <div className="col-span-2 flex items-center">
                          <span className="text-sm text-gray-600">
                            {item.type === 'folder' 
                              ? `${item.itemCount || 0} items`
                              : formatFileSize(item.fileSize || 0)
                            }
                          </span>
                        </div>

                        {/* Date Created */}
                        <div className="col-span-3 flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {formatDate(item.createdAt)}
                          </span>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowItemMenu(showItemMenu === item._id ? null : item._id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                              {showItemMenu === item._id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {item.type !== 'folder' && (
                                    <button
                                      onClick={() => handleDownload(item)}
                                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <Download className="w-4 h-4" />
                                      <span>Download</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setShowItemMenu(null);
                                    }}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  >
                                    <Archive className="w-4 h-4" />
                                    <span>Archive</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadComponent
            onClose={() => setShowUploadModal(false)}
            onUpload={handleDocumentUploaded}
            folderId={folderId}
          />
        )}
      </AnimatePresence>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {showCreateFolderModal && (
          <CreateFolderModal
            onClose={() => setShowCreateFolderModal(false)}
            onCreate={handleFolderCreated}
            parentFolderId={folderId}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FolderView;
