const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Profile = require('./models/Profile');
const TimeEntry = require('./models/TimeEntry');

async function deleteTestEmployee() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('✅ Connected to MongoDB\n');

    // Find and delete the test employee
    const testEmail = 'user@localhost.com';
    
    console.log(`🔍 Looking for test employee: ${testEmail}\n`);
    
    const testUser = await User.findOne({ email: testEmail });
    
    if (!testUser) {
      console.log('✅ Test employee not found - already deleted or doesn\'t exist');
      mongoose.disconnect();
      return;
    }

    console.log(`Found test employee:`);
    console.log(`   Name: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   ID: ${testUser._id}\n`);

    console.log('🗑️  Deleting associated data...');

    // Delete time entries
    const timeEntriesDeleted = await TimeEntry.deleteMany({ employee: testUser._id });
    console.log(`   ✓ Deleted ${timeEntriesDeleted.deletedCount} time entries`);

    // Delete profile
    const profileDeleted = await Profile.deleteMany({ userId: testUser._id });
    console.log(`   ✓ Deleted ${profileDeleted.deletedCount} profile(s)`);

    // Delete user
    await User.deleteOne({ _id: testUser._id });
    console.log(`   ✓ Deleted user account`);

    console.log('\n✅ Test employee "Test Employee" removed successfully!');
    console.log('   Refresh your browser to see the updated list.\n');

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

deleteTestEmployee();
