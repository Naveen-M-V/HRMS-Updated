const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function listAllUsers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('email role isActive emailVerified adminApprovalStatus').lean();
    
    console.log(`📊 Found ${users.length} users:\n`);
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
        console.log(`   Email Verified: ${user.emailVerified ? '✅' : '❌'}`);
        console.log(`   Admin Approval: ${user.adminApprovalStatus || 'N/A'}`);
        console.log('');
      });
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

listAllUsers();
