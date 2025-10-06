const mongoose = require('mongoose');
const { 
  sendNotificationEmail,
  testEmailConfiguration,
  sendTestEmail
} = require('./utils/emailService');
const {
  notifyUserCreation,
  notifyProfileUpdate,
  notifyCertificateAdded,
  getUserNotifications,
  getUnreadNotificationCount
} = require('./utils/notificationService');
require('dotenv').config();

async function traceEmailFlow() {
  console.log('=== EMAIL FLOW TRACING ===');
  console.log('Current time:', new Date().toISOString());
  console.log('');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Test basic email configuration
    console.log('\n🔧 STEP 1: Testing SMTP Configuration');
    const smtpTest = await testEmailConfiguration();
    console.log(`SMTP Test: ${smtpTest.success ? '✅ PASSED' : '❌ FAILED'}`);
    if (!smtpTest.success) {
      console.log('SMTP Error:', smtpTest.error);
      console.log('\n🚨 SMTP CONFIGURATION ISSUE DETECTED');
      console.log('Your email server settings may be incorrect:');
      console.log('- Host: mail.vitruxshield.com');
      console.log('- Port: 465 (SSL)');
      console.log('- User: thaya.govzig@vitruxshield.com');
      console.log('');
      console.log('💡 Try these troubleshooting steps:');
      console.log('1. Verify the email server is accessible: telnet mail.vitruxshield.com 465');
      console.log('2. Check if the password is correct');
      console.log('3. Try port 587 with EMAIL_SECURE=false');
      console.log('4. Contact your email provider to verify SMTP settings');
      return;
    }

    // 2. Test direct email sending
    console.log('\n📧 STEP 2: Testing Direct Email Sending');
    const testEmails = process.env.SUPER_ADMIN_EMAIL.split(',').map(e => e.trim()).slice(0, 2); // Test first 2 emails
    
    for (const email of testEmails) {
      console.log(`\nTesting email to: ${email}`);
      try {
        const result = await sendTestEmail(email, 'Test User');
        console.log(`Result: ${result.success ? '✅ SENT' : '❌ FAILED'}`);
        if (result.success) {
          console.log(`Message ID: ${result.messageId}`);
        } else {
          console.log(`Error: ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ Exception: ${error.message}`);
      }
      
      // Wait between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Test notification email
    console.log('\n🔔 STEP 3: Testing Notification Email');
    try {
      const notifResult = await sendNotificationEmail(
        testEmails[0],
        'Test Admin',
        'HRMS Notification Test',
        'This is a test notification to verify the notification email system is working.',
        'info'
      );
      console.log(`Notification Email: ${notifResult.success ? '✅ SENT' : '❌ FAILED'}`);
      if (notifResult.success) {
        console.log(`Message ID: ${notifResult.messageId}`);
      } else {
        console.log(`Error: ${notifResult.error}`);
      }
    } catch (error) {
      console.log(`❌ Notification email exception: ${error.message}`);
    }

    // 4. Check database for existing data to test with
    console.log('\n🗄️ STEP 4: Checking Database for Test Data');
    const db = mongoose.connection.db;
    
    const userCount = await db.collection('users').countDocuments();
    const profileCount = await db.collection('profiles').countDocuments();
    const certCount = await db.collection('certificates').countDocuments();
    const notifCount = await db.collection('notifications').countDocuments();
    
    console.log(`Users: ${userCount}, Profiles: ${profileCount}, Certificates: ${certCount}, Notifications: ${notifCount}`);

    if (userCount > 0 && profileCount > 0) {
      // 5. Test notification system with real data
      console.log('\n🧪 STEP 5: Testing Notification System with Real Data');
      
      const sampleUser = await db.collection('users').findOne({ role: 'user' });
      const sampleProfile = await db.collection('profiles').findOne();
      const adminUser = await db.collection('users').findOne({ role: 'admin' });
      
      if (sampleUser && sampleProfile && adminUser) {
        console.log(`Found test data - User: ${sampleUser.email}, Profile: ${sampleProfile.firstName} ${sampleProfile.lastName}`);
        
        try {
          // Test user creation notification
          console.log('\nTesting user creation notification...');
          await notifyUserCreation(sampleUser, sampleProfile, adminUser._id);
          console.log('✅ User creation notification triggered');
          
          // Check if notification was created in database
          const newNotifications = await db.collection('notifications').find({ 
            userId: sampleUser._id,
            type: 'user_created'
          }).sort({ createdOn: -1 }).limit(1).toArray();
          
          if (newNotifications.length > 0) {
            console.log('✅ Notification created in database');
            console.log(`Notification: ${newNotifications[0].message}`);
          } else {
            console.log('❌ No notification found in database');
          }
          
        } catch (error) {
          console.log(`❌ Notification system error: ${error.message}`);
        }
      } else {
        console.log('⚠️ Insufficient test data in database');
      }
    }

    // 6. Check for recent notifications
    console.log('\n📋 STEP 6: Checking Recent Notifications');
    const recentNotifications = await db.collection('notifications')
      .find({})
      .sort({ createdOn: -1 })
      .limit(5)
      .toArray();
    
    if (recentNotifications.length > 0) {
      console.log(`Found ${recentNotifications.length} recent notifications:`);
      recentNotifications.forEach((notif, index) => {
        console.log(`${index + 1}. [${notif.type}] ${notif.message} (${notif.read ? 'Read' : 'Unread'})`);
      });
    } else {
      console.log('No notifications found in database');
    }

    // 7. Summary and recommendations
    console.log('\n📊 STEP 7: Email Flow Analysis Summary');
    console.log('='.repeat(50));
    
    if (smtpTest.success) {
      console.log('✅ SMTP Configuration: Working');
      console.log('✅ Email Service: Functional');
      console.log('');
      console.log('🔍 EMAIL DELIVERY INVESTIGATION:');
      console.log('Since SMTP is working, emails are being sent. Check:');
      console.log('');
      console.log('1. 📧 RECIPIENT EMAIL BOXES:');
      console.log('   - Check SPAM/JUNK folders for ALL admin emails');
      console.log('   - Check quarantine/blocked email folders');
      console.log('   - Search for emails from: thaya.govzig@vitruxshield.com');
      console.log('');
      console.log('2. 🏢 CORPORATE EMAIL FILTERING:');
      console.log('   - Corporate emails may have strict filtering');
      console.log('   - Contact IT departments for: vitrux.co.uk, gmail.com domains');
      console.log('   - Ask them to whitelist: thaya.govzig@vitruxshield.com');
      console.log('');
      console.log('3. 🌐 DOMAIN REPUTATION:');
      console.log('   - vitruxshield.com may be a new domain');
      console.log('   - Check SPF, DKIM, DMARC records');
      console.log('   - Consider using a more established email service');
      console.log('');
      console.log('4. 📈 EMAIL VOLUME:');
      console.log('   - Sending to multiple admins simultaneously');
      console.log('   - May trigger spam filters');
      console.log('   - Consider staggered sending');
      console.log('');
      console.log('🧪 IMMEDIATE TEST:');
      console.log('Add a personal Gmail address to SUPER_ADMIN_EMAIL and test');
      console.log('If Gmail receives emails, the issue is with corporate filtering');
    } else {
      console.log('❌ SMTP Configuration: Failed');
      console.log('❌ Emails are NOT being sent');
      console.log('');
      console.log('🔧 FIX SMTP FIRST:');
      console.log('Contact your email provider (vitruxshield.com) to verify:');
      console.log('- SMTP server: mail.vitruxshield.com');
      console.log('- Port and SSL settings');
      console.log('- Username/password authentication');
    }

  } catch (error) {
    console.error('❌ Email flow trace failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the trace
traceEmailFlow().catch(error => {
  console.error('Email flow trace script error:', error);
  process.exit(1);
});
