const mongoose = require('mongoose');
require('dotenv').config();

// Load environment configuration
const envConfig = require('./config/environment');
const config = envConfig.getConfig();

const MONGODB_URI = config.database.uri;

// User Schema (same as in server.js)
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

const User = mongoose.model('User', userSchema);

// Profile Schema (same as in server.js)
const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true, index: true },
  firstName: { type: String, required: true, index: true },
  lastName: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  mobile: String,
  dateOfBirth: Date,
  gender: String,
  profilePicture: String,
  profilePictureData: Buffer,
  profilePictureSize: Number,
  profilePictureMimeType: String,
  role: { type: String, default: 'User' },
  staffType: { type: String, default: 'Direct' },
  company: { type: String, default: 'VitruX Ltd' },
  jobRole: [String],
  jobTitle: { type: String, default: '' },
  jobLevel: String,
  department: String,
  language: { type: String, default: 'English' },
  startDate: Date,
  vtid: { type: Number, unique: true, sparse: true, index: true },
  skillkoId: { type: Number, unique: true, index: true },
  externalSystemId: String,
  extThirdPartySystemId: String,
  nopsID: String,
  insuranceNumber: String,
  poc: String, 
  nationality: String,
  circetUIN: String,
  circetSCID: String,
  morrisonsIDNumber: String,
  morrisonsUIN: String,
  status: { type: String, default: 'Onboarding' },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },
  address: {
    line1: String,
    line2: String,
    city: String,
    postCode: String,
    country: { type: String, default: '' },
  },
  createdOn: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: true },
  mobileVerified: { type: Boolean, default: false },
  bio: String,
  otherInformation: String,
});

const Profile = mongoose.model('Profile', profileSchema);

async function cleanupDummyAccounts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const dummyEmails = ['admin@company.com', 'developer@company.com'];
    
    console.log('\n🔍 Searching for dummy accounts...');
    
    for (const email of dummyEmails) {
      console.log(`\n📧 Processing: ${email}`);
      
      // Find user account
      const user = await User.findOne({ email: email });
      if (user) {
        console.log(`   👤 Found user account: ${user.firstName} ${user.lastName} (${user.role})`);
        
        // Find associated profile
        const profile = await Profile.findOne({ email: email });
        if (profile) {
          console.log(`   📋 Found associated profile: VTID ${profile.vtid}, SkillkoID ${profile.skillkoId}`);
          
          // Delete profile first
          await Profile.deleteOne({ email: email });
          console.log(`   ✅ Deleted profile for ${email}`);
        } else {
          console.log(`   ⚠️  No associated profile found for ${email}`);
        }
        
        // Delete user account
        await User.deleteOne({ email: email });
        console.log(`   ✅ Deleted user account for ${email}`);
        
      } else {
        console.log(`   ❌ No user account found for ${email}`);
      }
    }
    
    console.log('\n📊 Final verification...');
    const remainingUsers = await User.find({ 
      email: { $in: dummyEmails } 
    });
    
    const remainingProfiles = await Profile.find({ 
      email: { $in: dummyEmails } 
    });
    
    if (remainingUsers.length === 0 && remainingProfiles.length === 0) {
      console.log('✅ All dummy accounts successfully removed!');
    } else {
      console.log('⚠️  Some accounts may still exist:');
      console.log(`   Users remaining: ${remainingUsers.length}`);
      console.log(`   Profiles remaining: ${remainingProfiles.length}`);
    }
    
    // Show current admin accounts
    console.log('\n👥 Current admin accounts:');
    const adminUsers = await User.find({ role: 'admin' }).select('firstName lastName email isActive adminApprovalStatus');
    if (adminUsers.length > 0) {
      adminUsers.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.firstName} ${admin.lastName} (${admin.email}) - ${admin.isActive ? 'Active' : 'Inactive'} - ${admin.adminApprovalStatus}`);
      });
    } else {
      console.log('   No admin accounts found');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
console.log('🧹 Starting dummy account cleanup...');
console.log('Target accounts: admin@company, developer@company');
console.log('=====================================\n');

cleanupDummyAccounts();
