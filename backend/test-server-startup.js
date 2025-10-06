// Simple test to verify server can start without model conflicts
const mongoose = require('mongoose');
require('dotenv').config();

async function testServerStartup() {
  try {
    console.log('🔧 Testing server startup...');
    
    // Test MongoDB connection
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connection successful');
    
    // Test notification service import
    const notificationService = require('./utils/notificationService');
    console.log('✅ Notification service imported successfully');
    
    // Test email service import
    const emailService = require('./utils/emailService');
    console.log('✅ Email service imported successfully');
    
    console.log('✅ All imports successful - server should start without errors');
    
    await mongoose.disconnect();
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Server startup test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testServerStartup();
