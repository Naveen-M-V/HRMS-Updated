// Test script to check user accounts in database
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import models
const User = require('./server').User || mongoose.model('User');
const Profile = require('./server').Profile || mongoose.model('Profile');

async function checkUserAccounts() {
  try {
    console.log('\n=== CHECKING USER ACCOUNTS ===\n');
    
    // Get all users
    const allUsers = await User.find({}).select('email role firstName lastName vtid');
    console.log(`Total users in User collection: ${allUsers.length}`);
    
    // Separate by role
    const adminUsers = allUsers.filter(u => u.role === 'admin');
    const regularUsers = allUsers.filter(u => u.role === 'user');
    
    console.log(`Admin users: ${adminUsers.length}`);
    console.log(`Regular users: ${regularUsers.length}`);
    
    console.log('\n--- Admin Users ---');
    adminUsers.forEach(user => {
      console.log(`${user.email} | ${user.firstName} ${user.lastName} | VTID: ${user.vtid || 'N/A'}`);
    });
    
    console.log('\n--- Regular Users ---');
    regularUsers.forEach(user => {
      console.log(`${user.email} | ${user.firstName} ${user.lastName} | VTID: ${user.vtid || 'N/A'}`);
    });
    
    // Check profiles without user accounts
    const allProfiles = await Profile.find({}).select('email firstName lastName vtid');
    console.log(`\nTotal profiles: ${allProfiles.length}`);
    
    const profilesWithoutUsers = [];
    for (const profile of allProfiles) {
      const userExists = await User.findOne({ email: profile.email });
      if (!userExists) {
        profilesWithoutUsers.push(profile);
      }
    }
    
    console.log(`\nProfiles WITHOUT user accounts: ${profilesWithoutUsers.length}`);
    if (profilesWithoutUsers.length > 0) {
      console.log('--- Profiles Missing User Accounts ---');
      profilesWithoutUsers.forEach(profile => {
        console.log(`${profile.email} | ${profile.firstName} ${profile.lastName} | VTID: ${profile.vtid || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking user accounts:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUserAccounts();
