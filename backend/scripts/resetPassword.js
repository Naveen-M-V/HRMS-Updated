const mongoose = require('mongoose');
const EmployeeHub = require('../models/EmployeesHub');
const User = require('../models/User');
require('dotenv').config();

const resetPassword = async (email, newPassword) => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const normalizedEmail = email.toLowerCase();

    // Try to find in EmployeeHub first
    let employee = await EmployeeHub.findOne({ email: normalizedEmail });
    
    if (employee) {
      employee.password = newPassword; // Pre-save hook will hash it
      await employee.save();
      console.log(`✅ Password reset successfully for employee: ${employee.firstName} ${employee.lastName}`);
      console.log(`   Email: ${employee.email}`);
      console.log(`   Role: ${employee.role}`);
      console.log(`   New Password: ${newPassword}`);
      console.log('\n✅ You can now login with this email and password');
      return;
    }

    // Try to find in User model
    let user = await User.findOne({ email: normalizedEmail });
    
    if (user) {
      user.password = newPassword; // Pre-save hook will hash it
      await user.save();
      console.log(`✅ Password reset successfully for user: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   New Password: ${newPassword}`);
      console.log('\n✅ You can now login with this email and password');
      return;
    }

    console.log(`❌ No account found with email: ${email}`);
    console.log('Please check the email address and try again.');

  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node resetPassword.js <email> <newpassword>');
  console.log('Example: node resetPassword.js john.doe@example.com NewPass123!');
  process.exit(1);
}

const [email, newPassword] = args;

if (newPassword.length < 6) {
  console.log('❌ Password must be at least 6 characters long');
  process.exit(1);
}

resetPassword(email, newPassword);
