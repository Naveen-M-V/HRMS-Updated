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
      console.log('Upload directory ensured:', uploadPath);
      cb(null, uploadPath);
    } catch (error) {
      console.error('Error creating upload directory:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    console.log('Generating filename:', filename);
    cb(null, filename);
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
      if (!req.user) {
        console.error('checkPermission: No user in request');
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const user = req.user;
      const userRole = user.role || 'employee';
      
      // Admin and super-admin have all permissions
      if (userRole === 'admin' || userRole === 'super-admin') {
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

// Health check endpoint
router.get('/health', (req, res) => {
  console.log('🏥 Document Management Health Check Called');
  res.json({ 
    status: 'OK', 
    message: 'Document Management API is working',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to check Folder model
router.get('/test-folder', async (req, res) => {
  try {
    console.log('🧪 Testing Folder model...');
    
    // Test if Folder model exists
    console.log('📁 Folder model:', typeof Folder);
    
    // Test database connection
    const count = await Folder.countDocuments();
    console.log('📊 Folder count:', count);
    
    // Test creating a simple folder
    const testFolder = {
      name: 'Test Folder ' + Date.now(),
      description: 'Test description',
      createdBy: 'system'
    };
    
    console.log('✅ Test endpoint successful');
    res.json({
      status: 'OK',
      folderModelExists: typeof Folder === 'function',
      folderCount: count,
      testFolder: testFolder
    });
  } catch (error) {
    console.error('💥 Test endpoint error:', error);
    console.error('💥 Error stack:', error.stack);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      stack: error.stack
    });
  }
});

// Get all folders - SIMPLIFIED
router.get('/folders', async (req, res) => {
  try {
    console.log("📂 Fetching folders...");
    const folders = await Folder.find({ isActive: true })
      .sort({ name: 1 });
    
    console.log("✅ Folders fetched successfully:", folders.length);
    res.json(folders);
  } catch (error) {
    console.error("💥 Error fetching folders:", error);
    res.status(500).json({ 
      message: error.message || 'Internal server error while fetching folders' 
    });
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

// Create new folder - WORKING VERSION
router.post("/folders", async (req, res) => {
  try {
    console.log("FOLDER API BODY:", req.body);

    const { name, createdBy } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const folder = await Folder.create({
      name: name.trim(),
      description: req.body.description || '',
      createdBy: createdBy || null,
    });

    console.log("✅ Folder created successfully:", folder);
    return res.status(201).json(folder);
  } catch (err) {
    console.error("FOLDER CREATION ERROR:", err);
    return res.status(500).json({ message: "Server error creating folder" });
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
      console.log('=== Document Upload Request ===');
      console.log('User:', req.user?._id);
      console.log('Folder ID:', req.params.folderId);
      console.log('File received:', req.file ? req.file.originalname : 'No file');
      console.log('Body:', req.body);
      
      if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const { category, tags, employeeId, permissions, expiresOn, reminderEnabled } = req.body;
      
      // Check if folder exists
      const folder = await Folder.findById(req.params.folderId);
      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }
      
      // Determine uploader ID and type
      let uploaderId = req.user._id;
      let uploaderType = 'User';
      
      if (req.user.email) {
        const employee = await EmployeeHub.findOne({ email: req.user.email });
        if (employee) {
          uploaderId = employee._id;
          uploaderType = 'EmployeeHub';
        }
      }
      
      console.log('Uploader ID:', uploaderId, 'Type:', uploaderType);
      
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
        uploadedBy: uploaderId,
        uploaderType: uploaderType,
        permissions: permissions ? JSON.parse(permissions) : {
          view: ['admin', 'hr', 'manager', 'employee'],
          download: ['admin', 'hr', 'manager'],
          share: ['admin', 'hr']
        },
        expiresOn: expiresOn ? new Date(expiresOn) : null,
        reminderEnabled: reminderEnabled === 'true'
      });
      
      await document.save();
      
      // Populate with correct model based on uploaderType
      if (document.uploaderType === 'User') {
        await document.populate({ path: 'uploadedBy', model: 'User', select: 'firstName lastName email' });
      } else {
        await document.populate({ path: 'uploadedBy', model: 'EmployeeHub', select: 'firstName lastName employeeId' });
      }
      
      await document.populate([
        { path: 'employeeId', select: 'firstName lastName employeeId' },
        { path: 'folderId', select: 'name' }
      ]);
      
      // Add audit log
      await document.addAuditLog('uploaded', req.user._id, `Document uploaded by ${req.user.firstName} ${req.user.lastName}`);
      
      console.log('Document uploaded successfully:', document._id);
      res.status(201).json(document);
    } catch (error) {
      console.error('=== Document Upload Error ===');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      
      // Clean up uploaded file if there's an error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
          console.log('Cleaned up failed upload file:', req.file.path);
        } catch (cleanupError) {
          console.error('Failed to clean up file:', cleanupError);
        }
      }
      res.status(500).json({ 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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
