require('dotenv').config();
const { sendTestEmail } = require('./utils/emailService');

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

async function testDomainRestrictions() {
  log.section('DOMAIN RESTRICTION TEST');
  
  const testEmails = [
    { email: 'thaya.govzig@vitruxshield.com', domain: 'vitruxshield.com', type: 'Internal Domain' },
    { email: 'dean.cumming@vitrux.co.uk', domain: 'vitrux.co.uk', type: 'Related Domain' },
    { email: 'mvnaveen18@gmail.com', domain: 'gmail.com', type: 'External Domain (Gmail)' },
    { email: 'test@yahoo.com', domain: 'yahoo.com', type: 'External Domain (Yahoo)' },
    { email: 'test@outlook.com', domain: 'outlook.com', type: 'External Domain (Outlook)' }
  ];
  
  const results = [];
  
  for (const testCase of testEmails) {
    log.info(`Testing ${testCase.type}: ${testCase.email}`);
    
    try {
      const result = await sendTestEmail(testCase.email, 'Domain Test User');
      
      if (result.success) {
        log.success(`✅ SUCCESS - Email sent to ${testCase.email}`);
        log.info(`   Message ID: ${result.messageId}`);
        results.push({ ...testCase, status: 'success', messageId: result.messageId });
      } else {
        log.error(`❌ FAILED - ${testCase.email}: ${result.error}`);
        results.push({ ...testCase, status: 'failed', error: result.error });
      }
    } catch (error) {
      log.error(`❌ ERROR - ${testCase.email}: ${error.message}`);
      results.push({ ...testCase, status: 'error', error: error.message });
    }
    
    // Wait 2 seconds between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

function analyzeResults(results) {
  log.section('ANALYSIS RESULTS');
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status !== 'success');
  
  log.info(`Total tests: ${results.length}`);
  log.success(`Successful: ${successful.length}`);
  log.error(`Failed: ${failed.length}`);
  
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ Email Address                  │ Domain           │ Status      │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  
  results.forEach(result => {
    const status = result.status === 'success' ? '✅ Success' : '❌ Failed';
    const email = result.email.padEnd(30);
    const domain = result.domain.padEnd(16);
    console.log(`│ ${email} │ ${domain} │ ${status.padEnd(11)} │`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────────┘\n');
  
  // Analyze patterns
  log.section('PATTERN ANALYSIS');
  
  const internalDomains = ['vitruxshield.com', 'vitrux.co.uk'];
  const internalResults = results.filter(r => internalDomains.includes(r.domain));
  const externalResults = results.filter(r => !internalDomains.includes(r.domain));
  
  const internalSuccess = internalResults.filter(r => r.status === 'success').length;
  const externalSuccess = externalResults.filter(r => r.status === 'success').length;
  
  log.info(`Internal domains (${internalDomains.join(', ')}):`);
  log.info(`  Success rate: ${internalSuccess}/${internalResults.length} (${Math.round(internalSuccess/internalResults.length*100)}%)`);
  
  log.info(`External domains:`);
  log.info(`  Success rate: ${externalSuccess}/${externalResults.length} (${Math.round(externalSuccess/externalResults.length*100)}%)`);
  
  // Diagnosis
  log.section('DIAGNOSIS');
  
  if (internalSuccess > 0 && externalSuccess === 0) {
    log.error('🚫 DOMAIN RESTRICTION DETECTED');
    log.info('Your SMTP server (mail.vitruxshield.com) appears to be configured to only send emails to internal domains.');
    log.info('This is a common security measure in corporate environments.');
    
    log.section('SOLUTIONS');
    log.info('1. 🔧 SMTP Server Configuration (Recommended):');
    log.info('   - Contact your IT administrator');
    log.info('   - Request to whitelist external domains or specific email addresses');
    log.info('   - Ask for relay permissions for external domains');
    
    log.info('2. 📧 Alternative Email Service:');
    log.info('   - Use a service like SendGrid, Mailgun, or AWS SES');
    log.info('   - These services are designed for transactional emails');
    log.info('   - Update your .env file with new SMTP settings');
    
    log.info('3. ⚙️ Dual Configuration:');
    log.info('   - Keep current SMTP for internal emails');
    log.info('   - Add external service for external emails');
    log.info('   - Modify emailService.js to route based on domain');
    
  } else if (internalSuccess === 0 && externalSuccess === 0) {
    log.error('🚫 COMPLETE EMAIL FAILURE');
    log.info('No emails are being sent successfully. Check:');
    log.info('- SMTP credentials and server settings');
    log.info('- Network connectivity to mail.vitruxshield.com:465');
    log.info('- Firewall rules');
    
  } else if (internalSuccess > 0 && externalSuccess > 0) {
    log.success('✅ NO DOMAIN RESTRICTIONS');
    log.info('Your SMTP server can send to both internal and external domains.');
    log.info('The issue with mvnaveen18@gmail.com might be:');
    log.info('- Gmail spam filtering');
    log.info('- Temporary delivery delays');
    log.info('- Gmail blocking emails from your domain');
    
  } else {
    log.warning('⚠️ MIXED RESULTS');
    log.info('Some emails are working, others are not. This could indicate:');
    log.info('- Partial domain restrictions');
    log.info('- Rate limiting');
    log.info('- Specific email provider blocks');
  }
  
  // Show failed email errors for debugging
  if (failed.length > 0) {
    log.section('ERROR DETAILS');
    failed.forEach(result => {
      log.error(`${result.email}: ${result.error}`);
    });
  }
}

async function main() {
  try {
    log.section('HRMS EMAIL DOMAIN RESTRICTION TEST');
    log.info('This tool tests if your SMTP server has domain restrictions');
    log.warning('Note: This will send actual test emails to the addresses listed');
    
    const results = await testDomainRestrictions();
    analyzeResults(results);
    
    log.section('TEST COMPLETE');
    
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
main();
