const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
// Load environment configuration
const envConfig = require('./config/environment');
const config = envConfig.getConfig();

const app = express();
const PORT = config.server.port;
const JWT_SECRET = config.jwt.secret;
const MONGODB_URI = config.database.uri;

// Middleware
app.use(cookieParser());

// Updated session middleware configuration
app.use(session({
  secret: process.env.SESSION_SECRET, // Removed insecure fallback
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600, // Lazy session update
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    // Remove domain restriction to allow same-origin cookies
    domain: undefined
  },
  name: 'talentshield.sid' // Custom session name
}));

// Adjusted CORS configuration to use FRONTEND_URL from .env
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://talentshield.co.uk',
    'https://talentshield.co.uk',
    'http://localhost:5003'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Input validation middleware
const validateProfileInput = (req, res, next) => {
  const { firstName, lastName, email } = req.body;
  
  if (!firstName || firstName.trim().length < 1) {
    return res.status(400).json({ message: 'First name is required' });
  }
  
  if (!lastName || lastName.trim().length < 1) {
    return res.status(400).json({ message: 'Last name is required' });
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }
  
  next();
};

const validateCertificateInput = (req, res, next) => {
  const { certificate, category } = req.body;
  
  if (!certificate || certificate.trim().length < 1) {
    return res.status(400).json({ message: 'Certificate name is required' });
  }
  
  if (!category || category.trim().length < 1) {
    return res.status(400).json({ message: 'Certificate category is required' });
  }
  
  next();
};

// MongoDB connection
mongoose.connect(MONGODB_URI);

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});

// Profile Schema
const profileSchema = new mongoose.Schema({
  // Basic Info
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: String,
  dateOfBirth: Date,
  gender: String,
  profilePicture: String,
  
  // Job Details
  role: { type: String, default: 'User' },
  staffType: { type: String, default: 'Direct' },
  company: { type: String, default: 'VitruX Ltd' },
  jobTitle: String,
  jobLevel: String,
  language: { type: String, default: 'English' },
  startDate: Date,
  
  // System IDs
  skillkoId: { type: Number, unique: true },
  externalSystemId: String,
  extThirdPartySystemId: String,
  nopsId: String,
  nopsID: String, // Added for consistency with frontend
  insuranceNumber: String,
  
  // Additional Employee Details
  poc: String, // Point of Contact
  nationality: String,
  circetUIN: String,
  circetSCID: String,
  morrisonsIDNumber: String,
  morrisonsUIN: String,
  status: { type: String, default: 'Onboarding' }, // Onboarded, Onboarding, Dropped Out, Left
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },
  
  // Address
  address: {
    line1: String,
    line2: String,
    city: String,
    postCode: String,
    country: { type: String, default: 'Poland' },
  },
  
  // Metadata
  createdOn: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
  mobileVerified: { type: Boolean, default: false },
  
  // Bio and other info
  bio: String,
  otherInformation: String,
});

// Auto-generate skillkoId
profileSchema.pre('save', async function(next) {
  if (!this.skillkoId) {
    const lastProfile = await this.constructor.findOne({}, {}, { sort: { 'skillkoId': -1 } });
    this.skillkoId = lastProfile ? lastProfile.skillkoId + 1 : 1150;
  }
  next();
});

const Profile = mongoose.model('Profile', profileSchema);

// User Schema for Authentication
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }, // user, admin
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Clear any existing User model to avoid schema conflicts
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model('User', userSchema);

// Certificate Schema
const certificateSchema = new mongoose.Schema({
  certificate: { type: String, required: true },
  description: String,
  account: String,
  issueDate: String,
  expiryDate: String,
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  profileName: String,
  provider: String,
  fileRequired: { type: String, default: 'No' },
  active: { type: String, default: 'Yes' },
  status: { type: String, default: 'Approved' },
  cost: { type: String, default: '0.00' },
  category: { type: String, required: true }, // Safety, Craft, NRSWA, Security, Optional, etc.
  jobRole: String, // The job role this certificate is associated with
  approvalStatus: String,
  isInterim: { type: String, default: 'False' }, // Changed to String to match frontend
  timeLogged: {
    days: { type: String, default: '0' },
    hours: { type: String, default: '0' },
    minutes: { type: String, default: '0' }
  },
  supplier: String,
  totalCost: String,
  
  // File upload fields
  certificateFile: String, // Store filename
  filePath: String, // Store full file path
  fileData: Buffer, // Store file data if needed
  
  archived: { type: String, default: 'Unarchived' },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now }
});

const Certificate = mongoose.model('Certificate', certificateSchema);

// Supplier Schema
const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdOn: { type: Date, default: Date.now },
  usageCount: { type: Number, default: 1 }
});

const Supplier = mongoose.model('Supplier', supplierSchema);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    fieldSize: 10 * 1024 * 1024  // 10MB field limit
  }
});

// Routes

// Helper function to parse date strings in various formats
const parseExpiryDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Handle different date formats
    let date;
    
    // Check if it's already a valid Date object
    if (dateString instanceof Date) {
      return dateString;
    }
    
    // Convert to string and clean up
    const cleanDate = dateString.toString().trim();
    
    // Try ISO format first (YYYY-MM-DD)
    if (cleanDate.match(/^\d{4}-\d{2}-\d{2}/)) {
      date = new Date(cleanDate);
    }
    // Try DD/MM/YYYY format
    else if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const [day, month, year] = cleanDate.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Try MM/DD/YYYY format
    else if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) && new Date(cleanDate).getTime()) {
      date = new Date(cleanDate);
    }
    // Try YYYY/MM/DD format
    else if (cleanDate.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
      const [year, month, day] = cleanDate.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Default: try direct parsing
    else {
      date = new Date(cleanDate);
    }
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date format: ${dateString}`);
      return null;
    }
    
    return date;
  } catch (error) {
    console.warn(`Error parsing date: ${dateString}`, error);
    return null;
  }
};

// Routes

// Get all profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ createdOn: -1 });
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get profile by ID
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new profile
app.post('/api/profiles', validateProfileInput, async (req, res) => {
  try {
    const profile = new Profile(req.body);
    const savedProfile = await profile.save();
    
    // Create notification for profile creation
    try {
      const users = await User.find({ role: 'admin' });
      for (const user of users) {
        const notification = new Notification({
          userId: user._id,
          type: 'profile_created',
          priority: 'low',
          message: `New profile created: ${savedProfile.firstName} ${savedProfile.lastName}`,
          read: false
        });
        await notification.save();
      }
      
      // Send email notification for account creation
      const subject = 'Welcome to Talent Shield HRMS';
      const body = `Dear ${savedProfile.firstName} ${savedProfile.lastName},\n\nYour account has been successfully created in Talent Shield HRMS.\n\nYour login details:\nEmail: ${savedProfile.email}\nSkillko ID: ${savedProfile.skillkoId}\n\nPlease contact your administrator for your login credentials.\n\nBest regards,\nTalent Shield HRMS Team`;
      
      await sendEmailNotification(savedProfile.email, subject, body);
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
    }
    
    res.status(201).json(savedProfile);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update profile
app.put('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastSeen: new Date() },
      { new: true, runValidators: true }
    );
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    // Create notification for profile update
    try {
      const users = await User.find({ role: 'admin' });
      for (const user of users) {
        const notification = new Notification({
          userId: user._id,
          type: 'profile_updated',
          priority: 'low',
          message: `Profile updated: ${profile.firstName} ${profile.lastName}`,
          read: false
        });
        await notification.save();
      }
    } catch (notificationError) {
      console.error('Error creating update notification:', notificationError);
    }
    
    res.json(profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upload profile picture
app.post('/api/profiles/:id/upload-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { profilePicture: `/uploads/${req.file.filename}` },
      { new: true }
    );
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json({ profilePicture: profile.profilePicture });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete profile
app.delete('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    const deletedProfile = await Profile.findByIdAndDelete(req.params.id);
    
    // Create notification for profile deletion
    try {
      const users = await User.find({ role: 'admin' });
      for (const user of users) {
        const notification = new Notification({
          userId: user._id,
          type: 'profile_deleted',
          priority: 'medium',
          message: `Profile deleted: ${profile.firstName} ${profile.lastName}`,
          read: false
        });
        await notification.save();
      }
    } catch (notificationError) {
      console.error('Error creating delete notification:', notificationError);
    }
    
    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Certificate Routes

// Get all certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ createdOn: -1 });
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get certificate by ID
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new certificate with file upload
app.post('/api/certificates', upload.single('certificateFile'), validateCertificateInput, async (req, res) => {
  try {
    const certificateData = { ...req.body };
    
    // Handle file upload if present
    if (req.file) {
      certificateData.certificateFile = req.file.filename;
      certificateData.filePath = req.file.path;
    }

    const certificate = new Certificate(certificateData);
    const savedCertificate = await certificate.save();
    
    // Create notification for certificate creation
    try {
      const users = await User.find({ role: 'admin' });
      for (const user of users) {
        const notification = new Notification({
          userId: user._id,
          type: 'certificate_created',
          priority: 'low',
          message: `New certificate added: ${savedCertificate.certificate} for ${savedCertificate.profileName}`,
          read: false
        });
        await notification.save();
      }
    } catch (notificationError) {
      console.error('Error creating certificate notification:', notificationError);
    }
    
    res.status(201).json(savedCertificate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update certificate
app.put('/api/certificates/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        updatedOn: new Date()
      },
      { new: true }
    );
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    res.json(certificate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update certificate with file upload
app.put('/api/certificates/:id/upload', upload.single('certificateFile'), async (req, res) => {
  try {
    console.log('File upload request received for certificate ID:', req.params.id);
    console.log('File info:', req.file);
    console.log('Request body:', req.body);

    const updateData = { updatedOn: new Date() };
    
    // If file is uploaded, add file path to update data
    if (req.file) {
      updateData.certificateFile = `/uploads/${req.file.filename}`;
      console.log('File uploaded successfully:', req.file.filename);
    } else {
      console.log('No file received in request');
    }
    
    // Add any other fields from request body
    Object.assign(updateData, req.body);
    
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!certificate) {
      console.log('Certificate not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    console.log('Certificate updated successfully:', certificate._id);
    res.json(certificate);
  } catch (error) {
    console.error('Error in certificate file upload:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete certificate
app.delete('/api/certificates/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    const deletedCertificate = await Certificate.findByIdAndDelete(req.params.id);
    
    // Create notification for certificate deletion
    try {
      const users = await User.find({ role: 'admin' });
      for (const user of users) {
        const notification = new Notification({
          userId: user._id,
          type: 'certificate_deleted',
          priority: 'medium',
          message: `Certificate deleted: ${certificate.certificate} for ${certificate.profileName}`,
          read: false
        });
        await notification.save();
      }
    } catch (notificationError) {
      console.error('Error creating certificate delete notification:', notificationError);
    }
    
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supplier Routes

// Get all suppliers
app.get('/api/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ usageCount: -1, name: 1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or get supplier
app.post('/api/suppliers', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }
    
    const trimmedName = name.trim();
    
    // Check if supplier already exists
    let supplier = await Supplier.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    
    if (supplier) {
      // Increment usage count
      supplier.usageCount += 1;
      await supplier.save();
    } else {
      // Create new supplier
      supplier = new Supplier({
        name: trimmedName,
        createdBy: req.user?.userId,
        usageCount: 1
      });
      await supplier.save();
    }
    
    res.json(supplier);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Supplier already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Search suppliers
app.get('/api/suppliers/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      const suppliers = await Supplier.find().sort({ usageCount: -1, name: 1 }).limit(10);
      return res.json(suppliers);
    }
    
    const suppliers = await Supplier.find({
      name: { $regex: q, $options: 'i' }
    }).sort({ usageCount: -1, name: 1 }).limit(10);
    
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Notification Routes

// Get all notifications for a user
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Mark all notifications as read for a user
app.put('/api/notifications/user/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get unread notification count
app.get('/api/notifications/:userId/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.params.userId, 
      read: false 
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard Analytics Endpoints

// Get certificate statistics for dashboard
app.get('/api/certificates/analytics/stats', async (req, res) => {
  try {
    const totalCertificates = await Certificate.countDocuments();
    const activeCertificates = await Certificate.countDocuments({ 
      active: 'Yes', 
      status: 'Approved' 
    });
    
    // Calculate expiring certificates (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const expiringCertificates = await Certificate.find({
      active: 'Yes',
      status: 'Approved',
      expiryDate: { $exists: true, $ne: null }
    });
    
    let expiringCount = 0;
    let expiredCount = 0;
    
    expiringCertificates.forEach(cert => {
      if (cert.expiryDate) {
        const expiryDate = parseExpiryDate(cert.expiryDate);
        
        if (expiryDate) {
          if (expiryDate < today) {
            expiredCount++;
          } else if (expiryDate <= thirtyDaysFromNow) {
            expiringCount++;
          }
        }
      }
    });
    
    res.json({
      total: totalCertificates,
      active: activeCertificates,
      expiring: expiringCount,
      expired: expiredCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get certificates by category
app.get('/api/certificates/analytics/by-category', async (req, res) => {
  try {
    const certificates = await Certificate.find({ 
      active: 'Yes', 
      status: 'Approved' 
    });
    
    const categoryCounts = {};
    certificates.forEach(cert => {
      const category = cert.category || 'Other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    res.json(categoryCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get certificates by job role
app.get('/api/certificates/analytics/by-job-role', async (req, res) => {
  try {
    const certificates = await Certificate.find({ 
      active: 'Yes', 
      status: 'Approved' 
    });
    
    const jobRoleCounts = {};
    certificates.forEach(cert => {
      const jobRole = cert.jobRole || 'Unspecified';
      jobRoleCounts[jobRole] = (jobRoleCounts[jobRole] || 0) + 1;
    });
    
    res.json(jobRoleCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get expiring certificates with details
app.get('/api/certificates/expiring/:days?', async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const certificates = await Certificate.find({
      active: 'Yes',
      status: 'Approved',
      expiryDate: { $exists: true, $ne: null }
    }).populate('profileId');
    
    const expiringCertificates = certificates.filter(cert => {
      if (!cert.expiryDate) return false;
      
      const expiryDate = parseExpiryDate(cert.expiryDate);
      
      return expiryDate && expiryDate >= today && expiryDate <= futureDate;
    });
    
    res.json(expiringCertificates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get expired certificates
app.get('/api/certificates/expired', async (req, res) => {
  try {
    const today = new Date();
    
    const certificates = await Certificate.find({
      active: 'Yes',
      expiryDate: { $exists: true, $ne: null }
    }).populate('profileId');
    
    const expiredCertificates = certificates.filter(cert => {
      if (!cert.expiryDate) return false;
      
      const expiryDate = parseExpiryDate(cert.expiryDate);
      
      return expiryDate && expiryDate < today;
    });
    
    res.json(expiredCertificates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Debug endpoint to check certificate dates
app.get('/api/certificates/debug-dates', async (req, res) => {
  try {
    const certificates = await Certificate.find({
      expiryDate: { $exists: true, $ne: null }
    }).limit(10);
    
    const today = new Date();
    const debugInfo = certificates.map(cert => {
      const parsedDate = parseExpiryDate(cert.expiryDate);
      return {
        id: cert._id,
        certificate: cert.certificate,
        originalDate: cert.expiryDate,
        parsedDate: parsedDate,
        isValid: parsedDate && !isNaN(parsedDate.getTime()),
        isExpired: parsedDate && parsedDate < today,
        daysFromNow: parsedDate ? Math.ceil((parsedDate - today) / (1000 * 60 * 60 * 24)) : null
      };
    });
    
    res.json({
      today: today,
      certificates: debugInfo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get certificates by profile ID
app.get('/api/profiles/:profileId/certificates', async (req, res) => {
  try {
    const { profileId } = req.params;
    const certificates = await Certificate.find({ profileId }).sort({ createdOn: -1 });
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get profile stats (certificates count, etc.)
app.get('/api/profiles/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const totalCertificates = await Certificate.countDocuments({ profileId: id });
    const activeCertificates = await Certificate.countDocuments({ 
      profileId: id, 
      active: 'Yes', 
      status: 'Approved' 
    });
    
    const profile = await Profile.findById(id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json({
      profile: {
        id: profile._id,
        name: `${profile.firstName} ${profile.lastName}`,
        jobTitle: profile.jobTitle,
        company: profile.company
      },
      certificates: {
        total: totalCertificates,
        active: activeCertificates
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Authentication Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isActive: true
    });

    await user.save();

    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
const { sendLoginSuccessEmail, sendCertificateExpiryEmail, sendNotificationEmail, testEmailConfiguration } = require('./utils/emailService');
const { startCertificateMonitoring, triggerCertificateCheck } = require('./utils/certificateMonitor');

// Import notification routes
const notificationRoutes = require('./routes/notifications');

// Use notification routes (moved after authenticateSession definition)
// This will be added later after the middleware is defined

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create session data
    const sessionUser = {
      userId: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Store user in session
    req.session.user = sessionUser;

    // Force session save
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      } else {
        console.log('Session saved successfully for user:', sessionUser.email);
      }
    });

    // If remember me is checked, extend session duration
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    // Generate JWT token for API compatibility
    const token = jwt.sign(sessionUser, JWT_SECRET, { expiresIn: '24h' });

    // Send login success email notification
    try {
      const loginTime = new Date().toLocaleString();
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
      const userName = `${user.firstName} ${user.lastName}`;
      
      await sendLoginSuccessEmail(user.email, userName, loginTime, ipAddress);
    } catch (emailError) {
      console.error('Failed to send login success email:', emailError);
      // Don't fail the login if email fails
    }

    res.json({
      message: 'Login successful',
      token, // Keep for backward compatibility
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      return res.json({ message: 'Logout successful' });
    });
  } else {
    return res.json({ message: 'No active session' });
  }
});

// Session validation endpoint
app.get('/api/auth/validate-session', (req, res) => {
  console.log('Session validation request:', {
    sessionExists: !!req.session,
    sessionUser: req.session?.user ? 'exists' : 'missing',
    sessionId: req.sessionID,
    cookies: req.headers.cookie
  });
  
  if (req.session && req.session.user) {
    return res.json({
      isAuthenticated: true,
      user: {
        id: req.session.user.userId,
        firstName: req.session.user.firstName,
        lastName: req.session.user.lastName,
        email: req.session.user.email,
        role: req.session.user.role
      }
    });
  }
  
  return res.status(401).json({ 
    isAuthenticated: false, 
    message: 'No active session' 
  });
});

// Reset Password with Old Password Verification
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Email, old password, and new password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      });
    }

    // Check if new password is different from old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from the old password' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});

// Session-based authentication middleware
const authenticateSession = (req, res, next) => {
  // Check if user is authenticated via session
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Fallback to JWT token authentication for API compatibility
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Legacy JWT middleware for backward compatibility
const authenticateToken = authenticateSession;

// Use notification routes (now that authenticateSession is defined)
app.use('/api/notifications', authenticateSession, notificationRoutes);

// Email configuration using SMTP settings from .env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // 'certificate_expiry', 'certificate_expired', 'system'
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  message: { type: String, required: true },
  certificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
  read: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Function to calculate days until expiry
const calculateDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Function to send email notification
const sendEmailNotification = async (userEmail, subject, body) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: userEmail,
      subject: subject,
      text: body
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${userEmail}: ${subject}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Function to check certificate expiry and create notifications
const checkCertificateExpiry = async () => {
  try {
    console.log('Checking certificate expiry...');
    
    const certificates = await Certificate.find({});
    const users = await User.find({});
    
    for (const cert of certificates) {
      if (!cert.expiryDate) continue;
      
      const daysUntilExpiry = calculateDaysUntilExpiry(cert.expiryDate);
      
      // Find the user who owns this certificate (assuming userId field exists)
      const user = users.find(u => u._id.toString() === cert.userId?.toString());
      if (!user) continue;
      
      let shouldNotify = false;
      let priority = 'low';
      let message = '';
      
      // Check if we should create a notification (only 15 and 30 days)
      if (daysUntilExpiry <= 0) {
        priority = 'critical';
        message = `Certificate "${cert.certificate}" has expired!`;
        shouldNotify = true;
      } else if (daysUntilExpiry === 15) {
        priority = 'high';
        message = `Certificate "${cert.certificate}" expires in 15 days`;
        shouldNotify = true;
      } else if (daysUntilExpiry === 30) {
        priority = 'medium';
        message = `Certificate "${cert.certificate}" expires in 30 days`;
        shouldNotify = true;
      }
      
      if (shouldNotify) {
        // Check if notification already exists for this certificate and timeframe
        const existingNotification = await Notification.findOne({
          userId: user._id,
          certificateId: cert._id,
          type: daysUntilExpiry <= 0 ? 'certificate_expired' : 'certificate_expiry',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
        });
        
        if (!existingNotification) {
          // Create notification
          const notification = new Notification({
            userId: user._id,
            type: daysUntilExpiry <= 0 ? 'certificate_expired' : 'certificate_expiry',
            priority: priority,
            message: message,
            certificateId: cert._id
          });
          
          await notification.save();
          
          // Send email notification
          let subject = '';
          let body = '';
          
          if (daysUntilExpiry <= 0) {
            subject = `URGENT: Certificate "${cert.certificate}" has expired`;
            body = `Dear ${user.firstName} ${user.lastName},\n\nYour certificate "${cert.certificate}" has expired as of ${cert.expiryDate}.\n\nPlease renew this certificate immediately to maintain compliance.\n\nBest regards,\nTalent Shield HRMS Team`;
          } else {
            subject = `${daysUntilExpiry <= 15 ? 'URGENT: ' : ''}Certificate "${cert.certificate}" expires in ${daysUntilExpiry} days`;
            body = `Dear ${user.firstName} ${user.lastName},\n\nYour certificate "${cert.certificate}" will expire in ${daysUntilExpiry} days on ${cert.expiryDate}.\n\nPlease ${daysUntilExpiry <= 15 ? 'take immediate action' : 'plan'} to renew this certificate before it expires.\n\nBest regards,\nTalent Shield HRMS Team`;
          }
          
          const emailSent = await sendEmailNotification(user.email, subject, body);
          
          if (emailSent) {
            notification.emailSent = true;
            await notification.save();
          }
          
          console.log(`Created notification for user ${user.email}: ${message}`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking certificate expiry:', error);
  }
};

// Schedule certificate expiry check to run daily at 9 AM
cron.schedule('0 9 * * *', () => {
  console.log('Running daily certificate expiry check...');
  checkCertificateExpiry();
});

// API endpoint to get notifications for a user
app.get('/api/notifications/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const notifications = await Notification.find({ userId })
      .populate('certificateId')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// API endpoint to mark notification as read
app.put('/api/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// API endpoint to manually trigger certificate expiry check
app.post('/api/notifications/check-expiry', authenticateToken, async (req, res) => {
  try {
    await checkCertificateExpiry();
    res.json({ success: true, message: 'Certificate expiry check completed' });
  } catch (error) {
    console.error('Error running certificate expiry check:', error);
    res.status(500).json({ error: 'Failed to run certificate expiry check' });
  }
});

// Clear users with old schema and create default user
const createDefaultUser = async () => {
  try {
    // Remove any users that might have the old schema with department/position
    await User.deleteMany({
      $or: [
        { department: { $exists: true } },
        { position: { $exists: true } }
      ]
    });
    
    const existingUser = await User.findOne({ email: 'admin@talentshield.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const defaultUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@talentshield.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      await defaultUser.save();
      console.log('Default user created: admin@talentshield.com / admin123');
    }
  } catch (error) {
    console.error('Error creating default user:', error);
  }
};

// Create default suppliers
const createDefaultSuppliers = async () => {
  try {
    const defaultSuppliers = [
      'SKILLS PROVIDER',
      'Internal Training',
      'External Provider',
      'Certification Body',
      'Online Training Platform',
      'Professional Institute',
      'Trade Association'
    ];

    for (const supplierName of defaultSuppliers) {
      const existingSupplier = await Supplier.findOne({ name: supplierName });
      if (!existingSupplier) {
        const supplier = new Supplier({
          name: supplierName,
          usageCount: 0
        });
        await supplier.save();
      }
    }
    console.log('Default suppliers created');
  } catch (error) {
    console.error('Error creating default suppliers:', error);
  }
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Create default user on startup
  setTimeout(() => {
    createDefaultUser();
    createDefaultSuppliers();
  }, 2000);
  
  // Start certificate monitoring
  startCertificateMonitoring();
  
  // Run initial certificate expiry check on startup
  setTimeout(() => {
    console.log('Running initial certificate expiry check...');
    triggerCertificateCheck();
  }, 5000); // Wait 5 seconds for database connection
});

// Ensure API routes are defined before serving the React app
// Serve React app for all other routes
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});
