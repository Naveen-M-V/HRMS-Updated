const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(70)}\n${msg}\n${'='.repeat(70)}${colors.reset}\n`),
  subsection: (msg) => console.log(`\n${colors.magenta}${msg}${colors.reset}`)
};

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkCodePattern(filePath, pattern, description) {
  if (!checkFileExists(filePath)) {
    return { found: false, error: 'File not found' };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(pattern, 'gi');
  const matches = content.match(regex);
  
  return {
    found: matches && matches.length > 0,
    count: matches ? matches.length : 0,
    matches: matches ? matches.slice(0, 3) : []
  };
}

function validateEmailConfig() {
  log.section('📧 EMAIL CONFIGURATION VALIDATION');
  
  const requiredVars = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_PORT'];
  const optionalVars = ['EMAIL_FROM', 'EMAIL_SECURE', 'FRONTEND_URL'];
  
  let allValid = true;
  
  log.subsection('Required Configuration:');
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      const displayValue = varName === 'EMAIL_PASS' ? '***' : process.env[varName];
      log.success(`${varName} = ${displayValue}`);
    } else {
      log.error(`${varName} is NOT SET`);
      allValid = false;
    }
  });
  
  log.subsection('Optional Configuration:');
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      log.info(`${varName} = ${process.env[varName]}`);
    } else {
      log.warning(`${varName} is NOT SET`);
    }
  });
  
  // Check EMAIL_FROM vs EMAIL_USER consistency
  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const emailUser = process.env.EMAIL_USER;
  
  log.subsection('Consistency Check:');
  if (emailFrom === emailUser) {
    log.success(`EMAIL_FROM matches EMAIL_USER: ${emailFrom}`);
  } else if (process.env.EMAIL_FROM && emailFrom !== emailUser) {
    log.warning(`EMAIL_FROM (${emailFrom}) differs from EMAIL_USER (${emailUser})`);
    log.info('  This may cause "from address mismatch" errors with some SMTP servers');
  }
  
  return allValid;
}

function validateEmailService() {
  log.section('📨 EMAIL SERVICE VALIDATION');
  
  const emailServicePath = path.join(__dirname, 'utils', 'emailService.js');
  
  if (!checkFileExists(emailServicePath)) {
    log.error('emailService.js not found!');
    return false;
  }
  
  log.success('emailService.js found');
  
  const requiredFunctions = [
    'sendProfileCreationEmail',
    'sendProfileUpdateEmail',
    'sendCertificateAddedEmail',
    'sendCertificateDeletedEmail',
    'sendCertificateExpiryReminderEmail',
    'sendCertificateExpiredEmail',
    'testEmailConfiguration'
  ];
  
  log.subsection('Required Email Functions:');
  let allFunctionsExist = true;
  
  requiredFunctions.forEach(funcName => {
    const result = checkCodePattern(emailServicePath, `(const|function)\\s+${funcName}`, funcName);
    if (result.found) {
      log.success(`${funcName}()`);
    } else {
      log.error(`${funcName}() NOT FOUND`);
      allFunctionsExist = false;
    }
  });
  
  return allFunctionsExist;
}

function validateNotificationService() {
  log.section('🔔 NOTIFICATION SERVICE VALIDATION');
  
  const notificationServicePath = path.join(__dirname, 'utils', 'notificationService.js');
  
  if (!checkFileExists(notificationServicePath)) {
    log.error('notificationService.js not found!');
    return false;
  }
  
  log.success('notificationService.js found');
  
  const requiredFunctions = [
    'notifyUserCreation',
    'notifyProfileUpdate',
    'notifyCertificateAdded',
    'notifyCertificateUpdated',
    'notifyCertificateDeleted',
    'notifyCertificateExpiring',
    'notifyCertificateExpired'
  ];
  
  log.subsection('Required Notification Functions:');
  let allFunctionsExist = true;
  
  requiredFunctions.forEach(funcName => {
    const result = checkCodePattern(notificationServicePath, `(async function|const)\\s+${funcName}`, funcName);
    if (result.found) {
      log.success(`${funcName}()`);
    } else {
      log.error(`${funcName}() NOT FOUND`);
      allFunctionsExist = false;
    }
  });
  
  return allFunctionsExist;
}

function validateServerIntegration() {
  log.section('🔗 SERVER INTEGRATION VALIDATION');
  
  const serverPath = path.join(__dirname, 'server.js');
  
  if (!checkFileExists(serverPath)) {
    log.error('server.js not found!');
    return {};
  }
  
  const triggers = [
    { 
      name: 'User Creation', 
      patterns: [
        'notifyUserCreation',
        'sendUserCredentialsEmail',
        'sendWelcomeEmailToNewUser'
      ],
      route: 'POST /api/users'
    },
    { 
      name: 'Profile Update', 
      patterns: [
        'notifyProfileUpdate',
        'sendNotificationEmail.*profile.*update'
      ],
      route: 'PUT /api/profiles/:id'
    },
    { 
      name: 'Certificate Added', 
      patterns: [
        'notifyCertificateAdded',
        'sendNotificationEmail.*certificate.*added'
      ],
      route: 'POST /api/certificates'
    },
    { 
      name: 'Certificate Updated', 
      patterns: [
        'notifyCertificateUpdated',
        'sendNotificationEmail.*certificate.*update'
      ],
      route: 'PUT /api/certificates/:id'
    },
    { 
      name: 'Certificate Deleted', 
      patterns: [
        'notifyCertificateDeleted',
        'sendNotificationEmail.*certificate.*delet'
      ],
      route: 'DELETE /api/certificates/:id'
    }
  ];
  
  const results = {};
  
  triggers.forEach(({ name, patterns, route }) => {
    log.subsection(`${name} (${route}):`);
    
    let triggerFound = false;
    patterns.forEach(pattern => {
      const result = checkCodePattern(serverPath, pattern, name);
      if (result.found) {
        log.success(`  Pattern found: ${pattern} (${result.count} occurrence(s))`);
        triggerFound = true;
      }
    });
    
    if (!triggerFound) {
      log.error(`  NO trigger patterns found!`);
      log.info(`    Expected patterns: ${patterns.join(', ')}`);
    }
    
    results[name] = triggerFound;
  });
  
  return results;
}

function validateScheduledJobs() {
  log.section('⏰ SCHEDULED JOBS VALIDATION');
  
  const schedulerPath = path.join(__dirname, 'utils', 'certificateScheduler.js');
  
  if (!checkFileExists(schedulerPath)) {
    log.error('certificateScheduler.js not found!');
    return false;
  }
  
  log.success('certificateScheduler.js found');
  
  const checks = [
    { pattern: 'checkExpiringCertificates', name: 'Expiring Certificates Check' },
    { pattern: 'checkExpiredCertificates', name: 'Expired Certificates Check' },
    { pattern: 'notifyCertificateExpiring', name: 'Expiring Notification' },
    { pattern: 'notifyCertificateExpired', name: 'Expired Notification' },
    { pattern: "cron\\.schedule\\('0 9 \\* \\* \\*'", name: 'Daily 9 AM Cron Job' },
    { pattern: "cron\\.schedule\\('0 10 \\* \\* \\*'", name: 'Daily 10 AM Cron Job' },
    { pattern: 'startAllCertificateSchedulers', name: 'Scheduler Starter Function' }
  ];
  
  log.subsection('Scheduler Components:');
  let allValid = true;
  
  checks.forEach(({ pattern, name }) => {
    const result = checkCodePattern(schedulerPath, pattern, name);
    if (result.found) {
      log.success(name);
    } else {
      log.error(`${name} NOT FOUND`);
      allValid = false;
    }
  });
  
  // Check if scheduler is started in server.js
  log.subsection('Scheduler Initialization:');
  const serverPath = path.join(__dirname, 'server.js');
  const initResult = checkCodePattern(serverPath, 'startAllCertificateSchedulers', 'Scheduler Init');
  
  if (initResult.found) {
    log.success(`Scheduler initialized in server.js (${initResult.count} occurrence(s))`);
  } else {
    log.error('Scheduler NOT initialized in server.js');
    allValid = false;
  }
  
  return allValid;
}

function generateValidationReport(configValid, serviceValid, notificationValid, serverIntegration, schedulerValid) {
  log.section('📊 VALIDATION REPORT');
  
  console.log('┌────────────────────────────────────────────────────────────────────┐');
  console.log('│ Trigger Event                │ Status          │ Implementation    │');
  console.log('├────────────────────────────────────────────────────────────────────┤');
  
  const triggers = [
    {
      name: 'User Creation',
      emailFunc: 'sendUserCredentialsEmail',
      integration: serverIntegration['User Creation'],
      scheduled: false
    },
    {
      name: 'Profile Update',
      emailFunc: 'sendProfileUpdateEmail',
      integration: serverIntegration['Profile Update'],
      scheduled: false
    },
    {
      name: 'Certificate Added',
      emailFunc: 'sendCertificateAddedEmail',
      integration: serverIntegration['Certificate Added'],
      scheduled: false
    },
    {
      name: 'Certificate Updated',
      emailFunc: 'sendNotificationEmail',
      integration: serverIntegration['Certificate Updated'],
      scheduled: false
    },
    {
      name: 'Certificate Deleted',
      emailFunc: 'sendCertificateDeletedEmail',
      integration: serverIntegration['Certificate Deleted'],
      scheduled: false
    },
    {
      name: 'Expiring Soon (7 days)',
      emailFunc: 'sendCertificateExpiryEmail',
      integration: schedulerValid,
      scheduled: true
    },
    {
      name: 'Expired Certificates',
      emailFunc: 'sendNotificationEmail',
      integration: schedulerValid,
      scheduled: true
    }
  ];
  
  triggers.forEach(({ name, integration, scheduled }) => {
    let status, icon, impl;
    
    if (!configValid) {
      icon = '❌';
      status = 'Not Working';
      impl = 'Config Invalid';
    } else if (!serviceValid || !notificationValid) {
      icon = '❌';
      status = 'Not Working';
      impl = 'Service Missing';
    } else if (integration) {
      icon = '✅';
      status = 'Working';
      impl = scheduled ? 'Scheduled Job' : 'Event Trigger';
    } else {
      icon = '⚠';
      status = 'Partially Working';
      impl = 'Missing Trigger';
    }
    
    console.log(`│ ${icon} ${name.padEnd(26)} │ ${status.padEnd(15)} │ ${impl.padEnd(17)} │`);
  });
  
  console.log('└────────────────────────────────────────────────────────────────────┘\n');
  
  // Summary
  const workingCount = triggers.filter(t => 
    configValid && serviceValid && notificationValid && t.integration
  ).length;
  
  log.subsection('SUMMARY:');
  console.log(`  Total Triggers: ${triggers.length}`);
  console.log(`  ${colors.green}Working: ${workingCount}${colors.reset}`);
  console.log(`  ${colors.yellow}Partial/Missing: ${triggers.length - workingCount}${colors.reset}`);
  
  // Issues and Recommendations
  if (!configValid || !serviceValid || !notificationValid || workingCount < triggers.length) {
    log.section('⚙️  ISSUES & RECOMMENDATIONS');
    
    if (!configValid) {
      log.error('EMAIL CONFIGURATION ISSUE:');
      log.info('  - Check .env file for missing EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT');
      log.info('  - Verify SMTP credentials with your email provider');
      log.info('  - Test connection: node -e "require(\'./utils/emailService\').testEmailConfiguration()"');
    }
    
    if (!serviceValid) {
      log.error('EMAIL SERVICE ISSUE:');
      log.info('  - Missing email functions in utils/emailService.js');
      log.info('  - Verify all required email template functions exist');
    }
    
    if (!notificationValid) {
      log.error('NOTIFICATION SERVICE ISSUE:');
      log.info('  - Missing notification functions in utils/notificationService.js');
      log.info('  - Verify all notification orchestration functions exist');
    }
    
    if (!schedulerValid) {
      log.error('SCHEDULER ISSUE:');
      log.info('  - Check utils/certificateScheduler.js for cron job definitions');
      log.info('  - Verify startAllCertificateSchedulers() is called in server.js');
    }
    
    Object.keys(serverIntegration).forEach(trigger => {
      if (!serverIntegration[trigger]) {
        log.warning(`MISSING TRIGGER: ${trigger}`);
        log.info(`  - Add notification call in the appropriate route handler`);
        log.info(`  - Use notificationService functions from utils/notificationService.js`);
      }
    });
  } else {
    log.success('All email notification triggers are properly integrated! ✨');
    
    log.section('📝 NEXT STEPS');
    log.info('1. Start the server: npm start');
    log.info('2. Test actual email delivery by performing each action in the UI');
    log.info('3. Check backend logs for "✅ email sent to..." messages');
    log.info('4. Verify emails arrive in recipient inboxes (check spam folders)');
    log.info('5. For scheduled jobs, wait for 9 AM & 10 AM or manually trigger:');
    log.info('   - POST /api/notifications/check-expiry (if available)');
  }
}

function main() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║         HRMS EMAIL NOTIFICATION VALIDATION TOOL                    ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  const configValid = validateEmailConfig();
  const serviceValid = validateEmailService();
  const notificationValid = validateNotificationService();
  const serverIntegration = validateServerIntegration();
  const schedulerValid = validateScheduledJobs();
  
  generateValidationReport(configValid, serviceValid, notificationValid, serverIntegration, schedulerValid);
  
  log.section('✅ VALIDATION COMPLETE');
}

main();
