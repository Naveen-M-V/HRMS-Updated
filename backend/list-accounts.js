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

async function listAllAccounts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n👥 ALL USER ACCOUNTS:');
    console.log('===================');
    
    const allUsers = await User.find({}).select('firstName lastName email role isActive adminApprovalStatus emailVerified createdAt').sort({ createdAt: -1 });
    
    if (allUsers.length > 0) {
      allUsers.forEach((user, index) => {
        const status = user.isActive ? '🟢 Active' : '🔴 Inactive';
        const verified = user.emailVerified ? '✅ Verified' : '❌ Unverified';
        const approval = user.role === 'admin' ? ` - ${user.adminApprovalStatus}` : '';
        const created = user.createdAt ? user.createdAt.toLocaleDateString() : 'Unknown';
        
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 ${user.email}`);
        console.log(`   🎭 ${user.role.toUpperCase()}${approval}`);
        console.log(`   ${status} | ${verified} | Created: ${created}`);
        console.log('');
      });
      
      console.log(`📊 Total accounts: ${allUsers.length}`);
      
      // Count by role
      const adminCount = allUsers.filter(u => u.role === 'admin').length;
      const userCount = allUsers.filter(u => u.role === 'user').length;
      console.log(`   👑 Admins: ${adminCount}`);
      console.log(`   👤 Users: ${userCount}`);
      
      // Check for dummy accounts
      const dummyEmails = ['admin@company.com', 'developer@company.com'];
      const dummyAccounts = allUsers.filter(u => dummyEmails.includes(u.email));
      
      if (dummyAccounts.length > 0) {
        console.log('\n⚠️  DUMMY ACCOUNTS FOUND:');
        dummyAccounts.forEach(dummy => {
          console.log(`   🗑️  ${dummy.firstName} ${dummy.lastName} (${dummy.email}) - ${dummy.role}`);
        });
      } else {
        console.log('\n✅ No dummy accounts found');
      }
      
    } else {
      console.log('❌ No user accounts found in database');
    }
    
  } catch (error) {
    console.error('❌ Error listing accounts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the listing
console.log('📋 Listing all user accounts...');
console.log('===============================\n');

listAllAccounts();
