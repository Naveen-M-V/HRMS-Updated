const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * User Schema for Authentication
 * Handles user accounts, authentication, and basic profile information
 */
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'user'], 
    default: 'user' 
  },
  userType: {
    type: String,
    enum: ['profile', 'employee'],
    default: 'profile',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeesHub',
    default: null
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    default: null
  },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  verificationToken: String,
  adminApprovalToken: String,
  isAdminApproved: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  department: String,
  vtid: String,
  jobTitle: String,
  company: String,
  staffType: String
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Add method to create default admin if none exists
userSchema.statics.ensureAdminExists = async function() {
  try {
    const adminCount = await this.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('No admin found, creating default admin...');
      
      const defaultAdmin = new this({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@localhost.com',
        password: 'admin123', // This will be hashed by the pre-save hook
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        isAdminApproved: true
      });
      
      await defaultAdmin.save();
      console.log('✅ Default admin created successfully');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Remove existing model if it exists (for development)
if (mongoose.models.User) {
  delete mongoose.models.User;
}

module.exports = mongoose.model('User', userSchema);
