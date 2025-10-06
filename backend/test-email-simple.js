const mongoose = require('mongoose');
require('dotenv').config();
const { 
  testEmailConfiguration, 
  sendTestEmail,
  sendLoginSuccessEmail
} = require('./utils/emailService');

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

async function validateEmailConfig() {
  log.section('EMAIL CONFIGURATION VALIDATION');
  
  // Check environment variables
  log.info('Checking environment variables...');
  
  const requiredVars = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_PORT'];
  const optionalVars = ['EMAIL_FROM', 'EMAIL_SECURE'];
  
  let configValid = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log.success(`${varName}: ${varName === 'EMAIL_PASS' ? '***' : process.env[varName]}`);
    } else {
      log.error(`${varName}: NOT SET`);
      configValid = false;
    }
  });
  
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      log.info(`${varName}: ${process.env[varName]}`);
    } else {
      log.warning(`${varName}: NOT SET (using default)`);
    }
  });
  
  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const emailUser = process.env.EMAIL_USER;
  
  if (emailFrom !== emailUser && process.env.EMAIL_FROM) {
    log.warning(`EMAIL_FROM (${emailFrom}) differs from EMAIL_USER (${emailUser})`);
  }
  
  if (!configValid) {
    log.error('Missing required email configuration variables!');
    return false;
  }
  
  // Test SMTP connection
  log.info('\nTesting SMTP connection...');
  const smtpTest = await testEmailConfiguration();
  
  if (smtpTest.success) {
    log.success('SMTP connection successful');
    return true;
  } else {
    log.error(`SMTP connection failed: ${smtpTest.error}`);
    return false;
  }
}

async function testBasicEmail() {
  log.section('BASIC EMAIL TEST');
  
  const testEmail = 'mvnaveen18@gmail.com'; // Your email
  
  try {
    log.info(`Sending test email to: ${testEmail}`);
    const result = await sendTestEmail(testEmail, 'Test User');
    
    if (result.success) {
      log.success(`Test email sent successfully! Message ID: ${result.messageId}`);
      return { status: 'success', messageId: result.messageId };
    } else {
      log.error(`Failed to send test email: ${result.error}`);
      return { status: 'error', error: result.error };
    }
  } catch (error) {
    log.error(`Error sending test email: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function testLoginEmail() {
  log.section('LOGIN SUCCESS EMAIL TEST');
  
  const testEmail = 'mvnaveen18@gmail.com'; // Your email
  const userName = 'Test User';
  const loginTime = new Date().toLocaleString();
  const ipAddress = '127.0.0.1';
  
  try {
    log.info(`Sending login success email to: ${testEmail}`);
    const result = await sendLoginSuccessEmail(testEmail, userName, loginTime, ipAddress);
    
    if (result.success) {
      log.success(`Login success email sent successfully! Message ID: ${result.messageId}`);
      return { status: 'success', messageId: result.messageId };
    } else {
      log.error(`Failed to send login success email: ${result.error}`);
      return { status: 'error', error: result.error };
    }
  } catch (error) {
    log.error(`Error sending login success email: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function main() {
  try {
    log.section('HRMS EMAIL DIAGNOSTIC TOOL');
    
    // Validate email configuration
    const configValid = await validateEmailConfig();
    
    if (!configValid) {
      log.error('Email configuration is invalid. Cannot proceed with tests.');
      process.exit(1);
    }
    
    // Test basic email
    const basicTest = await testBasicEmail();
    
    // Test login email
    const loginTest = await testLoginEmail();
    
    // Summary
    log.section('SUMMARY');
    
    if (basicTest.status === 'success') {
      log.success('✅ Basic email functionality: WORKING');
    } else {
      log.error('❌ Basic email functionality: FAILED');
      log.error(`   Error: ${basicTest.error}`);
    }
    
    if (loginTest.status === 'success') {
      log.success('✅ Login email functionality: WORKING');
    } else {
      log.error('❌ Login email functionality: FAILED');
      log.error(`   Error: ${loginTest.error}`);
    }
    
    if (basicTest.status === 'success' && loginTest.status === 'success') {
      log.section('DIAGNOSIS');
      log.success('Email system is working correctly!');
      log.info('If you\'re not receiving emails in your application:');
      log.info('1. Check that email functions are being called in your routes');
      log.info('2. Check server logs for any email-related errors');
      log.info('3. Verify that the email address is correct');
      log.info('4. Check your spam/junk folder');
    } else {
      log.section('TROUBLESHOOTING');
      log.error('Email system has issues. Common fixes:');
      log.info('1. Verify SMTP credentials are correct');
      log.info('2. Check if your email provider allows SMTP access');
      log.info('3. Verify firewall/network settings');
      log.info('4. Check if 2FA is enabled (may need app password)');
    }
    
    log.success('Diagnostic completed');
    
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the diagnostic
main();
