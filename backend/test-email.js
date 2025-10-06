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
    // Test sending actual email
    console.log('Testing email sending...');
    const testEmail = process.env.SUPER_ADMIN_EMAIL.split(',')[0]; // Use first super admin email
    console.log('Sending test email to:', testEmail);
    
    const emailTest = await sendTestEmail(testEmail, 'Test User');
    console.log('Email test result:', emailTest);
  }
}

testEmailSetup().catch(console.error);
