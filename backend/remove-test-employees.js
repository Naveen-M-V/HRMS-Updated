const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Profile = require('./models/Profile');
const TimeEntry = require('./models/TimeEntry');

async function removeTestEmployees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('✅ Connected to MongoDB\n');

    // Define test/demo identifiers
    const testIdentifiers = [
      'test@', 'demo@', 'sample@', 'example@',
      'Test', 'Demo', 'Sample', 'Example',
      'test.com', 'demo.com', 'example.com'
    ];

    // Find test users
    const testUsers = await User.find({
      $or: [
        { email: { $regex: /test|demo|sample|example/i } },
        { firstName: { $regex: /test|demo|sample|example/i } },
        { lastName: { $regex: /test|demo|sample|example/i } }
      ]
    }).lean();

    if (testUsers.length === 0) {
      console.log('✅ No test/demo employees found!');
      console.log('   Your database is clean.');
      mongoose.disconnect();
      return;
    }

    console.log(`🧪 Found ${testUsers.length} test/demo employees:\n`);
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
    });

    console.log('\n⚠️  WARNING: This will permanently delete these users and their data!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

    // Wait 5 seconds before deletion
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Deleting test employees...\n');

    const testUserIds = testUsers.map(u => u._id);

    // Delete associated data
    const timeEntriesDeleted = await TimeEntry.deleteMany({ employee: { $in: testUserIds } });
    console.log(`   ✓ Deleted ${timeEntriesDeleted.deletedCount} time entries`);

    const profilesDeleted = await Profile.deleteMany({ userId: { $in: testUserIds } });
    console.log(`   ✓ Deleted ${profilesDeleted.deletedCount} profiles`);

    // Delete users
    const usersDeleted = await User.deleteMany({ _id: { $in: testUserIds } });
    console.log(`   ✓ Deleted ${usersDeleted.deletedCount} users`);

    console.log('\n✅ Test employees removed successfully!');
    console.log('   Your frontend should now show only real employees.');

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  removeTestEmployees();
}

module.exports = removeTestEmployees;
