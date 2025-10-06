const { 
  testEmailConfiguration, 
  sendTestEmail,
  sendNotificationEmail
} = require('./utils/emailService');
require('dotenv').config();

async function debugProductionEmail() {
  console.log('=== PRODUCTION EMAIL DEBUG ===');
  console.log('Current time:', new Date().toISOString());
  console.log('');

  // 1. Check environment variables
  console.log('📧 ENVIRONMENT VARIABLES:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('SUPER_ADMIN_EMAIL:', process.env.SUPER_ADMIN_EMAIL);
  console.log('MOCK_EMAIL_SENDING:', process.env.MOCK_EMAIL_SENDING || 'NOT SET');
  console.log('');

  // 2. Test SMTP configuration
  console.log('🔧 TESTING SMTP CONFIGURATION...');
  try {
    const configTest = await testEmailConfiguration();
    if (configTest.success) {
      console.log('✅ SMTP configuration is valid');
    } else {
      console.log('❌ SMTP configuration failed:', configTest.error);
      console.log('');
      console.log('🔍 TROUBLESHOOTING SMTP:');
      console.log('1. Check if mail.vitruxshield.com is accessible');
      console.log('2. Verify port 465 is open and SSL is properly configured');
      console.log('3. Test credentials: thaya.govzig@vitruxshield.com');
      console.log('4. Check if server requires specific authentication method');
      console.log('');
      return;
    }
  } catch (error) {
    console.log('❌ SMTP configuration error:', error.message);
    return;
  }

  // 3. Test sending to each admin email
  const adminEmails = process.env.SUPER_ADMIN_EMAIL.split(',').map(email => email.trim());
  console.log('');
  console.log('📤 TESTING EMAIL SENDING TO ADMIN ADDRESSES...');
  console.log(`Found ${adminEmails.length} admin emails`);
  
  for (let i = 0; i < adminEmails.length; i++) {
    const testEmail = adminEmails[i];
    console.log(`\n📧 Testing email ${i + 1}/${adminEmails.length}: ${testEmail}`);
    
    try {
      const result = await sendTestEmail(testEmail, `Admin User ${i + 1}`);
      if (result.success) {
        console.log(`✅ Email sent successfully!`);
        console.log(`   Message ID: ${result.messageId}`);
      } else {
        console.log(`❌ Email failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Email error: ${error.message}`);
    }
    
    // Wait 2 seconds between emails to avoid rate limiting
    if (i < adminEmails.length - 1) {
      console.log('   Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 4. Test notification email
  console.log('\n🧪 TESTING NOTIFICATION EMAIL...');
  try {
    const notificationResult = await sendNotificationEmail(
      adminEmails[0], // Send to first admin
      'Test Admin',
      'HRMS Email System Test',
      'This is a test notification from the HRMS system to verify email delivery is working correctly.\n\nIf you receive this email, the notification system is functioning properly.',
      'info'
    );
    
    if (notificationResult.success) {
      console.log('✅ Notification email sent successfully!');
      console.log(`   Message ID: ${notificationResult.messageId}`);
    } else {
      console.log('❌ Notification email failed:', notificationResult.error);
    }
  } catch (error) {
    console.log('❌ Notification email error:', error.message);
  }

  // 5. Check for common email delivery issues
  console.log('\n🔍 EMAIL DELIVERY CHECKLIST:');
  console.log('✅ SMTP Configuration: Tested above');
  console.log('✅ Multiple Admin Emails: Tested above');
  console.log('');
  console.log('📋 THINGS TO CHECK MANUALLY:');
  console.log('1. Check SPAM/JUNK folders for all admin email addresses');
  console.log('2. Check if vitruxshield.com domain has proper SPF/DKIM records');
  console.log('3. Verify mail server logs on mail.vitruxshield.com');
  console.log('4. Check if recipient email servers are blocking emails');
  console.log('5. Test with a personal Gmail/Yahoo account to isolate issues');
  console.log('');
  console.log('🚨 COMMON ISSUES:');
  console.log('- Corporate email servers may have strict filtering');
  console.log('- Missing SPF/DKIM records can cause emails to be marked as spam');
  console.log('- Some email providers block emails from new domains');
  console.log('- Rate limiting on the SMTP server');
  console.log('');
  console.log('💡 IMMEDIATE ACTIONS:');
  console.log('1. Add a personal Gmail address to SUPER_ADMIN_EMAIL for testing');
  console.log('2. Check mail server logs for delivery attempts');
  console.log('3. Contact your email provider about delivery issues');
}

// Run the debug
debugProductionEmail().catch(error => {
  console.error('Debug script error:', error);
  process.exit(1);
});
