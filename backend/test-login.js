const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function testLoginDirectly() {
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

    console.log('👤 Testing login directly...');
    
    // Test the exact same login process as the backend
    const loginIdentifier = 'admin@talentshield.com';
    const password = 'Admin@123';
    
    // Simulate the backend login logic
    const user = await User.findOne({ 
      $or: [
        { email: { $regex: new RegExp(`^${loginIdentifier}$`, 'i') } },
        { username: { $regex: new RegExp(`^${loginIdentifier}$`, 'i') } },
        { vtid: { $regex: new RegExp(`^${loginIdentifier}$`, 'i') } }
      ]
    });
    
    if (user) {
      console.log('✅ User found:', user.email);
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔐 Password valid:', isValidPassword);
      
      if (isValidPassword) {
        console.log('🎉 LOGIN SHOULD WORK!');
      } else {
        console.log('❌ Password still invalid');
        
        // Try one more hash
        console.log('🔄 Creating fresh password hash...');
        const freshHash = await bcrypt.hash(password, 10);
        await User.updateOne(
          { email: 'admin@talentshield.com' },
          { password: freshHash }
        );
        
        // Test again
        const testUser = await User.findOne({ email: 'admin@talentshield.com' });
        const freshValid = await bcrypt.compare(password, testUser.password);
        console.log('🔐 Fresh password test:', freshValid);
      }
    } else {
      console.log('❌ User not found in direct test');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

testLoginDirectly();
