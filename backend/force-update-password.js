const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function forceUpdatePassword() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the admin user
    const admin = await User.findOne({ email: 'admin@talentshield.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('👤 Found admin user, updating password...');
    
    // Create a fresh hash
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔐 New hash:', hashedPassword);
    
    // Update the password directly
    const result = await User.updateOne(
      { email: 'admin@talentshield.com' },
      { 
        password: hashedPassword,
        isActive: true,
        emailVerified: true,
        adminApprovalStatus: 'approved'
      }
    );
    
    console.log('✅ Update result:', result);
    
    // Verify the update
    const updatedAdmin = await User.findOne({ email: 'admin@talentshield.com' });
    const isValid = await bcrypt.compare(password, updatedAdmin.password);
    
    console.log('🔐 Verification result:', isValid);
    console.log('🎉 Password should now work!');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

forceUpdatePassword();
