const mongoose = require('mongoose');
require('dotenv').config();
const { 
  testEmailConfiguration, 
  sendTestEmail 
} = require('./utils/emailService');
const {
  notifyUserCreation,
  notifyProfileUpdate,
  notifyCertificateAdded,
  notifyCertificateUpdated,
  notifyCertificateDeleted,
  notifyCertificateExpiring,
  notifyCertificateExpired
} = require('./utils/notificationService');

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

async function testUserCreation() {
  log.section('TEST 1: USER CREATION EMAIL');
  
  try {
    const User = mongoose.model('User');
    const Profile = mongoose.model('Profile');
    
    // Find a test user or create mock data
    const testUser = await User.findOne({ role: 'user' }).limit(1);
    const testProfile = await Profile.findOne({ userId: testUser?._id }).limit(1);
    
    if (!testUser || !testProfile) {
      log.warning('No test user found. Creating mock notification...');
      
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: process.env.TEST_EMAIL || 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'TestPass123'
      };
      
      const mockProfile = {
        _id: new mongoose.Types.ObjectId(),
        userId: mockUser._id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        vtid: 1000
      };
      
      log.info(`Sending test notification to: ${mockProfile.email}`);
      // Note: This will fail without actual user creation
      log.warning('User creation email: SKIPPED (requires actual user creation event)');
      return { status: 'skipped', reason: 'Requires actual user creation' };
    }
    
    log.success(`Found test user: ${testProfile.email}`);
    log.info('User creation emails are sent during actual user creation via /api/users route');
    return { status: 'ready', email: testProfile.email };
  } catch (error) {
    log.error(`Error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function testProfileUpdate() {
  log.section('TEST 2: PROFILE UPDATE EMAIL');
  
  try {
    const Profile = mongoose.model('Profile');
    const testProfile = await Profile.findOne().limit(1);
    
    if (!testProfile) {
      log.error('No profiles found in database');
      return { status: 'error', reason: 'No profiles found' };
    }
    
    log.success(`Using profile: ${testProfile.email}`);
    
    const updatedFields = {
      mobile: '+44 1234 567890',
      jobTitle: 'Updated Job Title'
    };
    
    log.info('Sending profile update notification...');
    await notifyProfileUpdate(testProfile, updatedFields, testProfile.userId);
    
    log.success('Profile update email sent successfully');
    return { status: 'success', email: testProfile.email };
  } catch (error) {
    log.error(`Error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function testCertificateAdded() {
  log.section('TEST 3: CERTIFICATE ADDED EMAIL');
  
  try {
    const Certificate = mongoose.model('Certificate');
    const Profile = mongoose.model('Profile');
    
    const testCert = await Certificate.findOne().populate('profileId').limit(1);
    
    if (!testCert || !testCert.profileId) {
      log.error('No certificates with valid profile found');
      return { status: 'error', reason: 'No valid certificates found' };
    }
    
    log.success(`Using certificate: ${testCert.certificate}`);
    log.success(`Profile: ${testCert.profileId.email}`);
    
    log.info('Sending certificate added notification...');
    await notifyCertificateAdded(testCert, testCert.profileId, testCert.profileId.userId);
    
    log.success('Certificate added email sent successfully');
    return { status: 'success', email: testCert.profileId.email };
  } catch (error) {
    log.error(`Error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function testCertificateUpdated() {
  log.section('TEST 4: CERTIFICATE UPDATED EMAIL');
  
  try {
    const Certificate = mongoose.model('Certificate');
    const Profile = mongoose.model('Profile');
    
    const testCert = await Certificate.findOne().populate('profileId').limit(1);
    
    if (!testCert || !testCert.profileId) {
      log.error('No certificates with valid profile found');
      return { status: 'error', reason: 'No valid certificates found' };
    }
    
    log.success(`Using certificate: ${testCert.certificate}`);
    log.success(`Profile: ${testCert.profileId.email}`);
    
    const updatedFields = {
      provider: 'Updated Provider',
      status: 'Renewed'
    };
    
    log.info('Sending certificate updated notification...');
    await notifyCertificateUpdated(testCert, testCert.profileId, updatedFields, testCert.profileId.userId);
    
    log.success('Certificate updated email sent successfully');
    return { status: 'success', email: testCert.profileId.email };
  } catch (error) {
    log.error(`Error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function testCertificateDeleted() {
  log.section('TEST 5: CERTIFICATE DELETED EMAIL');
  
  try {
    const Certificate = mongoose.model('Certificate');
    const Profile = mongoose.model('Profile');
    
    const testCert = await Certificate.findOne().populate('profileId').limit(1);
    
    if (!testCert || !testCert.profileId) {
      log.error('No certificates with valid profile found');
      return { status: 'error', reason: 'No valid certificates found' };
    }
    
    log.success(`Using certificate: ${testCert.certificate}`);
    log.success(`Profile: ${testCert.profileId.email}`);
    
    log.info('Sending certificate deleted notification...');
    await notifyCertificateDeleted(testCert, testCert.profileId, testCert.profileId.userId);
    
    log.success('Certificate deleted email sent successfully');
    return { status: 'success', email: testCert.profileId.email };
  } catch (error) {
    log.error(`Error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function testCertificateExpiringSoon() {
  log.section('TEST 6: CERTIFICATE EXPIRING SOON (7 days)');
  
  try {
    const Certificate = mongoose.model('Certificate');
    const Profile = mongoose.model('Profile');
    
    const testCert = await Certificate.findOne({ expiryDate: { $exists: true } }).populate('profileId').limit(1);
    
    if (!testCert || !testCert.profileId) {
      log.error('No certificates with valid profile and expiry date found');
      return { status: 'error', reason: 'No valid certificates found' };
    }
    
    log.success(`Using certificate: ${testCert.certificate}`);
    log.success(`Profile: ${testCert.profileId.email}`);
    log.info(`Actual expiry date: ${testCert.expiryDate}`);
    
    // Simulate 7 days until expiry
    const daysUntilExpiry = 7;
    
    log.info(`Sending expiring soon notification (${daysUntilExpiry} days)...`);
    await notifyCertificateExpiring(testCert, testCert.profileId, daysUntilExpiry);
    
    log.success('Certificate expiring soon email sent successfully');
    return { status: 'success', email: testCert.profileId.email, days: daysUntilExpiry };
  } catch (error) {
    log.error(`Error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function testCertificateExpired() {
  log.section('TEST 7: CERTIFICATE EXPIRED EMAIL');
  
  try {
    const Certificate = mongoose.model('Certificate');
    const Profile = mongoose.model('Profile');
    
    const testCert = await Certificate.findOne({ expiryDate: { $exists: true } }).populate('profileId').limit(1);
    
    if (!testCert || !testCert.profileId) {
      log.error('No certificates with valid profile and expiry date found');
      return { status: 'error', reason: 'No valid certificates found' };
    }
    
    log.success(`Using certificate: ${testCert.certificate}`);
    log.success(`Profile: ${testCert.profileId.email}`);
    log.info(`Actual expiry date: ${testCert.expiryDate}`);
    
    // Simulate expired (3 days ago)
    const daysExpired = 3;
    
    log.info(`Sending expired notification (${daysExpired} days ago)...`);
    await notifyCertificateExpired(testCert, testCert.profileId, daysExpired);
    
    log.success('Certificate expired email sent successfully');
    return { status: 'success', email: testCert.profileId.email, daysExpired };
  } catch (error) {
    log.error(`Error: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

async function generateReport(results) {
  log.section('EMAIL NOTIFICATION VALIDATION REPORT');
  
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ Trigger Event              │ Status      │ Details      │');
  console.log('├─────────────────────────────────────────────────────────┤');
  
  const triggers = [
    { name: 'User Creation', result: results.userCreation },
    { name: 'Profile Update', result: results.profileUpdate },
    { name: 'Certificate Added', result: results.certAdded },
    { name: 'Certificate Updated', result: results.certUpdated },
    { name: 'Certificate Deleted', result: results.certDeleted },
    { name: 'Expiring Soon (7 days)', result: results.certExpiringSoon },
    { name: 'Expired Certificates', result: results.certExpired }
  ];
  
  triggers.forEach(({ name, result }) => {
    let status, icon, details;
    
    if (result.status === 'success') {
      icon = '✅';
      status = 'Working';
      details = `Email: ${result.email}`;
    } else if (result.status === 'skipped') {
      icon = '⚠';
      status = 'Skipped';
      details = result.reason;
    } else if (result.status === 'ready') {
      icon = '✅';
      status = 'Ready';
      details = `Email: ${result.email}`;
    } else {
      icon = '❌';
      status = 'Failed';
      details = result.error || result.reason || 'Unknown error';
    }
    
    console.log(`│ ${icon} ${name.padEnd(22)} │ ${status.padEnd(11)} │ ${details.substring(0, 12).padEnd(12)} │`);
  });
  
  console.log('└─────────────────────────────────────────────────────────┘\n');
  
  // Summary
  const successful = triggers.filter(t => t.result.status === 'success' || t.result.status === 'ready').length;
  const failed = triggers.filter(t => t.result.status === 'error').length;
  const skipped = triggers.filter(t => t.result.status === 'skipped').length;
  
  log.section('SUMMARY');
  log.success(`Successful: ${successful}/${triggers.length}`);
  if (failed > 0) log.error(`Failed: ${failed}/${triggers.length}`);
  if (skipped > 0) log.warning(`Skipped: ${skipped}/${triggers.length}`);
  
  // Recommendations
  if (failed > 0 || skipped > 0) {
    log.section('RECOMMENDATIONS');
    
    triggers.forEach(({ name, result }) => {
      if (result.status === 'error') {
        log.error(`${name}: Check backend logs for error: ${result.error}`);
        log.info(`  - Verify SMTP configuration`);
        log.info(`  - Ensure database has valid test data`);
        log.info(`  - Check notification service integration`);
      } else if (result.status === 'skipped') {
        log.warning(`${name}: ${result.reason}`);
        log.info(`  - Test this trigger manually via the UI or API`);
      }
    });
  }
}

async function main() {
  try {
    // Connect to database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';
    log.info(`Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
    
    await mongoose.connect(MONGODB_URI);
    log.success('Connected to MongoDB');
    
    // Load models
    require('./server');
    
    // Validate email configuration
    const configValid = await validateEmailConfig();
    
    if (!configValid) {
      log.error('Email configuration is invalid. Cannot proceed with tests.');
      process.exit(1);
    }
    
    // Run tests
    const results = {
      userCreation: await testUserCreation(),
      profileUpdate: await testProfileUpdate(),
      certAdded: await testCertificateAdded(),
      certUpdated: await testCertificateUpdated(),
      certDeleted: await testCertificateDeleted(),
      certExpiringSoon: await testCertificateExpiringSoon(),
      certExpired: await testCertificateExpired()
    };
    
    // Generate report
    await generateReport(results);
    
    // Close connection
    await mongoose.connection.close();
    log.success('Test completed');
    
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
main();
