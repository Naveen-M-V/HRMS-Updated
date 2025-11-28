const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function resetAdminPassword() {
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
      isActive: admin.isActive
    });

    // Hash the new password
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
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

    console.log('✅ Admin password reset successfully');
    console.log('📧 Email: admin@talentshield.com');
    console.log('🔑 Password: Admin@123');
    console.log('\n🚀 You can now login with these credentials!');

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

resetAdminPassword();
