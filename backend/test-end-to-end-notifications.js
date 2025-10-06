const mongoose = require('mongoose');
require('dotenv').config();

async function testEndToEndNotifications() {
  console.log('=== END-TO-END NOTIFICATION TEST ===');
  console.log('Current time:', new Date().toISOString());
  console.log('');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // 1. Check current state
    console.log('\n📊 CURRENT DATABASE STATE:');
    const userCount = await db.collection('users').countDocuments();
    const profileCount = await db.collection('profiles').countDocuments();
    const certCount = await db.collection('certificates').countDocuments();
    const notifCount = await db.collection('notifications').countDocuments();
    
    console.log(`Users: ${userCount}`);
    console.log(`Profiles: ${profileCount}`);
    console.log(`Certificates: ${certCount}`);
    console.log(`Notifications: ${notifCount}`);

    // 2. Check for expiring certificates
    console.log('\n📜 CERTIFICATE EXPIRY CHECK:');
    const now = new Date();
    const certificates = await db.collection('certificates').find({}).toArray();
    
    let expiringCerts = [];
    let expiredCerts = [];
    
    certificates.forEach(cert => {
      if (cert.expiryDate) {
        const expiryDate = new Date(cert.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          expiringCerts.push({ ...cert, daysUntilExpiry });
        } else if (daysUntilExpiry <= 0) {
          expiredCerts.push({ ...cert, daysExpired: Math.abs(daysUntilExpiry) });
        }
      }
    });
    
    console.log(`Certificates expiring in 30 days: ${expiringCerts.length}`);
    console.log(`Expired certificates: ${expiredCerts.length}`);
    
    if (expiringCerts.length > 0) {
      console.log('\nExpiring certificates:');
      expiringCerts.slice(0, 3).forEach(cert => {
        console.log(`- ${cert.certificate} (${cert.daysUntilExpiry} days) - Profile: ${cert.profileName}`);
      });
    }
    
    if (expiredCerts.length > 0) {
      console.log('\nExpired certificates:');
      expiredCerts.slice(0, 3).forEach(cert => {
        console.log(`- ${cert.certificate} (expired ${cert.daysExpired} days ago) - Profile: ${cert.profileName}`);
      });
    }

    // 3. Check recent notifications
    console.log('\n🔔 RECENT NOTIFICATIONS:');
    const recentNotifications = await db.collection('notifications')
      .find({})
      .sort({ createdOn: -1 })
      .limit(10)
      .toArray();
    
    if (recentNotifications.length > 0) {
      console.log(`Found ${recentNotifications.length} recent notifications:`);
      recentNotifications.forEach((notif, index) => {
        const createdDate = new Date(notif.createdOn).toLocaleDateString();
        console.log(`${index + 1}. [${notif.type}] ${notif.message} (${createdDate}) - ${notif.read ? 'Read' : 'Unread'}`);
      });
    } else {
      console.log('No notifications found in database');
    }

    // 4. Check notification types
    console.log('\n📋 NOTIFICATION TYPES ANALYSIS:');
    const notificationTypes = await db.collection('notifications').aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    if (notificationTypes.length > 0) {
      console.log('Notification types in database:');
      notificationTypes.forEach(type => {
        console.log(`- ${type._id}: ${type.count} notifications`);
      });
    }

    // 5. Check user-notification relationships
    console.log('\n👤 USER-NOTIFICATION RELATIONSHIPS:');
    const users = await db.collection('users').find({}).toArray();
    
    for (const user of users.slice(0, 3)) { // Check first 3 users
      const userNotifications = await db.collection('notifications')
        .countDocuments({ userId: user._id });
      const unreadNotifications = await db.collection('notifications')
        .countDocuments({ userId: user._id, read: false });
      
      console.log(`${user.email} (${user.role}): ${userNotifications} total, ${unreadNotifications} unread`);
    }

    // 6. Test notification API endpoints (simulate)
    console.log('\n🔌 API ENDPOINT SIMULATION:');
    console.log('Testing notification service functions...');
    
    try {
      const { getUserNotifications, getUnreadNotificationCount } = require('./utils/notificationService');
      
      if (users.length > 0) {
        const testUser = users[0];
        const userNotifs = await getUserNotifications(testUser._id, { limit: 5 });
        const unreadCount = await getUnreadNotificationCount(testUser._id);
        
        console.log(`✅ getUserNotifications: Retrieved ${userNotifs.length} notifications`);
        console.log(`✅ getUnreadNotificationCount: ${unreadCount} unread notifications`);
      }
    } catch (serviceError) {
      console.log(`❌ Notification service error: ${serviceError.message}`);
    }

    // 7. Email configuration check
    console.log('\n📧 EMAIL CONFIGURATION CHECK:');
    console.log('SMTP Settings:');
    console.log(`- Host: ${process.env.EMAIL_HOST}`);
    console.log(`- Port: ${process.env.EMAIL_PORT}`);
    console.log(`- Secure: ${process.env.EMAIL_SECURE}`);
    console.log(`- User: ${process.env.EMAIL_USER}`);
    console.log(`- From: ${process.env.EMAIL_FROM}`);
    
    const adminEmails = process.env.SUPER_ADMIN_EMAIL.split(',').map(e => e.trim());
    console.log(`- Admin emails (${adminEmails.length}): ${adminEmails.join(', ')}`);

    // 8. Summary and recommendations
    console.log('\n📊 SYSTEM ANALYSIS SUMMARY:');
    console.log('='.repeat(50));
    
    if (expiringCerts.length > 0 || expiredCerts.length > 0) {
      console.log('🚨 CERTIFICATE ALERTS SHOULD BE ACTIVE:');
      console.log(`- ${expiringCerts.length} certificates expiring soon`);
      console.log(`- ${expiredCerts.length} certificates already expired`);
      console.log('- These should trigger email notifications to admins');
    } else {
      console.log('✅ No certificate expiry alerts needed at this time');
    }
    
    if (recentNotifications.length > 0) {
      console.log('✅ Notification system is creating notifications in database');
    } else {
      console.log('⚠️ No notifications found - system may not be triggering properly');
    }
    
    console.log('\n🔍 EMAIL DELIVERY INVESTIGATION:');
    console.log('Since you\'re not receiving emails, the issue is likely:');
    console.log('');
    console.log('1. 📧 EMAIL FILTERING:');
    console.log('   - Corporate email servers blocking vitruxshield.com');
    console.log('   - Emails going to SPAM/JUNK folders');
    console.log('   - Domain reputation issues');
    console.log('');
    console.log('2. 🔧 SMTP ISSUES:');
    console.log('   - Authentication problems with mail.vitruxshield.com');
    console.log('   - Port/SSL configuration issues');
    console.log('   - Rate limiting or sending restrictions');
    console.log('');
    console.log('3. 🧪 RECOMMENDED TESTS:');
    console.log('   - Run: node comprehensive-email-debug.js');
    console.log('   - Add a personal Gmail to SUPER_ADMIN_EMAIL for testing');
    console.log('   - Check mail server logs on vitruxshield.com');
    console.log('   - Contact email provider for delivery reports');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the test
testEndToEndNotifications().catch(error => {
  console.error('End-to-end test script error:', error);
  process.exit(1);
});
