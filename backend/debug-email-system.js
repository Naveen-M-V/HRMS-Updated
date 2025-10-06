const { 
  testEmailConfiguration, 
  sendTestEmail,
  sendNotificationEmail
} = require('./utils/emailService');
require('dotenv').config();

async function debugEmailSystem() {
  console.log('=== EMAIL SYSTEM DEBUG ===');
  console.log('Current time:', new Date().toISOString());
  console.log('');

  // 1. Check environment variables
  console.log('📧 ENVIRONMENT VARIABLES:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET');
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'NOT SET');
  console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE || 'NOT SET');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***CONFIGURED***' : 'NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || process.env.EMAIL_USER || 'NOT SET');
  console.log('SUPER_ADMIN_EMAIL:', process.env.SUPER_ADMIN_EMAIL || 'NOT SET');
  console.log('');

  // 2. Test SMTP configuration
  console.log('🔧 TESTING SMTP CONFIGURATION...');
  try {
    const configTest = await testEmailConfiguration();
    if (configTest.success) {
      console.log('✅ SMTP configuration is valid');
    } else {
      console.log('❌ SMTP configuration failed:', configTest.error);
      return;
    }
  } catch (error) {
    console.log('❌ SMTP configuration error:', error.message);
    return;
  }
  console.log('');

  // 3. Test sending emails to different addresses
  const testEmails = [
    process.env.SUPER_ADMIN_EMAIL,
    process.env.EMAIL_USER,
    'test@gmail.com' // Add a test email here
  ].filter(email => email && email.includes('@'));

  console.log('📤 TESTING EMAIL SENDING...');
  for (let i = 0; i < testEmails.length; i++) {
    const testEmail = testEmails[i].trim();
    console.log(`\n📧 Testing email to: ${testEmail}`);
    
    try {
      const result = await sendTestEmail(testEmail, `Test User ${i + 1}`);
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
    if (i < testEmails.length - 1) {
      console.log('   Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n🧪 TESTING NOTIFICATION EMAIL...');
  try {
    const notificationResult = await sendNotificationEmail(
      testEmails[0],
      'Test User',
      'Test Notification',
      'This is a test notification from the HRMS system.',
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

  console.log('\n=== TROUBLESHOOTING TIPS ===');
  console.log('1. Check your SPAM/JUNK folder');
  console.log('2. Verify email server settings (host, port, security)');
  console.log('3. Check if your email provider blocks external applications');
  console.log('4. For Gmail: Enable "Less secure app access" or use App Passwords');
  console.log('5. Check firewall settings on your server');
  console.log('6. Verify domain DNS settings if using custom domain');
  console.log('7. Check server logs for detailed error messages');
  console.log('');

  console.log('=== COMMON EMAIL CONFIGURATIONS ===');
  console.log('Gmail:');
  console.log('  HOST: smtp.gmail.com');
  console.log('  PORT: 587 (TLS) or 465 (SSL)');
  console.log('  SECURE: false (for 587) or true (for 465)');
  console.log('');
  console.log('Outlook/Hotmail:');
  console.log('  HOST: smtp-mail.outlook.com');
  console.log('  PORT: 587');
  console.log('  SECURE: false');
  console.log('');
  console.log('Yahoo:');
  console.log('  HOST: smtp.mail.yahoo.com');
  console.log('  PORT: 587 or 465');
  console.log('  SECURE: false (for 587) or true (for 465)');
}

// Run the debug
debugEmailSystem().catch(error => {
  console.error('Debug script error:', error);
  process.exit(1);
});
