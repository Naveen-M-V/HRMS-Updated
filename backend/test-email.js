const { testEmailConfiguration, sendTestEmail } = require('./utils/emailService');
require('dotenv').config();

async function testEmailSetup() {
  console.log('=== EMAIL CONFIGURATION TEST ===');
  console.log('Environment variables:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'configured' : 'missing');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('');

  // Test SMTP configuration
  console.log('Testing SMTP configuration...');
  const configTest = await testEmailConfiguration();
  console.log('Config test result:', configTest);
  console.log('');

  if (configTest.success) {
    // Test sending actual email to multiple addresses
    const adminEmails = process.env.SUPER_ADMIN_EMAIL.split(',');
    
    for (let i = 0; i < Math.min(3, adminEmails.length); i++) {
      const testEmail = adminEmails[i].trim();
      console.log(`\nTesting email sending to: ${testEmail}`);
      
      const emailTest = await sendTestEmail(testEmail, `Test User ${i + 1}`);
      console.log('Email test result:', emailTest);
      
      if (emailTest.success) {
        console.log(`✅ Email sent successfully to ${testEmail}`);
        console.log(`Message ID: ${emailTest.messageId}`);
      } else {
        console.log(`❌ Failed to send email to ${testEmail}: ${emailTest.error}`);
      }
    }
    
    console.log('\n=== TROUBLESHOOTING TIPS ===');
    console.log('1. Check your SPAM/JUNK folder');
    console.log('2. Check if your email server blocks external emails');
    console.log('3. Verify the domain configuration');
    console.log('4. Try sending to a personal Gmail/Yahoo account for testing');
  }
}

testEmailSetup().catch(console.error);
