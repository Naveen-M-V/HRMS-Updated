const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

/**
 * Database initialization script for new database
 * Creates super-admin accounts and essential collections
 */
const initializeNewDatabase = async () => {
  try {
    console.log('🚀 HRMS New Database Initialization - Starting...\n');
    
    // Connect to MongoDB using environment configuration
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB:', process.env.MONGODB_URI);

    // Create User Schema (matching your current schema)
    const userSchema = new mongoose.Schema({
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      username: { type: String, unique: true, sparse: true, trim: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['user', 'admin'], default: 'user' },
      vtid: { type: String, unique: true, sparse: true, uppercase: true, trim: true, index: true },
      profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', unique: true, sparse: true },
      isActive: { type: Boolean, default: true },
      emailVerified: { type: Boolean, default: false },
      verificationToken: { type: String },
      adminApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
      adminApprovalToken: { type: String },
      termsAcceptedAt: { type: Date },
      passwordChangedAt: { type: Date },
      lastLoginAt: { type: Date },
      resetPasswordToken: { type: String },
      resetPasswordExpires: { type: Date }
    }, { timestamps: true });

    // Hash password before saving
    userSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      try {
        this.password = await bcrypt.hash(this.password, 10);
        this.passwordChangedAt = Date.now();
        next();
      } catch (error) {
        next(error);
      }
    });

    const User = mongoose.model('User', userSchema);

    // Create Profile Schema (essential for user profiles)
    const profileSchema = new mongoose.Schema({
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      company: { type: String, required: true },
      jobRole: { type: String, required: true },
      jobTitle: { type: String },
      jobLevel: { type: String },
      vtid: { type: String, unique: true, sparse: true, uppercase: true, trim: true, index: true },
      skillkoId: { type: String, unique: true, sparse: true, trim: true, index: true },
      profilePicture: { type: String },
      isActive: { type: Boolean, default: true },
      createdOn: { type: Date, default: Date.now },
      updatedOn: { type: Date, default: Date.now }
    });

    const Profile = mongoose.model('Profile', profileSchema);

    // Create essential collections for system functionality
    const certificateSchema = new mongoose.Schema({
      certificate: { type: String, required: true },
      description: String,
      account: String,
      issueDate: { type: Date },
      expiryDate: { type: Date, index: true },
      profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', index: true },
      profileName: String,
      provider: String,
      fileRequired: { type: String, default: 'No' },
      active: { type: String, default: 'Yes' },
      status: { type: String, default: 'Approved', index: true },
      cost: { type: Number, default: 0 },
      category: { type: String, required: true, index: true },
      jobRole: String,
      approvalStatus: String,
      isInterim: { type: Boolean, default: false },
      timeLogged: {
        days: { type: Number, default: 0 },
        hours: { type: Number, default: 0 },
        minutes: { type: Number, default: 0 }
      },
      supplier: String,
      totalCost: { type: Number, default: 0 },
      createdOn: { type: Date, default: Date.now },
      updatedOn: { type: Date, default: Date.now }
    });

    const Certificate = mongoose.model('Certificate', certificateSchema);

    // Create Job Role Schema
    const jobRoleSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      description: String,
      isActive: { type: Boolean, default: true },
      createdOn: { type: Date, default: Date.now },
      updatedOn: { type: Date, default: Date.now }
    });

    const JobRole = mongoose.model('JobRole', jobRoleSchema);

    // Create Supplier Schema
    const supplierSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      description: String,
      createdOn: { type: Date, default: Date.now },
      updatedOn: { type: Date, default: Date.now }
    });

    const Supplier = mongoose.model('Supplier', supplierSchema);

    console.log('✅ Database schemas created');

    // Create super admin accounts with the specified credentials
    const superAdmins = [
      { email: 'dean.cumming@vitrux.co.uk', firstName: 'Dean', lastName: 'Cumming' },
      { email: 'syed.shahab.ahmed@vitrux.co.uk', firstName: 'Syed Shahab', lastName: 'Ahmed' },
      { email: 'tazeen.syeda@vitrux.co.uk', firstName: 'Tazeen', lastName: 'Syeda' },
      { email: 'thaya.govzig@vitruxshield.com', firstName: 'Thaya', lastName: 'Govzig' },
      { email: 'syed.ali.asgar@vitruxshield.com', firstName: 'Syed Ali', lastName: 'Asgar' },
      { email: 'joseph.byrne@vitrux.co.uk', firstName: 'Joseph', lastName: 'Byrne' }
    ];

    const adminPassword = '@TALeNtShieLD!?642';
    
    console.log('\n📝 Creating super admin accounts...');
    
    for (const admin of superAdmins) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: admin.email });
        if (existingUser) {
          console.log(`⚠️  User already exists: ${admin.email}`);
          continue;
        }

        // Create user account
        const newUser = new User({
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          password: adminPassword, // Will be hashed by pre-save middleware
          role: 'admin',
          isActive: true,
          emailVerified: true,
          adminApprovalStatus: 'approved',
          termsAcceptedAt: new Date()
        });

        await newUser.save();
        console.log(`✅ Created admin account: ${admin.email}`);

      } catch (error) {
        console.error(`❌ Failed to create admin account for ${admin.email}:`, error.message);
      }
    }

    // Create essential job roles for system functionality
    const essentialJobRoles = [
      'Administrator',
      'Manager', 
      'Supervisor',
      'Operator',
      'Technician',
      'Engineer',
      'Safety Officer',
      'Quality Controller',
      'Maintenance',
      'Security'
    ];

    console.log('\n📝 Creating essential job roles...');
    for (const roleName of essentialJobRoles) {
      try {
        const existingRole = await JobRole.findOne({ name: roleName });
        if (!existingRole) {
          await JobRole.create({
            name: roleName,
            description: `${roleName} role`,
            isActive: true
          });
          console.log(`✅ Created job role: ${roleName}`);
        }
      } catch (error) {
        console.log(`⚠️  Job role already exists or failed: ${roleName}`);
      }
    }

    // Create essential suppliers
    const essentialSuppliers = [
      'Internal Training',
      'External Provider',
      'Online Platform',
      'Certification Body',
      'Training Institute'
    ];

    console.log('\n📝 Creating essential suppliers...');
    for (const supplierName of essentialSuppliers) {
      try {
        const existingSupplier = await Supplier.findOne({ name: supplierName });
        if (!existingSupplier) {
          await Supplier.create({
            name: supplierName,
            description: `${supplierName} for training and certification`
          });
          console.log(`✅ Created supplier: ${supplierName}`);
        }
      } catch (error) {
        console.log(`⚠️  Supplier already exists or failed: ${supplierName}`);
      }
    }

    // Verify email configuration (optional test)
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST,
          port: Number(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          tls: { rejectUnauthorized: false }
        });

        await transporter.verify();
        console.log('✅ Email service configuration verified');
      } catch (emailError) {
        console.log('⚠️  Email service verification failed:', emailError.message);
      }
    }

    console.log('\n🎉 NEW DATABASE INITIALIZATION COMPLETE');
    console.log('🔑 Super admin accounts created with password: @TALeNtShieLD!?642');
    console.log('📧 Admin emails:');
    superAdmins.forEach(admin => console.log(`   - ${admin.email}`));
    console.log('\n✅ Database is ready for use!');

  } catch (error) {
    console.error('❌ Initialization Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the initialization
initializeNewDatabase();
