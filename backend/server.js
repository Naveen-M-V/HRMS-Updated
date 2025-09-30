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

// Session middleware configuration
app.use(session({
  secret: process.env.SESSION_SECRET || JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    touchAfter: 24 * 3600, // Lazy session update
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'native'
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

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:5003']
    : process.env.CORS_ORIGINS?.split(',') || ['https://talentshield.co.uk'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  firstName: { type: String, required: true, index: true },
  lastName: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  mobile: String,
  dateOfBirth: Date,
  gender: String,
  profilePicture: String,
  profilePictureData: Buffer, // Store profile picture data in database
  profilePictureSize: Number, // Store file size in bytes
  profilePictureMimeType: String, // Store file MIME type
  
  // Job Details
  role: { type: String, default: 'User' },
  staffType: { type: String, default: 'Direct' },
  company: { type: String, default: 'VitruX Ltd' },
  jobRole: [String], // Array of job roles to support multiple selections
  jobTitle: [String], // Array of job titles to support multiple selections
  jobLevel: String,
  language: { type: String, default: 'English' },
  startDate: Date,
  
  // System IDs
  vtid: { type: Number, unique: true, sparse: true, index: true }, // VTID field
  skillkoId: { type: Number, unique: true, index: true },
  externalSystemId: String,
  extThirdPartySystemId: String,
  nopsId: String,
  nopsID: String, 
  insuranceNumber: String,
  
  // Additional Employee Details
  poc: String, 
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

// Auto-generate VTID as sequential number from 1000-9000
profileSchema.pre('save', async function(next) {
  if (!this.vtid) {
    // Find the highest existing VTID
    const lastProfile = await this.constructor.findOne({ vtid: { $exists: true } })
      .sort({ vtid: -1 })
      .select('vtid')
      .lean();
    
    let newVtid = 1000; // Start from 1000
    
    if (lastProfile && lastProfile.vtid) {
      newVtid = lastProfile.vtid + 1;
    }
    
    // Ensure we don't exceed 9000
    if (newVtid > 9000) {
      throw new Error('VTID limit exceeded. Maximum VTID is 9000.');
    }
    
    this.vtid = newVtid;
  }
  next();
});

// Auto-generate skillkoId as random 4-digit number
profileSchema.pre('save', async function(next) {
  if (!this.skillkoId) {
    let newId;
    let isUnique = false;
    
    // Generate random 4-digit number until we find a unique one
    while (!isUnique) {
      newId = Math.floor(Math.random() * 9000) + 1000; // Generates 1000-9999
      const existingProfile = await this.constructor.findOne({ skillkoId: newId });
      if (!existingProfile) {
        isUnique = true;
      }
    }
    
    this.skillkoId = newId;
   }
  next();
});

// Add compound indexes for better query performance
profileSchema.index({ firstName: 1, lastName: 1, email: 1 });
profileSchema.index({ company: 1, createdOn: -1 });
profileSchema.index({ skillkoId: 1, vtid: 1, vtrxId: 1 });

const Profile = mongoose.model('Profile', profileSchema);

// User Schema for Authentication
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  adminApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  adminApprovalToken: { type: String },
  termsAcceptedAt: { type: Date }
}, { timestamps: true });

// Add method to create default admin if none exists
userSchema.statics.ensureAdminExists = async function() {
  try {
    const adminCount = await this.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      // Create default admin account
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await this.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@talentshield.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        emailVerified: true,
        adminApprovalStatus: 'approved'
      });
      console.log('Default admin account created');
    }
  } catch (error) {
    console.error('Error ensuring admin exists:', error);
  }
};

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
  category: { type: String, required: true }, 
  jobRole: String, 
  approvalStatus: String,
  isInterim: { type: String, default: 'False' }, 
  timeLogged: {
    days: { type: String, default: '0' },
    hours: { type: String, default: '0' },
    minutes: { type: String, default: '0' }
  },
  supplier: String,
  totalCost: String,
  
  // File storage fields - store in database
  certificateFile: String, // Store original filename
  fileData: Buffer, // Store actual file data in database
  fileSize: Number, // Store file size in bytes
  mimeType: String, // Store file MIME type
  
  archived: { type: String, default: 'Unarchived' },
  createdOn: { type: Date, default: Date.now, index: true },
  updatedOn: { type: Date, default: Date.now }
});

const Certificate = mongoose.model('Certificate', certificateSchema);

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now }
});

const Supplier = mongoose.model('Supplier', supplierSchema);

// Job Role Schema
const jobRoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now }
});

const JobRole = mongoose.model('JobRole', jobRoleSchema);

// Job Title Schema
const jobTitleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now }
});

const JobTitle = mongoose.model('JobTitle', jobTitleSchema);

// Job Level Schema
const jobLevelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdOn: { type: Date, default: Date.now },
  usageCount: { type: Number, default: 1 }
});

const JobLevel = mongoose.model('JobLevel', jobLevelSchema);

// Certificate Name Schema
const certificateNameSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdOn: { type: Date, default: Date.now },
  usageCount: { type: Number, default: 1 }
});

const CertificateName = mongoose.model('CertificateName', certificateNameSchema);

// Multer configuration for file uploads with 10MB limit
const storage = multer.memoryStorage(); // Store in memory for database storage

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF files for certificates and images for profile pictures
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, PNG files are allowed'), false);
    }
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

// Get all profiles (optimized - excludes large binary data)
app.get('/api/profiles', async (req, res) => {
  try {
    // Exclude large binary fields to optimize performance
    const profiles = await Profile.find()
      .select('-profilePictureData -profilePictureSize -profilePictureMimeType') // Exclude binary data
      .sort({ createdOn: -1 })
      .lean(); // Returns plain JavaScript objects instead of Mongoose documents
    
    console.log(`Fetched ${profiles.length} profiles (optimized)`);
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all profiles with complete data (for admin/bulk operations)
app.get('/api/profiles/complete', async (req, res) => {
  try {
    // Return all profile fields including binary data (use sparingly)
    const profiles = await Profile.find()
      .sort({ createdOn: -1 })
      .lean();
    
    console.log(`Fetched ${profiles.length} profiles (complete data)`);
    res.json(profiles);
  } catch (error) {
    console.error('Error fetching complete profiles:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get profiles with pagination (for large datasets)
app.get('/api/profiles/paginated', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const profiles = await Profile.find()
      .select('-profilePictureData -profilePictureSize -profilePictureMimeType')
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Profile.countDocuments();
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      profiles,
      pagination: {
        currentPage: page,
        totalPages,
        totalProfiles: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching paginated profiles:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get profile by ID (optimized - excludes binary data)
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .select('-profilePictureData -profilePictureSize -profilePictureMimeType')
      .lean();
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify email endpoint
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Missing token');

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(400).send('Invalid or expired token');
    }

    const user = await User.findOne({ email: payload.email, verificationToken: token });
    if (!user) return res.status(404).send('User not found');

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Get frontend URL for redirect
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // If user is admin, redirect to dashboard after verification
    if (user.role === 'admin') {
      // Create session for the verified admin
      req.session.user = {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };
      
      // Redirect to admin dashboard
      return res.redirect(`${frontendUrl}/dashboard?verified=true`);
    } else {
      // For regular users, redirect to login with success message
      return res.redirect(`${frontendUrl}/login?verified=true`);
    }
  } catch (error) {
    console.error('Verify email error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=verification_failed`);
  }
});

// Approve admin endpoint (accessed via email link by super admin)
app.get('/api/auth/approve-admin', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Missing token');

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(400).send('Invalid or expired token');
    }

    const user = await User.findOne({ email: payload.email, adminApprovalToken: token });
    if (!user) return res.status(404).send('User not found');

    if (user.role !== 'admin') return res.status(400).send('User is not an admin');

    user.adminApprovalStatus = 'approved';
    user.adminApprovalToken = undefined;
    user.emailVerified = true; // Auto-verify email when admin is approved
    await user.save();

    res.send('Admin account approved successfully.');
  } catch (error) {
    console.error('Approve admin error:', error);
    res.status(500).send('Server error');
  }
});

// Get profile by ID with complete data (including binary data)
app.get('/api/profiles/:id/complete', async (req, res) => {
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
    
    // Create user account for the profile
    try {
      // Check if user account already exists
      const existingUser = await User.findOne({ email: savedProfile.email });
      
      if (!existingUser) {
        // Create new user account with VTID as password
        const vtid = savedProfile.vtid || Math.floor(1000 + Math.random() * 8000); // Generate VTID if not exists
        
        // Update profile with VTID if it wasn't set
        if (!savedProfile.vtid) {
          savedProfile.vtid = vtid;
          await savedProfile.save();
        }
        
        // Create user account
        const newUser = new User({
          firstName: savedProfile.firstName,
          lastName: savedProfile.lastName,
          email: savedProfile.email,
          password: vtid.toString(), // Store VTID as plain text for user accounts
          role: 'user',
          isActive: true,
          emailVerified: true, // Auto-verify user accounts created by admin
          createdBy: 'admin',
          profileId: savedProfile._id
        });
        
        await newUser.save();
        console.log('User account created for profile:', savedProfile.email);
        
        // Send credentials email to user
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const loginUrl = `${frontendUrl}/login`;
        const userName = `${savedProfile.firstName} ${savedProfile.lastName}`;
        
        await sendUserCredentialsEmail(savedProfile.email, userName, vtid, loginUrl);
        console.log('Credentials email sent to:', savedProfile.email);
      }
    } catch (userCreationError) {
      console.error('Error creating user account:', userCreationError);
      // Don't fail the profile creation if user account creation fails
    }
    
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
    console.log('Profile picture upload endpoint called');
    console.log('Profile ID:', req.params.id);
    console.log('File received:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    console.log('Request headers:', req.headers);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Check file size (10MB limit)
    if (req.file.size > 10 * 1024 * 1024) {
      console.log('File size exceeds limit:', req.file.size);
      return res.status(400).json({ message: 'File size exceeds 10MB limit' });
    }
    
    console.log('File validation passed, updating profile...');
    
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { 
        profilePicture: `/api/profiles/${req.params.id}/picture`,
        profilePictureData: req.file.buffer,
        profilePictureSize: req.file.size,
        profilePictureMimeType: req.file.mimetype
      },
      { new: true }
    );
    
    if (!profile) {
      console.log('Profile not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    console.log('Profile picture uploaded successfully');
    res.json({ profilePicture: profile.profilePicture });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: error.message });
  }
});

// Serve profile picture from database
app.get('/api/profiles/:id/picture', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    if (!profile.profilePictureData) {
      return res.status(404).json({ message: 'No profile picture found for this profile' });
    }
    
    res.set({
      'Content-Type': profile.profilePictureMimeType || 'image/jpeg',
      'Content-Length': profile.profilePictureSize,
      'Content-Disposition': `inline; filename="profile-${profile._id}.jpg"`,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    res.send(profile.profilePictureData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get profile statistics (certificates count, etc.)
app.get('/api/profiles/:id/stats', async (req, res) => {
  try {
    const profileId = req.params.id;
    
    // Count certificates associated with this profile
    const certificateCount = await Certificate.countDocuments({ profileId: profileId });
    
    // Get profile basic info
    const profile = await Profile.findById(profileId, 'firstName lastName email');
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json({
      profile: {
        id: profile._id,
        name: `${profile.firstName} ${profile.lastName}`,
        email: profile.email
      },
      certificates: {
        total: certificateCount
      }
    });
  } catch (error) {
    console.error('Error getting profile stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test endpoint to verify API is working
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Delete profile
app.delete('/api/profiles/:id', async (req, res) => {
  try {
    console.log('Delete profile endpoint called with ID:', req.params.id);
    console.log('Request headers:', req.headers);
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({ message: 'Invalid profile ID format' });
    }
    
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      console.log('Profile not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    console.log('Profile found:', profile.firstName, profile.lastName);

    // Delete all certificates associated with this profile
    const deletedCertificates = await Certificate.deleteMany({ profileId: req.params.id });
    console.log(`Deleted ${deletedCertificates.deletedCount} certificates for profile ${req.params.id}`);

    // Find and delete the associated user account (if exists)
    // Users are created with email matching the profile email
    const associatedUser = await User.findOne({ 
      email: profile.email, 
      role: 'user',
      createdBy: 'admin' 
    });
    
    if (associatedUser) {
      await User.findByIdAndDelete(associatedUser._id);
      console.log(`Deleted associated user account ${associatedUser._id} for profile ${profile.email}`);
    }

    // Delete the profile
    await Profile.findByIdAndDelete(req.params.id);
    console.log(`Deleted profile ${req.params.id}`);
    
    // Create notifications for admins
    try {
      const adminUsers = await User.find({ role: 'admin' });
      for (const adminUser of adminUsers) {
        // Notification for profile deletion
        const profileNotification = new Notification({
          userId: adminUser._id,
          type: 'profile_deleted',
          priority: 'medium',
          message: `Profile deleted: ${profile.firstName} ${profile.lastName}`,
          read: false
        });
        await profileNotification.save();

        // Notification for certificate deletion (if any)
        if (deletedCertificates.deletedCount > 0) {
          const certNotification = new Notification({
            userId: adminUser._id,
            type: 'certificate_deleted',
            priority: 'medium',
            message: `${deletedCertificates.deletedCount} certificate(s) deleted with profile: ${profile.firstName} ${profile.lastName}`,
            read: false
          });
          await certNotification.save();
        }
      }
    } catch (notificationError) {
      console.error('Error creating delete notifications:', notificationError);
    }
    
    console.log('Profile deletion completed successfully');
    res.json({ 
      message: 'Profile and associated data deleted successfully',
      details: {
        profileDeleted: true,
        certificatesDeleted: deletedCertificates.deletedCount,
        userAccountDeleted: !!associatedUser
      }
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
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
    
    // Handle file upload if present - store in database
    if (req.file) {
      // Check file size (10MB limit already enforced by multer)
      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: 'File size exceeds 10MB limit' });
      }
      
      certificateData.certificateFile = req.file.originalname;
      certificateData.fileData = req.file.buffer; // Store file data in database
      certificateData.fileSize = req.file.size;
      certificateData.mimeType = req.file.mimetype;
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
    
    // If file is uploaded, store in database
    if (req.file) {
      // Check file size (10MB limit already enforced by multer)
      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: 'File size exceeds 10MB limit' });
      }
      
      updateData.certificateFile = req.file.originalname;
      updateData.fileData = req.file.buffer; // Store file data in database
      updateData.fileSize = req.file.size;
      updateData.mimeType = req.file.mimetype;
      console.log('File uploaded successfully:', req.file.originalname);
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

// Serve certificate file from database
app.get('/api/certificates/:id/file', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    if (!certificate.fileData) {
      return res.status(404).json({ message: 'No file found for this certificate' });
    }
    
    // Set appropriate headers
    res.set({
      'Content-Type': certificate.mimeType || 'application/octet-stream',
      'Content-Length': certificate.fileSize,
      'Content-Disposition': `inline; filename="${certificate.certificateFile}"`,
      'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
    });
    
    res.send(certificate.fileData);
  } catch (error) {
    console.error('Error serving certificate file:', error);
    res.status(500).json({ message: error.message });
  }
});

// Serve certificate file for viewing (not downloading)
app.get('/api/certificates/:id/file', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (!certificate.fileData || !certificate.mimeType) {
      return res.status(404).json({ message: 'Certificate file not found' });
    }

    // Set headers for inline viewing (not download)
    res.setHeader('Content-Type', certificate.mimeType);
    res.setHeader('Content-Disposition', 'inline'); // This makes it view instead of download
    res.setHeader('Content-Length', certificate.fileSize || certificate.fileData.length);
    
    // Send the file data
    res.send(certificate.fileData);
  } catch (error) {
    console.error('Error serving certificate file:', error);
    res.status(500).json({ message: 'Error serving certificate file' });
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
      // Return more suppliers when no search query (increased from 10 to 50)
      const suppliers = await Supplier.find().sort({ usageCount: -1, name: 1 }).limit(50);
      return res.json(suppliers);
    }
    
    // Return all matching suppliers (no limit for search results)
    const suppliers = await Supplier.find({
      name: { $regex: q, $options: 'i' }
    }).sort({ usageCount: -1, name: 1 });
    
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Job Title Routes

// Get all job titles
app.get('/api/job-titles', async (req, res) => {
  try {
    const jobTitles = await JobTitle.find({ isActive: true }).sort({ name: 1 });
    res.json(jobTitles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search job titles
app.get('/api/job-titles/search', async (req, res) => {
  try {
    const { q } = req.query;
    const jobTitles = await JobTitle.find({
      name: { $regex: q, $options: 'i' },
      isActive: true
    }).sort({ name: 1 }).limit(10);
    res.json(jobTitles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new job title
app.post('/api/job-titles', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Job title name is required' });
    }
    
    const trimmedName = name.trim();
    
    // Check if job title already exists
    let jobTitle = await JobTitle.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    
    if (jobTitle) {
      return res.json(jobTitle);
    }
    
    // Create new job title
    jobTitle = new JobTitle({
      name: trimmedName,
      description: description?.trim(),
      createdBy: req.user?.userId
    });
    await jobTitle.save();
    
    res.status(201).json(jobTitle);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Job title already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Job Level Routes

// Get all job levels
app.get('/api/job-levels', async (req, res) => {
  try {
    const jobLevels = await JobLevel.find().sort({ usageCount: -1, name: 1 });
    res.json(jobLevels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or get job level
app.post('/api/job-levels', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Job level name is required' });
    }
    
    const trimmedName = name.trim();
    
    // Check if job level already exists
    let jobLevel = await JobLevel.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    
    if (jobLevel) {
      // Increment usage count
      jobLevel.usageCount += 1;
      await jobLevel.save();
    } else {
      // Create new job level
      jobLevel = new JobLevel({
        name: trimmedName,
        createdBy: req.user?.userId,
        usageCount: 1
      });
      await jobLevel.save();
    }
    
    res.json(jobLevel);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Job level already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Search job levels
app.get('/api/job-levels/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      // Return more job levels when no search query (increased from 10 to 50)
      const jobLevels = await JobLevel.find().sort({ usageCount: -1, name: 1 }).limit(50);
      return res.json(jobLevels);
    }
    
    // Return all matching job levels (no limit for search results)
    const jobLevels = await JobLevel.find({
      name: { $regex: q, $options: 'i' }
    }).sort({ usageCount: -1, name: 1 });
    
    res.json(jobLevels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Certificate Name Routes

// Get all certificate names
app.get('/api/certificate-names', async (req, res) => {
  try {
    const certificateNames = await CertificateName.find().sort({ usageCount: -1, name: 1 });
    res.json(certificateNames);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or get certificate name
app.post('/api/certificate-names', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Certificate name is required' });
    }
    
    const trimmedName = name.trim();
    
    // Check if certificate name already exists
    let certificateName = await CertificateName.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    
    if (certificateName) {
      // Increment usage count
      certificateName.usageCount += 1;
      await certificateName.save();
    } else {
      // Create new certificate name
      certificateName = new CertificateName({
        name: trimmedName,
        createdBy: req.user?.userId,
        usageCount: 1
      });
      await certificateName.save();
    }
    
    res.json(certificateName);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Certificate name already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Search certificate names
app.get('/api/certificate-names/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      // Return all certificate names when no search query
      const certificateNames = await CertificateName.find().sort({ usageCount: -1, name: 1 });
      return res.json(certificateNames);
    }
    
    // Return all matching certificate names (no limit)
    const certificateNames = await CertificateName.find({
      name: { $regex: q, $options: 'i' }
    }).sort({ usageCount: -1, name: 1 });
    
    res.json(certificateNames);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Initialize predefined certificate names
app.post('/api/certificate-names/initialize', async (req, res) => {
  try {
    const predefinedCertificates = [
      'SA006', 'SA001', 'SA001A', 'SA009', 'SA051C', 'IPAF 1B', 'SA020', 'A16', 'SA020A', 'SA007',
      'SA021', 'A14', 'GO1', 'EUSR Category 3', 'EUSR Category 4', 'EUSR Category 5',
      'Level 2 Award Excavation support systems', 'MOCOPA', 'Emergency first Aid', 'SA018',
      'NRSWA Card Certificate S1', 'NRSWA Certificate LA', 'NRSWA Certificate O2', 'NRSWA Certificate O3',
      'NRSWA Certificate O4', 'NRSWA Certificate O5', 'NRSWA Certificate O6', 'NRSWA Certificate O7',
      'NRSWA Certificate O8', 'SA051C or Equivalent', 'K008', 'SA005', 'SA003', 'K009', 'N020', 'J005',
      'SA008', 'SA024', 'S017', 'M022', 'M006', 'N10', 'N039', 'SA023 or Equivalent', 'K003', 'K004',
      'O008', '1a', '3a', '3b or Equivalent', 'Q035(SEC1)', 'Q036(SLEW1)', 'Q037(SLEW2)', 'Q038(SLEW3)',
      'Certificate O6', 'Certificate O7', 'Certificate O5', 'N025', 'F016', 'F022', 'SA004', 'N024',
      'H004', 'J008', 'F017', 'G005', 'N030', 'N006', 'G39', 'UKATA', 'SA026 or Equivalent', 'S013',
      'S018', 'K006', 'N033', 'N023', 'N026', 'N034', 'N028', 'N027', 'S011', 'M023', 'S012', 'M029',
      'N029', 'N038', 'N022', 'N043', 'N011', 'N037', 'N036', 'N041', 'N035', 'O002', 'O003', 'O004',
      'O005', 'O006', 'E001', 'F020', 'O009', 'Q020(DB1)', 'Q013(BB1M)', 'Q012(BB1C)', 'Q014(BB2C)',
      'Q015(BB3C)', 'Q011(BB1B)', 'Q029(MH1)', 'Q031', 'Q021(DL1)', 'Q019(CD1)', 'Q022(DL2)', 'Q023(DL3)',
      'Q030(MP1)', 'Q028(ME1)', 'Q025(FCFW1)', 'Q024(FCCW1)', 'Q016(CB2)', 'Q017(CB3)', 'Q018(CCC1)',
      'Q039', 'N005', 'H001', 'N031(ODF)', 'N004(OCR)', 'J010(OFF)', 'J010(OFR)', 'C004', 'F005',
      'F023', 'K010', 'C&G Part 1,2 & 3', '18th edition', 'C&G 2391 - 51', 'Ace Telecoms Battery installation course', 'A350'
    ];

    let addedCount = 0;
    for (const certName of predefinedCertificates) {
      const existing = await CertificateName.findOne({ name: { $regex: new RegExp(`^${certName}$`, 'i') } });
      if (!existing) {
        await new CertificateName({ name: certName, usageCount: 1 }).save();
        addedCount++;
      }
    }

    res.json({ message: `Initialized ${addedCount} new certificate names`, total: predefinedCertificates.length });
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

// Get profile by email (for user login)
app.get('/api/profiles/by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const profile = await Profile.findOne({ email });
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile by email:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/certificates/delete-request', async (req, res) => {
  try {
    const { certificateId, certificateName, userEmail, userName, profileId } = req.body;
    
    // Get admin email from environment or use default
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@talentshield.com';
    
    // Create email content
    const subject = `Certificate Deletion Request - ${certificateName}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Certificate Deletion Request</h2>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Request Details</h3>
          <p><strong>User:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Certificate:</strong> ${certificateName}</p>
          <p><strong>Certificate ID:</strong> ${certificateId}</p>
          <p><strong>Profile ID:</strong> ${profileId}</p>
          <p><strong>Request Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0;"><strong>Action Required:</strong> Please review this deletion request and take appropriate action in the admin panel.</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification from the HRMS system.<br>
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
    
    // Send email to admin
    await sendNotificationEmail(adminEmail, subject, htmlContent);
    
    res.json({ message: 'Delete request sent successfully' });
  } catch (error) {
    console.error('Error sending delete request email:', error);
    res.status(500).json({ message: 'Failed to send delete request' });
  }
});

// Authentication Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'user', termsAccepted = false, requireEmailVerification = true } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Prepare user document
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      isActive: true,
      termsAcceptedAt: termsAccepted ? new Date() : undefined,
      emailVerified: !requireEmailVerification
    });

    if (requireEmailVerification) {
      user.verificationToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '48h' });
    }

    if (role === 'admin') {
      user.adminApprovalStatus = 'pending';
      user.adminApprovalToken = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    }

    await user.save();

    // Send verification email if required
    try {
      if (requireEmailVerification && user.verificationToken) {
        const baseUrl = process.env.API_PUBLIC_URL || process.env.BACKEND_URL || `https://talentshield.co.uk`;
        const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(user.verificationToken)}`;
        const name = `${user.firstName} ${user.lastName}`.trim();
        await sendVerificationEmail(user.email, verifyUrl, name);
      }
    } catch (e) {
      console.error('Failed to send verification email:', e);
    }

    // If admin role, send approval request to super admin
    try {
      if (role === 'admin' && user.adminApprovalToken) {
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
        if (superAdminEmail) {
          const baseUrl = process.env.API_PUBLIC_URL || process.env.BACKEND_URL || `http://localhost:${PORT}`;
          const approveUrl = `${baseUrl}/api/auth/approve-admin?token=${encodeURIComponent(user.adminApprovalToken)}`;
          const name = `${user.firstName} ${user.lastName}`.trim();
          await sendAdminApprovalRequestEmail(superAdminEmail, name, user.email, approveUrl);
        } else {
          console.warn('SUPER_ADMIN_EMAIL not configured; cannot send admin approval email');
        }
      }
    } catch (e) {
      console.error('Failed to send admin approval email:', e);
    }

    res.status(201).json({ 
      message: 'User created successfully',
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
const { sendLoginSuccessEmail, sendCertificateExpiryEmail, sendNotificationEmail, testEmailConfiguration, sendVerificationEmail, sendAdminApprovalRequestEmail, sendUserCredentialsEmail } = require('./utils/emailService');
const { startCertificateMonitoring, triggerCertificateCheck } = require('./utils/certificateMonitor');

// Import notification routes
const notificationRoutes = require('./routes/notifications');
const bulkJobRolesRoutes = require('./routes/bulkJobRoles');
const jobRolesRoutes = require('./routes/jobRoles');
const jobLevelsRoutes = require('./routes/jobLevels');

// Use notification routes (moved after authenticateSession definition)
// This will be added later after the middleware is defined

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // First check admin accounts
    const admin = await User.findOne({ email: email });
    if (admin) {
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Create session data for admin
      const sessionUser = {
        userId: admin._id,
        email: admin.email,
        role: 'admin',
        firstName: admin.firstName,
        lastName: admin.lastName
      };

      // Generate JWT token for admin
      const token = jwt.sign(sessionUser, JWT_SECRET, { expiresIn: rememberMe ? '30d' : '24h' });

      // Store admin in session
      req.session.user = sessionUser;
      return res.json({ user: sessionUser, token });
    }

    // Then check user accounts
    const profile = await Profile.findOne({ email: email });
    if (profile) {
      if (password !== profile.password) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      if (!profile.isActive) {
        return res.status(400).json({ message: 'User account is deactivated' });
      }

      // Create session data for user
      const sessionUser = {
        userId: profile._id,
        email: profile.email,
        role: 'user',
        firstName: profile.firstName,
        lastName: profile.lastName,
        profileId: profile._id,
        vtid: profile.vtid
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
      const token = jwt.sign(sessionUser, JWT_SECRET, { expiresIn: rememberMe ? '30d' : '24h' });
      
      // Send response with both session and token
      res.json({
        user: sessionUser,
        token
      });

      // Send login success email notification
      try {
        const loginTime = new Date().toLocaleString();
        const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
        const userName = `${profile.firstName} ${profile.lastName}`;
        
        await sendLoginSuccessEmail(profile.email, userName, loginTime, ipAddress);
      } catch (emailError) {
        console.error('Failed to send login success email:', emailError);
        // Don't fail the login if email fails
      }

      return res.json({
        success: true,
        message: 'Login successful',
        user: sessionUser,
        token: token,
        redirectTo: '/user-dashboard'
      });
    }

    // If not found in Profile collection, check User collection (admin accounts)
    const user = await User.findOne({ $or: [ { email: email }, { username: email } ] });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Enforce email verification for all users (including admins)
    if (!user.emailVerified) {
      return res.status(403).json({ 
        message: 'Email not verified. Please check your email and click the verification link to continue.',
        requiresVerification: true
      });
    }

    // Enforce admin approval only in production
    if (process.env.NODE_ENV === 'production' && user.role === 'admin' && user.adminApprovalStatus !== 'approved') {
      return res.status(403).json({ message: 'Admin account pending approval by super admin.' });
    }

    // Verify password for admin accounts (hashed)
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
      success: true,
      message: 'Login successful',
      token, // Keep for backward compatibility
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      redirectTo: '/dashboard'
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
const authenticateSession = async (req, res, next) => {
  try {
    // First check session
    if (req.session && req.session.user) {
      req.user = req.session.user;
      return next();
    }

    // Then check JWT token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = await jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      // Update session with token data
      req.session.user = decoded;
      return next();
    } catch (tokenError) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

// Legacy JWT middleware for backward compatibility
const authenticateToken = authenticateSession;

// Use notification routes (now that authenticateSession is defined)
app.use('/api/notifications', authenticateSession, notificationRoutes);

// Get current user's profile (for My Settings page)
app.get('/api/my-profile', authenticateSession, async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // For admin users, get from User collection
    if (req.user.role === 'admin') {
      const user = await User.findOne({ email: req.user.email })
        .select('-password -__v') // Exclude sensitive fields
        .lean();
      
      if (!user) {
        return res.status(404).json({ message: 'Admin profile not found' });
      }

      // Try to merge with Profile collection details if available
      let profileExtras = {};
      try {
        const prof = await Profile.findOne({ email: req.user.email })
          .select('-profilePictureData -profilePictureSize -profilePictureMimeType -__v')
          .lean();
        if (prof) {
          profileExtras = {
            mobile: prof.mobile,
            bio: prof.bio,
            jobTitle: prof.jobTitle,
            department: prof.department,
            company: prof.company,
            staffType: prof.staffType,
            dateOfBirth: prof.dateOfBirth,
            nationality: prof.nationality,
            gender: prof.gender,
            location: prof.location,
            address: prof.address,
            emergencyContact: prof.emergencyContact,
            profilePicture: prof.profilePicture
          };
        }
      } catch (mergeErr) {
        console.warn('Admin merge with Profile failed:', mergeErr?.message || mergeErr);
      }

      // Include additional admin-specific data if needed
      const adminData = {
        ...user,
        ...profileExtras,
        isAdmin: true,
        permissions: ['all']
      };
      
      return res.json(adminData);
    } else {
      // For regular users, get from Profile collection
      const profile = await Profile.findOne({ email: req.user.email })
        .select('-profilePictureData -profilePictureSize -profilePictureMimeType') // Exclude binary data
        .lean();
      
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      
      res.json(profile);
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update admin profile details (persist in Profile collection)
app.put('/api/admin/update-profile', authenticateSession, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const {
      firstName,
      lastName,
      email,
      mobile,
      bio,
      jobTitle,
      department,
      company,
      staffType,
      dateOfBirth,
      nationality,
      gender,
      location,
      address,
      emergencyContact
    } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'First name, last name, and email are required' });
    }

    // Upsert into Profile collection keyed by admin email
    const update = {
      firstName,
      lastName,
      email,
      mobile: mobile ?? '',
      bio: bio ?? '',
      jobTitle: jobTitle ?? '',
      department: department ?? '',
      company: company ?? '',
      staffType: staffType ?? 'Admin',
      nationality: nationality ?? '',
      gender: gender ?? '',
      location: location ?? '',
      address: address ?? {},
      emergencyContact: emergencyContact ?? {},
      updatedAt: new Date()
    };
    if (dateOfBirth) {
      update.dateOfBirth = new Date(dateOfBirth);
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { email },
      update,
      { new: true, upsert: true }
    );

    return res.json({ success: true, message: 'Admin profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return res.status(500).json({ message: 'Failed to update admin profile', error: error.message });
  }
});

// Create new user endpoint (Admin only)
app.post('/api/users/create', authenticateSession, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { firstName, lastName, email, vtid } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'First name, last name, and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if user already exists
    const existingProfile = await Profile.findOne({ email });
    if (existingProfile) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate a secure password (minimum 6 characters)
    const generatedPassword = generateSimplePassword(8);

    // Create new profile
    const newProfile = new Profile({
      firstName,
      lastName,
      email,
      vtid: vtid || `VT${Date.now()}`, // Generate VTID if not provided
      password: generatedPassword, // Store plain text password for user login
      role: 'user',
      isActive: true,
      emailVerified: true, // Auto-verify email for admin-created users
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user.email // Track who created the user
    });

    // Save the profile
    const savedProfile = await newProfile.save();

    // Send credentials email
    const loginUrl = `${process.env.FRONTEND_URL || 'https://talentshield.co.uk'}/login`;
    const userName = `${firstName} ${lastName}`;
    
    try {
      await sendUserCredentialsEmail(email, userName, generatedPassword, loginUrl);
      console.log(`Credentials email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send credentials email:', emailError);
      // Don't fail the user creation if email fails
    }

    // Return success response (without password for security)
    res.status(201).json({
      success: true,
      message: 'User created successfully and credentials sent via email',
      user: {
        id: savedProfile._id,
        firstName: savedProfile.firstName,
        lastName: savedProfile.lastName,
        email: savedProfile.email,
        vtid: savedProfile.vtid,
        role: savedProfile.role,
        isActive: savedProfile.isActive,
        createdAt: savedProfile.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      message: 'Failed to create user', 
      error: error.message 
    });
  }
});
app.use('/api', bulkJobRolesRoutes);
app.use('/api/job-roles', jobRolesRoutes);
app.use('/api/job-levels', jobLevelsRoutes);

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
