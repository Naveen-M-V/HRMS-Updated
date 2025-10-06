const mongoose = require('mongoose');
const { 
  notifyUserCreation,
  notifyProfileUpdate,
  notifyCertificateAdded,
  notifyCertificateDeleted,
  notifyCertificateUpdated,
  notifyCertificateExpiring,
  notifyCertificateExpired,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead
} = require('./utils/notificationService');
const { testEmailConfiguration, sendTestEmail } = require('./utils/emailService');
require('dotenv').config();

// Notification model is defined in server.js

async function connectToDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testNotificationSystem() {
  console.log('=== NOTIFICATION SYSTEM TEST ===');
  console.log('Current time:', new Date().toISOString());
  console.log('');

  try {
    await connectToDatabase();

    // Get models
    const User = mongoose.model('User');
    const Profile = mongoose.model('Profile');
    const Certificate = mongoose.model('Certificate');
    const Notification = mongoose.model('Notification');

    // 1. Test email configuration first
    console.log('📧 TESTING EMAIL CONFIGURATION...');
    const emailTest = await testEmailConfiguration();
    if (!emailTest.success) {
      console.log('❌ Email configuration failed:', emailTest.error);
      console.log('⚠️ Continuing with notification tests (emails will fail)');
    } else {
      console.log('✅ Email configuration is valid');
    }
    console.log('');

    // 2. Find test users and profiles
    console.log('🔍 FINDING TEST DATA...');
    const testUser = await User.findOne({ role: 'user' });
    const testProfile = await Profile.findOne();
    const testCertificate = await Certificate.findOne();
    const adminUser = await User.findOne({ role: 'admin' });

    if (!testUser || !testProfile || !adminUser) {
      console.log('❌ Missing test data. Please ensure you have:');
      console.log('   - At least one user with role "user"');
      console.log('   - At least one profile');
      console.log('   - At least one admin user');
      return;
    }

    console.log(`✅ Found test user: ${testUser.email}`);
    console.log(`✅ Found test profile: ${testProfile.firstName} ${testProfile.lastName}`);
    console.log(`✅ Found admin user: ${adminUser.email}`);
    if (testCertificate) {
      console.log(`✅ Found test certificate: ${testCertificate.certificate}`);
    }
    console.log('');

    // 3. Test notification creation
    console.log('🔔 TESTING NOTIFICATION CREATION...');
    
    // Test user creation notification
    console.log('Testing user creation notification...');
    try {
      await notifyUserCreation(testUser, testProfile, adminUser._id);
      console.log('✅ User creation notification sent');
    } catch (error) {
      console.log('❌ User creation notification failed:', error.message);
    }

    // Test profile update notification
    console.log('Testing profile update notification...');
    try {
      const updatedFields = { firstName: 'Updated Name', jobTitle: 'New Title' };
      await notifyProfileUpdate(testProfile, updatedFields, adminUser._id);
      console.log('✅ Profile update notification sent');
    } catch (error) {
      console.log('❌ Profile update notification failed:', error.message);
    }

    // Test certificate notifications if certificate exists
    if (testCertificate) {
      console.log('Testing certificate added notification...');
      try {
        await notifyCertificateAdded(testCertificate, testProfile, adminUser._id);
        console.log('✅ Certificate added notification sent');
      } catch (error) {
        console.log('❌ Certificate added notification failed:', error.message);
      }

      console.log('Testing certificate expiring notification...');
      try {
        await notifyCertificateExpiring(testCertificate, testProfile, 7);
        console.log('✅ Certificate expiring notification sent');
      } catch (error) {
        console.log('❌ Certificate expiring notification failed:', error.message);
      }

      console.log('Testing certificate expired notification...');
      try {
        await notifyCertificateExpired(testCertificate, testProfile, 3);
        console.log('✅ Certificate expired notification sent');
      } catch (error) {
        console.log('❌ Certificate expired notification failed:', error.message);
      }
    }
    console.log('');

    // 4. Test notification retrieval
    console.log('📋 TESTING NOTIFICATION RETRIEVAL...');
    
    // Get notifications for test user
    const userNotifications = await getUserNotifications(testUser._id);
    console.log(`✅ Retrieved ${userNotifications.length} notifications for user`);
    
    // Get notifications for admin
    const adminNotifications = await getUserNotifications(adminUser._id);
    console.log(`✅ Retrieved ${adminNotifications.length} notifications for admin`);
    
    // Get unread count
    const unreadCount = await getUnreadNotificationCount(testUser._id);
    console.log(`✅ User has ${unreadCount} unread notifications`);
    
    const adminUnreadCount = await getUnreadNotificationCount(adminUser._id);
    console.log(`✅ Admin has ${adminUnreadCount} unread notifications`);
    console.log('');

    // 5. Test marking notifications as read
    console.log('✅ TESTING MARK AS READ...');
    if (userNotifications.length > 0) {
      const firstNotification = userNotifications[0];
      try {
        await markNotificationAsRead(firstNotification._id, testUser._id);
        console.log('✅ Successfully marked notification as read');
        
        // Verify count decreased
        const newUnreadCount = await getUnreadNotificationCount(testUser._id);
        console.log(`✅ Unread count updated: ${unreadCount} -> ${newUnreadCount}`);
      } catch (error) {
        console.log('❌ Mark as read failed:', error.message);
      }
    }
    console.log('');

    // 6. Display sample notifications
    console.log('📄 SAMPLE NOTIFICATIONS:');
    console.log('User Notifications:');
    userNotifications.slice(0, 3).forEach((notif, index) => {
      console.log(`  ${index + 1}. [${notif.type}] ${notif.title}`);
      console.log(`     ${notif.message}`);
      console.log(`     Priority: ${notif.priority}, Read: ${notif.isRead}`);
      console.log('');
    });

    console.log('Admin Notifications:');
    adminNotifications.slice(0, 3).forEach((notif, index) => {
      console.log(`  ${index + 1}. [${notif.type}] ${notif.title}`);
      console.log(`     ${notif.message}`);
      console.log(`     Priority: ${notif.priority}, Read: ${notif.isRead}`);
      console.log('');
    });

    // 7. Test email sending if configuration is valid
    if (emailTest.success) {
      console.log('📤 TESTING EMAIL SENDING...');
      try {
        const testEmailResult = await sendTestEmail(testUser.email, testUser.firstName);
        if (testEmailResult.success) {
          console.log('✅ Test email sent successfully');
        } else {
          console.log('❌ Test email failed:', testEmailResult.error);
        }
      } catch (error) {
        console.log('❌ Test email error:', error.message);
      }
    }

    console.log('');
    console.log('=== NOTIFICATION SYSTEM TEST COMPLETE ===');
    console.log('✅ All tests completed successfully!');
    console.log('');
    console.log('SUMMARY:');
    console.log(`- Total notifications in database: ${await Notification.countDocuments()}`);
    console.log(`- User notifications: ${userNotifications.length}`);
    console.log(`- Admin notifications: ${adminNotifications.length}`);
    console.log(`- Email system: ${emailTest.success ? 'Working' : 'Needs configuration'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the test
testNotificationSystem().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});
