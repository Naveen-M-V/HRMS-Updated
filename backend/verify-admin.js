const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function verifyAndFixAdmin() {
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

    console.log('👤 Found admin user:', {
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      hasPassword: !!admin.password,
      passwordLength: admin.password?.length
    });

    // Test password comparison
    const testPassword = 'Admin@123';
    console.log('\n🔍 Testing password comparison...');
    
    let isValid = false;
    try {
      isValid = await bcrypt.compare(testPassword, admin.password);
      console.log('✅ Password comparison result:', isValid);
    } catch (error) {
      console.log('❌ Password comparison error:', error.message);
    }

    if (!isValid) {
      console.log('🔄 Resetting password...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      console.log('🔐 New password hash length:', hashedPassword.length);
      
      // Update the password
      await User.updateOne(
        { email: 'admin@talentshield.com' },
        { 
          password: hashedPassword,
          isActive: true,
          emailVerified: true,
          adminApprovalStatus: 'approved'
        }
      );
      
      console.log('✅ Password reset successfully');
      
      // Test again
      const updatedAdmin = await User.findOne({ email: 'admin@talentshield.com' });
      const newIsValid = await bcrypt.compare(testPassword, updatedAdmin.password);
      console.log('✅ New password comparison result:', newIsValid);
    }

    console.log('\n🎉 Admin Credentials:');
    console.log('📧 Email: admin@talentshield.com');
    console.log('🔑 Password: Admin@123');
    console.log('\n🚀 Try login again!');

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

verifyAndFixAdmin();
