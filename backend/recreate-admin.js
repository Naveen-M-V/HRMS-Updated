const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function recreateAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Delete the existing admin
    console.log('🗑️ Deleting existing admin...');
    const deleteResult = await User.deleteOne({ email: 'admin@talentshield.com' });
    console.log('✅ Delete result:', deleteResult);

    // Create a completely new admin
    console.log('👤 Creating fresh admin account...');
    
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔐 New hash:', hashedPassword);
    
    const newAdmin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@talentshield.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true,
      adminApprovalStatus: 'approved',
      profileId: new mongoose.Types.ObjectId()
    });
    
    const saveResult = await newAdmin.save();
    console.log('✅ Admin created:', saveResult.email);
    
    // Verify the new admin
    const verifyAdmin = await User.findOne({ email: 'admin@talentshield.com' });
    const isValid = await bcrypt.compare(password, verifyAdmin.password);
    
    console.log('🔐 Verification result:', isValid);
    console.log('🎉 Fresh admin account ready!');
    console.log('📧 Email: admin@talentshield.com');
    console.log('🔑 Password: Admin@123');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

recreateAdmin();
