const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Folder = require('../models/Folder');
const DocumentManagement = require('../models/DocumentManagement');
const EmployeeHub = require('../models/EmployeesHub');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'documents');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, images and text files are allowed.'));
    }
  }
});

// Middleware to check user role and permissions
const checkPermission = (action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const userRole = user.role || 'employee';
      
      // Admin has all permissions
      if (userRole === 'admin') {
        return next();
      }
      
      // For folder operations, check folder permissions
      if (req.params.folderId) {
        const folder = await Folder.findById(req.params.folderId);
        if (!folder) {
          return res.status(404).json({ message: 'Folder not found' });
        }
        
        if (!folder.hasPermission(action, userRole)) {
          return res.status(403).json({ message: 'Insufficient permissions' });
        }
      }
      
      // For document operations, check document permissions
      if (req.params.documentId) {
        const document = await DocumentManagement.findById(req.params.documentId);
        if (!document) {
          return res.status(404).json({ message: 'Document not found' });
        }
        
        if (!document.hasPermission(action, userRole)) {
          return res.status(403).json({ message: 'Insufficient permissions' });
        }
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

// ==================== FOLDER ROUTES ====================

// Get all folders
router.get('/folders', async (req, res) => {
  try {
    const folders = await Folder.getRootFolders()
      .populate('createdBy', 'firstName lastName employeeId');
    
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get folder by ID with documents
router.get('/folders/:folderId', async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.folderId)
      .populate('createdBy', 'firstName lastName employeeId');
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    const documents = await DocumentManagement.getByFolder(req.params.folderId);
    
    res.json({
      folder,
      documents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new folder
router.post('/folders', async (req, res) => {
  try {
    const { name, description, parentFolder, permissions } = req.body;
    
    // Check if folder name already exists in the same parent
    const existingFolder = await Folder.findOne({ 
      name, 
      parentFolder: parentFolder || null,
      isActive: true 
    });
    
    if (existingFolder) {
      return res.status(400).json({ message: 'Folder with this name already exists' });
    }
    
    const folder = new Folder({
      name,
      description,
      parentFolder: parentFolder || null,
      permissions: permissions || {
        view: ['admin', 'hr', 'manager', 'employee'],
        edit: ['admin', 'hr'],
        delete: ['admin']
      },
      createdBy: req.user._id
    });
    
    await folder.save();
    await folder.populate('createdBy', 'firstName lastName employeeId');
    
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update folder
router.put('/folders/:folderId', checkPermission('edit'), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    const folder = await Folder.findByIdAndUpdate(
      req.params.folderId,
      { name, description, permissions },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName employeeId');
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete folder (soft delete)
router.delete('/folders/:folderId', checkPermission('delete'), async (req, res) => {
  try {
    const folder = await Folder.findByIdAndUpdate(
      req.params.folderId,
      { isActive: false },
      { new: true }
    );
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Also archive all documents in the folder
    await DocumentManagement.updateMany(
      { folderId: req.params.folderId },
      { isActive: false, isArchived: true }
    );
    
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== DOCUMENT ROUTES ====================

// Upload document to folder
router.post('/folders/:folderId/documents', 
  checkPermission('edit'), 
  upload.single('file'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const { category, tags, employeeId, permissions, expiresOn, reminderEnabled } = req.body;
      
      // Check if folder exists
      const folder = await Folder.findById(req.params.folderId);
      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }
      
      // Create document
      const document = new DocumentManagement({
        folderId: req.params.folderId,
        employeeId: employeeId || null,
        fileName: req.file.originalname,
        fileUrl: `/uploads/documents/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        category: category || 'other',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        uploadedBy: req.user._id,
        permissions: permissions ? JSON.parse(permissions) : {
          view: ['admin', 'hr', 'manager', 'employee'],
          download: ['admin', 'hr', 'manager'],
          share: ['admin', 'hr']
        },
        expiresOn: expiresOn ? new Date(expiresOn) : null,
        reminderEnabled: reminderEnabled === 'true'
      });
      
      await document.save();
      await document.populate([
        { path: 'uploadedBy', select: 'firstName lastName employeeId' },
        { path: 'employeeId', select: 'firstName lastName employeeId' },
        { path: 'folderId', select: 'name' }
      ]);
      
      // Add audit log
      await document.addAuditLog('uploaded', req.user._id, 'Document uploaded');
      
      res.status(201).json(document);
    } catch (error) {
      // Clean up uploaded file if there's an error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Failed to clean up file:', cleanupError);
        }
      }
      res.status(500).json({ message: error.message });
    }
  }
);

// Get document by ID
router.get('/documents/:documentId', checkPermission('view'), async (req, res) => {
  try {
    const document = await DocumentManagement.findById(req.params.documentId)
      .populate('folderId', 'name')
      .populate('uploadedBy', 'firstName lastName employeeId')
      .populate('employeeId', 'firstName lastName employeeId');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Add audit log for viewing
    await document.addAuditLog('viewed', req.user._id, 'Document viewed');
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download document
router.get('/documents/:documentId/download', checkPermission('download'), async (req, res) => {
  try {
    const document = await DocumentManagement.findById(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    const filePath = path.join(__dirname, '..', document.fileUrl);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Increment download count
    await document.incrementDownload(req.user._id);
    
    res.download(filePath, document.fileName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update document
router.put('/documents/:documentId', checkPermission('edit'), async (req, res) => {
  try {
    const { category, tags, permissions, expiresOn, reminderEnabled } = req.body;
    
    const document = await DocumentManagement.findByIdAndUpdate(
      req.params.documentId,
      {
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
        permissions: permissions ? JSON.parse(permissions) : undefined,
        expiresOn: expiresOn ? new Date(expiresOn) : undefined,
        reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : undefined
      },
      { new: true, runValidators: true }
    ).populate([
      { path: 'folderId', select: 'name' },
      { path: 'uploadedBy', select: 'firstName lastName employeeId' },
      { path: 'employeeId', select: 'firstName lastName employeeId' }
    ]);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Add audit log
    await document.addAuditLog('updated', req.user._id, 'Document updated');
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new version of document
router.post('/documents/:documentId/version', 
  checkPermission('edit'), 
  upload.single('file'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const originalDocument = await DocumentManagement.findById(req.params.documentId);
      if (!originalDocument) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Create new version
      const newVersion = await originalDocument.createNewVersion(
        `/uploads/documents/${req.file.filename}`,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        req.user._id
      );
      
      await newVersion.populate([
        { path: 'folderId', select: 'name' },
        { path: 'uploadedBy', select: 'firstName lastName employeeId' },
        { path: 'employeeId', select: 'firstName lastName employeeId' }
      ]);
      
      // Add audit log
      await newVersion.addAuditLog('uploaded', req.user._id, 'New version uploaded');
      
      res.status(201).json(newVersion);
    } catch (error) {
      // Clean up uploaded file if there's an error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Failed to clean up file:', cleanupError);
        }
      }
      res.status(500).json({ message: error.message });
    }
  }
);

// Archive document
router.post('/documents/:documentId/archive', checkPermission('delete'), async (req, res) => {
  try {
    const document = await DocumentManagement.findById(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    await document.archive(req.user._id);
    
    res.json({ message: 'Document archived successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search documents
router.get('/documents/search', async (req, res) => {
  try {
    const { q, folderId } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const documents = await DocumentManagement.searchDocuments(q, { folderId });
    
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get expiring documents
router.get('/documents/expiring', async (req, res) => {
  try {
    const { days } = req.query;
    const documents = await DocumentManagement.getExpiringSoon(parseInt(days) || 30);
    
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get document versions
router.get('/documents/:documentId/versions', checkPermission('view'), async (req, res) => {
  try {
    const document = await DocumentManagement.findById(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    const versions = await DocumentManagement.find({
      $or: [
        { _id: req.params.documentId },
        { parentDocument: req.params.documentId }
      ]
    })
    .populate('uploadedBy', 'firstName lastName employeeId')
    .sort({ version: 1 });
    
    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
