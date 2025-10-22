const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('../models/User');

/**
 * Quick script to create a test user for localhost testing
 */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestUser = async () => {
  try {
    console.log('🔍 Checking for existing test user...');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'john.smith@localhost.com' });
    if (existingUser) {
      console.log('👤 Test user already exists:', existingUser.email);
      console.log('📧 Email:', existingUser.email);
      console.log('🔑 Password: password123');
      console.log('👨‍💼 Role:', existingUser.role);
      console.log('✅ Active:', existingUser.isActive);
      console.log('📧 Email Verified:', existingUser.isEmailVerified || existingUser.emailVerified);
      return existingUser;
    }

    console.log('🆕 Creating new test user...');
    
    // Create test user
    const testUser = new User({
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@localhost.com',
      password: 'password123', // Will be hashed by pre-save hook
      role: 'user',
      vtid: '1003',
      department: 'Operations',
      jobTitle: 'Blockages Specialist',
      company: 'Vitrux Ltd',
      staffType: 'Direct',
      isActive: true,
      isEmailVerified: true,
      emailVerified: true, // Some schemas use this field
      isAdminApproved: true
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: john.smith@localhost.com');
    console.log('🔑 Password: password123');
    console.log('👨‍💼 Role: user');
    
    return testUser;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
};

const createAdminUser = async () => {
  try {
    console.log('🔍 Checking for admin user...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@localhost.com' });
    if (existingAdmin) {
      console.log('👤 Admin user already exists:', existingAdmin.email);
      return existingAdmin;
    }

    console.log('🆕 Creating admin user...');
    
    // Create admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@localhost.com',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'admin',
      vtid: '0001',
      department: 'Administration',
      jobTitle: 'System Administrator',
      company: 'Vitrux Ltd',
      staffType: 'Direct',
      isActive: true,
      isEmailVerified: true,
      emailVerified: true,
      isAdminApproved: true,
      adminApprovalStatus: 'approved'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@localhost.com');
    console.log('🔑 Password: admin123');
    console.log('👨‍💼 Role: admin');
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

const main = async () => {
  try {
    console.log('🚀 Creating test users for localhost...');
    
    await connectDB();
    
    await createAdminUser();
    await createTestUser();
    
    console.log('\n✅ Test users ready!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@localhost.com / admin123');
    console.log('User:  john.smith@localhost.com / password123');
    console.log('\n🌐 Frontend: http://localhost:3000');
    console.log('🔧 Backend:  http://localhost:5003');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createTestUser, createAdminUser };
