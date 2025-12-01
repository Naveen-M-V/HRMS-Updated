import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Folder, 
  FileText, 
  Plus, 
  Upload,
  Search,
  Filter,
  ChevronRight,
  Clock,
  User,
  Calendar,
  Shield,
  Archive,
  Download,
  Eye,
  Share2
} from 'lucide-react';
import axios from '../../utils/axiosConfig';
import FolderCard from './FolderCard';
import DocumentPanel from './DocumentPanel';
import FolderModal from './FolderModal';
import DocumentUpload from './DocumentUpload';

const DocumentDrawer = ({ isOpen, onClose }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showDocumentPanel, setShowDocumentPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadZone, setShowUploadZone] = useState(false);

  // Fetch folders from API
  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/documentManagement/folders');
      setFolders(response.data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (folderData) => {
    try {
      const response = await axios.post('/api/documentManagement/folders', folderData);
      setFolders([...folders, response.data]);
      setShowFolderModal(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    setShowDocumentPanel(true);
  };

  const handleUploadDocument = () => {
    if (folders.length === 0) {
      setShowFolderModal(true);
    } else {
      setShowUploadZone(true);
    }
  };

  const handleDocumentUploaded = (document) => {
    setShowUploadZone(false);
    fetchFolders(); // Refresh folders to update document counts
  };

  // Filter folders based on search
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Animation variants
  const drawerVariants = {
    hidden: { x: '-100%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        duration: 0.3
      }
    },
    exit: { 
      x: '-100%', 
      opacity: 0,
      transition: { 
        duration: 0.25,
        ease: 'easeInOut'
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed left-0 top-0 h-full w-96 bg-white shadow-2xl z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Folder className="w-6 h-6" />
                  <h2 className="text-xl font-semibold">Documents</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-blue-800 bg-opacity-50 border border-blue-600 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ height: 'calc(100vh - 200px)' }}>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : folders.length === 0 ? (
                /* Empty State */
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                  <p className="text-gray-500 mb-6">Get started by uploading your first document</p>
                  <button
                    onClick={handleUploadDocument}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </button>
                </div>
              ) : (
                /* Folder Grid */
                <div className="grid grid-cols-1 gap-4">
                  {filteredFolders.map((folder) => (
                    <FolderCard
                      key={folder._id}
                      folder={folder}
                      onClick={() => handleFolderClick(folder)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Floating Add Button */}
            {folders.length > 0 && (
              <button
                onClick={() => setShowFolderModal(true)}
                className="absolute bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </motion.div>

          {/* Document Panel (Right Side) */}
          <AnimatePresence>
            {showDocumentPanel && selectedFolder && (
              <DocumentPanel
                folder={selectedFolder}
                onClose={() => {
                  setShowDocumentPanel(false);
                  setSelectedFolder(null);
                }}
                onDocumentUploaded={handleDocumentUploaded}
              />
            )}
          </AnimatePresence>

          {/* Folder Modal */}
          {showFolderModal && (
            <FolderModal
              onClose={() => setShowFolderModal(false)}
              onSubmit={handleCreateFolder}
              isFirstFolder={folders.length === 0}
            />
          )}

          {/* Upload Zone */}
          {showUploadZone && (
            <DocumentUpload
              onClose={() => setShowUploadZone(false)}
              onUpload={handleDocumentUploaded}
              folders={folders}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default DocumentDrawer;
