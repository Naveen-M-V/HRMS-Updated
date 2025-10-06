// Test script to verify forgot password functionality for different user types
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Simple User schema for testing
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function testForgotPassword() {
  try {
    console.log('\n=== TESTING FORGOT PASSWORD FUNCTIONALITY ===\n');
    
    // Get sample users
    const adminUser = await User.findOne({ role: 'admin' });
    const regularUser = await User.findOne({ role: 'user' });
    
    console.log('Sample Admin User:', adminUser ? `${adminUser.email} (${adminUser.role})` : 'None found');
    console.log('Sample Regular User:', regularUser ? `${regularUser.email} (${regularUser.role})` : 'None found');
    
    // Test the forgot password logic
    const testEmails = [];
    if (adminUser) testEmails.push({ email: adminUser.email, type: 'admin' });
    if (regularUser) testEmails.push({ email: regularUser.email, type: 'user' });
    
    for (const testCase of testEmails) {
      console.log(`\n--- Testing ${testCase.type.toUpperCase()}: ${testCase.email} ---`);
      
      // Simulate forgot password logic
      const user = await User.findOne({ email: testCase.email });
      
      if (user) {
        console.log('✅ User found in database');
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive !== false ? 'Yes' : 'No'}`);
        console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
        
        // Check if user has reset token fields
        console.log(`   Has resetPasswordToken field: ${user.resetPasswordToken !== undefined ? 'Yes' : 'No'}`);
        console.log(`   Has resetPasswordExpires field: ${user.resetPasswordExpires !== undefined ? 'Yes' : 'No'}`);
        
        // Simulate secure token generation
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000);
        
        console.log(`   Generated token: ${resetToken}`);
        console.log(`   Token expires: ${resetTokenExpiry}`);
        
        // Test if we can update the user
        try {
          await User.findByIdAndUpdate(user._id, {
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetTokenExpiry
          });
          console.log('✅ Successfully updated user with reset token');
          
          // Clean up - remove the test token
          await User.findByIdAndUpdate(user._id, {
            $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
          });
          console.log('✅ Cleaned up test token');
          
        } catch (updateError) {
          console.log('❌ Failed to update user:', updateError.message);
        }
        
      } else {
        console.log('❌ User NOT found in database');
      }
    }
    
    // Test with non-existent email
    console.log('\n--- Testing NON-EXISTENT EMAIL ---');
    const nonExistentUser = await User.findOne({ email: 'nonexistent@test.com' });
    console.log(`Non-existent user found: ${nonExistentUser ? 'Yes (unexpected!)' : 'No (expected)'}`);
    
  } catch (error) {
    console.error('Error testing forgot password:', error);
  } finally {
    mongoose.connection.close();
  }
}

testForgotPassword();
