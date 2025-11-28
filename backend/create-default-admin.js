const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function createDefaultAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@talentshield.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin admin@talentshield.com already exists');
      console.log('🔄 Resetting password...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      // Update the existing admin
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
    } else {
      console.log('👤 Creating new admin account...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      // Create new admin
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@talentshield.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        emailVerified: true,
        adminApprovalStatus: 'approved',
        profileId: new mongoose.Types.ObjectId() // Generate unique profileId
      });
      
      console.log('✅ Admin account created successfully');
    }

    console.log('\n🎉 Admin Credentials:');
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

createDefaultAdmin();
