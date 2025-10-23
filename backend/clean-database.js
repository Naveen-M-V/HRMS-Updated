const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';

async function cleanDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Current database contents:');
    
    // Get database collections directly
    const db = mongoose.connection.db;
    
    // Show current counts
    const profileCount = await db.collection('profiles').countDocuments();
    const certificateCount = await db.collection('certificates').countDocuments();
    const userCount = await db.collection('users').countDocuments();
    const notificationCount = await db.collection('notifications').countDocuments();
    const certNameCount = await db.collection('certificatenames').countDocuments();
    
    console.log(`- Profiles: ${profileCount}`);
    console.log(`- Certificates: ${certificateCount}`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Notifications: ${notificationCount}`);
    console.log(`- Certificate Names: ${certNameCount}`);

    if (profileCount === 0 && certificateCount === 0 && userCount === 0) {
      console.log('\n✅ Database is already clean!');
      process.exit(0);
    }

    console.log('\n🧹 Cleaning database...');
    
    // Delete all data (keeping admin users if any)
    console.log('🗑️  Deleting all certificates...');
    const deletedCerts = await db.collection('certificates').deleteMany({});
    console.log(`   ✅ Deleted ${deletedCerts.deletedCount} certificates`);
    
    console.log('🗑️  Deleting all profiles...');
    const deletedProfiles = await db.collection('profiles').deleteMany({});
    console.log(`   ✅ Deleted ${deletedProfiles.deletedCount} profiles`);
    
    console.log('🗑️  Deleting regular users (keeping admins)...');
    const deletedUsers = await db.collection('users').deleteMany({ role: { $ne: 'admin' } });
    console.log(`   ✅ Deleted ${deletedUsers.deletedCount} regular users`);
    
    console.log('🗑️  Deleting all notifications...');
    const deletedNotifications = await db.collection('notifications').deleteMany({});
    console.log(`   ✅ Deleted ${deletedNotifications.deletedCount} notifications`);
    
    console.log('🗑️  Resetting certificate names usage counts...');
    await db.collection('certificatenames').updateMany({}, { $set: { usageCount: 0 } });
    console.log('   ✅ Reset certificate name usage counts');

    console.log('\n📊 Final database state:');
    const finalProfileCount = await db.collection('profiles').countDocuments();
    const finalCertificateCount = await db.collection('certificates').countDocuments();
    const finalUserCount = await db.collection('users').countDocuments();
    const finalNotificationCount = await db.collection('notifications').countDocuments();
    const adminCount = await db.collection('users').countDocuments({ role: 'admin' });
    
    console.log(`- Profiles: ${finalProfileCount}`);
    console.log(`- Certificates: ${finalCertificateCount}`);
    console.log(`- Users: ${finalUserCount} (${adminCount} admins preserved)`);
    console.log(`- Notifications: ${finalNotificationCount}`);

    console.log('\n✅ Database cleaned successfully!');
    console.log('🚀 Ready for fresh testing with email notifications');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
cleanDatabase();
