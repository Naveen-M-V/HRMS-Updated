const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Folder = require('../models/Folder');
const DocumentManagement = require('../models/DocumentManagement');
const EmployeeHub = require('../models/EmployeesHub');

// ==================== UNIFIED DOCUMENT FETCH LOGIC ====================

// Get all documents (admin: all, employee: permitted only)
router.get('/documents', async (req, res) => {
  try {
    if (!req.user || (!req.user._id && !req.user.userId && !req.user.id)) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRole = req.user.role === 'admin' ? 'admin' : 'employee';
    const userId = req.user._id || req.user.userId || req.user.id;
    let query = { isActive: true };

    if (userRole === 'admin') {
      // Admin sees all
    } else {
      // Employee: only permitted documents
      query.$or = [
        { 'accessControl.visibility': 'all' },
        { 'accessControl.visibility': 'employee', ownerId: req.user.employeeId },
        { 'accessControl.allowedUserIds': userId }
      ];
    }

    // Optional: filter by folder, category, etc.
    if (req.query.folderId) query.folderId = req.query.folderId;
    if (req.query.category) query.category = req.query.category;

    const documents = await DocumentManagement.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('ownerId', 'firstName lastName employeeId')
      .populate('folderId', 'name')
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
      // If no user at this point, return 401 immediately
      if (!req.user) {
        console.warn('checkPermission: No user found, returning 401');
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
        
        if (!document.hasPermission(action, req.user)) {
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
    
    // Add document count to each folder
    const foldersWithCount = await Promise.all(folders.map(async (folder) => {
      // Count documents respecting access control
      let documentCountQuery = { folderId: folder._id, isActive: true, isArchived: false };
      if (req.user && req.user.role !== 'admin' && req.user.role !== 'super-admin') {
        const userId = req.user?._id || req.user?.userId || req.user?.id;
        documentCountQuery = {
          folderId: folder._id,
          isActive: true,
          isArchived: false,
          $or: [
            { 'accessControl.visibility': 'all' },
            { 'accessControl.visibility': 'employee', ownerId: req.user.employeeId },
            { 'accessControl.allowedUserIds': userId }
          ]
        };
      }
      const documentCount = await DocumentManagement.countDocuments(documentCountQuery);
      return {
        ...folder.toObject(),
        documentCount
      };
    }));
    
    console.log("✅ Folders fetched successfully:", foldersWithCount.length);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, folders: foldersWithCount });
  } catch (error) {
    console.error("💥 Error fetching folders:", error);
    res.status(500).json({ 
      success: false,
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
    
    // Apply access control: admin sees all, others see permitted documents
    let documents;
    const userRole = req.user && (req.user.role === 'admin' ? 'admin' : 'employee');
    const userId = req.user && (req.user._id || req.user.userId || req.user.id);

    if (userRole === 'admin') {
      documents = await DocumentManagement.getByFolder(req.params.folderId);
    } else {
      const query = {
        folderId: req.params.folderId,
        isActive: true,
        $or: [
          { 'accessControl.visibility': 'all' },
          { 'accessControl.visibility': 'employee', ownerId: req.user.employeeId },
          { 'accessControl.allowedUserIds': userId }
        ]
      };
      documents = await DocumentManagement.find(query)
        .populate('uploadedBy', 'firstName lastName email')
        .populate('ownerId', 'firstName lastName employeeId')
        .sort({ createdAt: -1 });
    }
    
    // Get subfolders
    const subfolders = await Folder.find({ parentId: req.params.folderId, isActive: true });
    
    // Format contents with type field for frontend
    const contents = [
      ...subfolders.map(f => ({ ...f.toObject(), type: 'folder' })),
      ...documents.map(d => ({ ...d.toObject(), type: 'document' }))
    ];
    
    res.json({
      folder,
      contents,
      documents // Keep for backwards compatibility
    });
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

router.post("/folders", async (req, res) => {
  try {
    console.log("FOLDER API BODY:", req.body);

    const { name, createdBy } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const createdById = createdBy || (req.user && (req.user._id || req.user.userId || req.user.id)) || null;

    const folder = await Folder.create({
      name: name.trim(),
      description: req.body.description || '',
      createdBy: createdById,
    });

    console.log("✅ Folder created successfully:", folder);
    return res.status(201).json({ success: true, folder });
  } catch (err) {
    console.error("FOLDER CREATION ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error creating folder" });
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

// Upload document to folder
router.post('/folders/:folderId/documents', 
  checkPermission('edit'),
  upload.single('file'),
  async (req, res) => {
    try {
      // --- Unified Document Upload Logic ---
      const authenticatedUserId = req.user?._id || req.user?.userId || req.user?.id;
      if (!req.user || !authenticatedUserId) {
        if (req.file) {
          try { await fs.unlink(req.file.path); } catch {}
        }
        return res.status(401).json({ message: 'Authentication required' });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Folder is optional, but if provided, check existence
      let folderId = req.params.folderId || null;
      if (folderId) {
        const folder = await Folder.findById(folderId);
        if (!folder) {
          return res.status(404).json({ message: 'Folder not found' });
        }
      } else {
        folderId = null;
      }

      // Determine uploader info
      const userRole = req.user.role === 'admin' ? 'admin' : 'employee';
      const uploadedBy = authenticatedUserId;
      const uploadedByRole = userRole;

      // OwnerId: for employee uploads, set to employeeId; for admin, can be null or set by admin
      let ownerId = null;
      if (userRole === 'employee') {
        // Try to get employeeId from user or request
        ownerId = req.user.employeeId || req.body.ownerId || null;
      } else if (req.body.ownerId) {
        ownerId = req.body.ownerId;
      }

      // Access control
      let accessControl = { visibility: 'all', allowedUserIds: [] };
      if (req.body.accessControl) {
        try {
          const parsed = typeof req.body.accessControl === 'string' ? JSON.parse(req.body.accessControl) : req.body.accessControl;
          accessControl = {
            visibility: parsed.visibility || 'all',
            allowedUserIds: Array.isArray(parsed.allowedUserIds) ? parsed.allowedUserIds : []
          };
        } catch (e) {
          // fallback to default
        }
      } else if (userRole === 'employee') {
        // Employees can only upload for themselves, default to employee-only
        accessControl = { visibility: 'employee', allowedUserIds: [uploadedBy] };
      }

      // Read file data into buffer
      const fileBuffer = await fs.readFile(req.file.path);

      // Create document
      const document = new DocumentManagement({
        name: req.file.originalname,
        fileUrl: null,
        fileData: fileBuffer,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy,
        uploadedByRole,
        ownerId,
        folderId,
        accessControl,
        category: req.body.category || 'other',
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
        version: 1,
        parentDocument: null,
        expiresOn: req.body.expiresOn ? new Date(req.body.expiresOn) : null,
        reminderEnabled: req.body.reminderEnabled === 'true',
        isActive: true,
        isArchived: false,
        downloadCount: 0,
        lastAccessedAt: null,
        auditLog: [{
          action: 'uploaded',
          performedBy: uploadedBy,
          timestamp: new Date(),
          details: `Document uploaded by ${req.user.firstName || ''} ${req.user.lastName || ''}`
        }]
      });

      // Delete uploaded file from filesystem after reading into buffer
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {}

      await document.save();

      await document.populate([
        { path: 'uploadedBy', select: 'firstName lastName email' },
        { path: 'ownerId', select: 'firstName lastName employeeId' },
        { path: 'folderId', select: 'name' }
      ]);

      res.status(201).json(document);
    } catch (error) {
      // Clean up uploaded file if there's an error
      if (req.file) {
        try { await fs.unlink(req.file.path); } catch {}
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
      .populate('uploadedBy', 'firstName lastName email')
      .populate('ownerId', 'firstName lastName employeeId');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Add audit log for viewing
    try {
      const userId = req.user?._id || req.user?.userId || req.user?.id;
      if (userId) {
        document.auditLog.push({
          action: 'viewed',
          performedBy: userId,
          timestamp: new Date(),
          details: 'Document viewed'
        });
        await document.save();
      }
    } catch (auditError) {
      console.error('Error logging view:', auditError);
      // Continue to return document even if audit fails
    }
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// View/stream document (for opening in browser) - accepts token in query param
router.get('/documents/:documentId/view', async (req, res) => {
  try {
    console.log('=== View Document Request ===');
    console.log('Query token:', req.query.token ? 'Present' : 'Missing');
    console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Check for token in query parameter or Authorization header
    const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      console.error('No token found in request');
      return res.status(401).json({ message: 'Authentication required - no token' });
    }
    
    console.log('Token found, verifying...');
    
    // Verify token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'hrms-jwt-secret-key-2024';
    let user;
    try {
      user = jwt.verify(token, JWT_SECRET);
      console.log('Token verified successfully for user:', user.email);
    } catch (err) {
      console.error('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Check permissions
    if (user.role !== 'admin' && user.role !== 'super-admin') {
      const document = await DocumentManagement.findById(req.params.documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      if (!document.hasPermission('view', user)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
    }
    
    const document = await DocumentManagement.findById(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    if (!document.fileData) {
      return res.status(404).json({ message: 'File data not found' });
    }
    
    // Send file inline (for viewing in browser)
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.name || document.fileName}"`);
    res.setHeader('Content-Length', document.fileData.length);
    res.send(document.fileData);
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload document without folder (optional folder)
router.post('/documents',
  checkPermission('edit'),
  upload.single('file'),
  async (req, res) => {
    try {
      const authenticatedUserId = req.user?._id || req.user?.userId || req.user?.id;
      if (!req.user || !authenticatedUserId) {
        if (req.file) {
          try { await fs.unlink(req.file.path); } catch {}
        }
        return res.status(401).json({ message: 'Authentication required' });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // No folder provided
      const folderId = null;

      const userRole = req.user.role === 'admin' ? 'admin' : 'employee';
      const uploadedBy = authenticatedUserId;
      const uploadedByRole = userRole;

      let ownerId = null;
      if (userRole === 'employee') {
        ownerId = req.user.employeeId || req.body.ownerId || null;
      } else if (req.body.ownerId) {
        ownerId = req.body.ownerId;
      }

      let accessControl = { visibility: 'all', allowedUserIds: [] };
      if (req.body.accessControl) {
        try {
          const parsed = typeof req.body.accessControl === 'string' ? JSON.parse(req.body.accessControl) : req.body.accessControl;
          accessControl = {
            visibility: parsed.visibility || 'all',
            allowedUserIds: Array.isArray(parsed.allowedUserIds) ? parsed.allowedUserIds : []
          };
        } catch (e) {}
      } else if (userRole === 'employee') {
        accessControl = { visibility: 'employee', allowedUserIds: [uploadedBy] };
      }

      const fileBuffer = await fs.readFile(req.file.path);

      const document = new DocumentManagement({
        name: req.file.originalname,
        fileUrl: null,
        fileData: fileBuffer,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy,
        uploadedByRole,
        ownerId,
        folderId,
        accessControl,
        category: req.body.category || 'other',
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
        version: 1,
        parentDocument: null,
        expiresOn: req.body.expiresOn ? new Date(req.body.expiresOn) : null,
        reminderEnabled: req.body.reminderEnabled === 'true',
        isActive: true,
        isArchived: false,
        downloadCount: 0,
        lastAccessedAt: null,
        auditLog: [{ action: 'uploaded', performedBy: uploadedBy, timestamp: new Date(), details: `Document uploaded by ${req.user.firstName || ''} ${req.user.lastName || ''}` }]
      });

      try { await fs.unlink(req.file.path); } catch {}

      await document.save();
      await document.populate([
        { path: 'uploadedBy', select: 'firstName lastName email' },
        { path: 'ownerId', select: 'firstName lastName employeeId' }
      ]);

      res.status(201).json(document);
    } catch (error) {
      if (req.file) { try { await fs.unlink(req.file.path); } catch {} }
      res.status(500).json({ message: error.message });
    }
  }
);

// Download document
router.get('/documents/:documentId/download', checkPermission('download'), async (req, res) => {
  try {
    const document = await DocumentManagement.findById(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    if (!document.fileData) {
      return res.status(404).json({ message: 'File data not found' });
    }
    
    // Increment download count - don't block download if this fails
    try {
      const userId = req.user?._id || req.user?.userId || req.user?.id;
      document.downloadCount += 1;
      document.lastAccessedAt = new Date();
      if (userId) {
        document.auditLog.push({
          action: 'downloaded',
          performedBy: userId,
          timestamp: new Date(),
          details: 'Document downloaded'
        });
      }
      await document.save();
    } catch (auditError) {
      console.error('Error updating download audit:', auditError);
      // Continue with download even if audit fails
    }
    
    // Send file from MongoDB buffer
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.name || document.fileName}"`);
    res.setHeader('Content-Length', document.fileData.length);
    res.send(document.fileData);
  } catch (error) {
    console.error('Download error:', error);
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
    try {
      const userId = req.user?._id || req.user?.userId || req.user?.id;
      if (userId) {
        document.auditLog.push({
          action: 'updated',
          performedBy: userId,
          timestamp: new Date(),
          details: 'Document updated'
        });
        await document.save();
      }
    } catch (auditError) {
      console.error('Error logging update:', auditError);
      // Continue to return document even if audit fails
    }
    
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
      
      // Read file data into buffer
      const fileBuffer = await fs.readFile(req.file.path);
      
      // Delete temp file
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
      
      // Create new version
      const userId = req.user._id || req.user.userId || req.user.id;
      const newVersion = await originalDocument.createNewVersion(
        fileBuffer,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        userId
      );
      
      await newVersion.populate([
        { path: 'folderId', select: 'name' },
        { path: 'uploadedBy', select: 'firstName lastName employeeId' },
        { path: 'employeeId', select: 'firstName lastName employeeId' }
      ]);
      
      // Add audit log
      try {
        if (userId) {
          newVersion.auditLog.push({
            action: 'uploaded',
            performedBy: userId,
            timestamp: new Date(),
            details: 'New version uploaded'
          });
          await newVersion.save();
        }
      } catch (auditError) {
        console.error('Error logging new version:', auditError);
        // Continue to return document even if audit fails
      }
      
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
    
    const userId = req.user?._id || req.user?.userId || req.user?.id;
    document.isArchived = true;
    document.isActive = false;
    if (userId) {
      document.auditLog.push({
        action: 'archived',
        performedBy: userId,
        timestamp: new Date(),
        details: 'Document archived'
      });
    }
    await document.save();
    
    res.json({ message: 'Document archived successfully' });
  } catch (error) {
    console.error('Archive error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete document
router.delete('/documents/:documentId', checkPermission('delete'), async (req, res) => {
  try {
    const document = await DocumentManagement.findById(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Delete from database (file data is stored in MongoDB, no filesystem cleanup needed)
    await DocumentManagement.findByIdAndDelete(req.params.documentId);
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
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
