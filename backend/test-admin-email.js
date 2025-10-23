require('dotenv').config();
const { sendAdminNewUserCredentialsEmail, sendTestEmail } = require('./utils/emailService');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`)
};

async function testAdminEmailDelivery() {
  log.section('ADMIN EMAIL DELIVERY TEST');
  
  const adminEmail = 'thaya.govzig@vitruxshield.com';
  const testUserName = 'Test User';
  const testUserEmail = '12kaveen@gmail.com';
  const testPassword = 'TestPass123';
  const loginUrl = 'http://localhost:3000/login';
  
  log.info(`Testing admin email delivery to: ${adminEmail}`);
  
  try {
    // Test 1: Basic email delivery
    log.info('Test 1: Basic email delivery...');
    const basicResult = await sendTestEmail(adminEmail, 'Admin Test');
    
    if (basicResult.success) {
      log.success(`✅ Basic email sent successfully! Message ID: ${basicResult.messageId}`);
    } else {
      log.error(`❌ Basic email failed: ${basicResult.error}`);
      return;
    }
    
    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Admin credentials email
    log.info('Test 2: Admin new user credentials email...');
    const credentialsResult = await sendAdminNewUserCredentialsEmail(
      adminEmail,
      testUserName,
      testUserEmail,
      testPassword,
      loginUrl
    );
    
    if (credentialsResult.success) {
      log.success(`✅ Admin credentials email sent successfully! Message ID: ${credentialsResult.messageId}`);
    } else {
      log.error(`❌ Admin credentials email failed: ${credentialsResult.error}`);
    }
    
    log.section('TEST RESULTS');
    log.info('Email delivery test completed.');
    log.info(`Check ${adminEmail} inbox for:`)
    log.info('1. Test email with subject "HRMS Email Test - Configuration Successful"');
    log.info('2. Admin notification with subject "New User Created - Credentials"');
    
    if (basicResult.success && credentialsResult.success) {
      log.success('✅ Both emails should be delivered successfully!');
      log.info('If you\'re not seeing emails, check:');
      log.info('- Spam/Junk folder');
      log.info('- Email server processing delays');
      log.info('- Corporate email filtering rules');
    } else {
      log.error('❌ Email delivery issues detected');
      log.info('Possible causes:');
      log.info('- SMTP server domain restrictions');
      log.info('- Authentication problems');
      log.info('- Network connectivity issues');
    }
    
  } catch (error) {
    log.error(`Fatal error during email test: ${error.message}`);
    console.error(error);
  }
}

async function main() {
  try {
    log.section('HRMS ADMIN EMAIL DELIVERY DIAGNOSTIC');
    log.info('This test will send emails to thaya.govzig@vitruxshield.com');
    log.warning('Make sure this is the correct admin email address!');
    
    await testAdminEmailDelivery();
    
    log.section('DIAGNOSTIC COMPLETE');
    
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
main();
