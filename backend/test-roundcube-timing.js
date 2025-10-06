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
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(70)}\n${msg}\n${'='.repeat(70)}${colors.reset}\n`)
};

function analyzeTimingIssues() {
  log.section('ROUNDCUBE WEBMAIL TIMING ANALYSIS');
  
  // Get current times in different zones
  const now = new Date();
  const indiaTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'long'
  }).format(now);
  
  const ukTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    dateStyle: 'full',
    timeStyle: 'long'
  }).format(now);
  
  const utcTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    dateStyle: 'full',
    timeStyle: 'long'
  }).format(now);
  
  log.info('Current Time Analysis:');
  log.info(`  India (Your Location): ${indiaTime}`);
  log.info(`  UK (Roundcube Server): ${ukTime}`);
  log.info(`  UTC (Email Standards): ${utcTime}`);
  
  // Calculate time difference
  const indiaOffset = now.getTimezoneOffset() / -60; // India is UTC+5:30
  const ukOffset = new Date().toLocaleString('en', {timeZone: 'Europe/London'});
  
  log.info(`\nTime Zone Offsets:`);
  log.info(`  India: UTC+5:30`);
  log.info(`  UK: UTC+0 (GMT) or UTC+1 (BST)`);
  log.info(`  Difference: ~4.5-5.5 hours`);
  
  return { indiaTime, ukTime, utcTime };
}

function identifyRoundcubeIssues() {
  log.section('POTENTIAL ROUNDCUBE ISSUES');
  
  log.warning('🕐 Timing-Related Issues:');
  log.info('1. Email Queue Processing:');
  log.info('   - Roundcube may process emails during UK business hours');
  log.info('   - Delayed processing for emails sent outside UK hours');
  log.info('   - Queue backlog during UK night time (India evening)');
  
  log.info('2. SMTP Connection Limits:');
  log.info('   - Concurrent connection limits during peak UK hours');
  log.info('   - Rate limiting based on UK timezone');
  log.info('   - Server maintenance windows during UK off-hours');
  
  log.info('3. Authentication Token Expiry:');
  log.info('   - Session timeouts based on UK timezone');
  log.info('   - Authentication refresh cycles');
  
  log.warning('📧 Domain-Specific Issues:');
  log.info('1. Internal (.co.uk) Domains:');
  log.info('   - Prioritized processing during UK business hours');
  log.info('   - Direct delivery without external relay');
  log.info('   - Lower latency and higher success rate');
  
  log.info('2. External (gmail.com) Domains:');
  log.info('   - Requires external relay/gateway');
  log.info('   - Additional authentication steps');
  log.info('   - Subject to external provider rate limits');
  log.info('   - May be queued for batch processing');
  
  log.error('🚫 Common Roundcube Restrictions:');
  log.info('1. Corporate Email Policies:');
  log.info('   - External domain blocking for security');
  log.info('   - Whitelist-only external delivery');
  log.info('   - DLP (Data Loss Prevention) scanning delays');
  
  log.info('2. Anti-Spam Measures:');
  log.info('   - External emails flagged for additional screening');
  log.info('   - Reputation-based delivery delays');
  log.info('   - Bulk email detection and throttling');
}

async function testTimingImpact() {
  log.section('TIMING IMPACT TEST');
  
  const testEmails = [
    { 
      email: 'thaya.govzig@vitruxshield.com', 
      type: 'Internal (vitruxshield.com)',
      expectedBehavior: 'Immediate delivery'
    },
    { 
      email: 'dean.cumming@vitrux.co.uk', 
      type: 'UK Domain (.co.uk)',
      expectedBehavior: 'Fast delivery during UK hours'
    },
    { 
      email: 'mvnaveen18@gmail.com', 
      type: 'External (Gmail)',
      expectedBehavior: 'Delayed or blocked delivery'
    }
  ];
  
  log.info('Testing email delivery at current time...');
  log.info(`Test initiated at: ${new Date().toISOString()}`);
  
  const results = [];
  
  for (const testCase of testEmails) {
    log.info(`\nTesting: ${testCase.email} (${testCase.type})`);
    log.info(`Expected: ${testCase.expectedBehavior}`);
    
    const startTime = Date.now();
    
    try {
      const result = await sendTestEmail(testCase.email, 'Timing Test User');
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (result.success) {
        log.success(`✅ Email sent in ${duration}ms`);
        log.info(`   Message ID: ${result.messageId}`);
        results.push({ 
          ...testCase, 
          status: 'success', 
          duration, 
          messageId: result.messageId 
        });
      } else {
        log.error(`❌ Failed after ${duration}ms: ${result.error}`);
        results.push({ 
          ...testCase, 
          status: 'failed', 
          duration, 
          error: result.error 
        });
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      log.error(`❌ Exception after ${duration}ms: ${error.message}`);
      results.push({ 
        ...testCase, 
        status: 'error', 
        duration, 
        error: error.message 
      });
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  return results;
}

function analyzeResults(results) {
  log.section('TIMING ANALYSIS RESULTS');
  
  console.log('┌─────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Email Type                    │ Status      │ Duration │ Analysis       │');
  console.log('├─────────────────────────────────────────────────────────────────────────┤');
  
  results.forEach(result => {
    const status = result.status === 'success' ? '✅ Success' : '❌ Failed';
    const duration = `${result.duration}ms`.padEnd(8);
    let analysis = '';
    
    if (result.type.includes('Internal')) {
      analysis = result.status === 'success' ? 'Normal' : 'Config Issue';
    } else if (result.type.includes('UK Domain')) {
      analysis = result.status === 'success' ? 'UK Priority' : 'Timing Issue';
    } else if (result.type.includes('External')) {
      analysis = result.status === 'success' ? 'Allowed' : 'Blocked/Delayed';
    }
    
    const emailType = result.type.padEnd(29);
    console.log(`│ ${emailType} │ ${status.padEnd(11)} │ ${duration} │ ${analysis.padEnd(14)} │`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────────────────┘\n');
  
  // Pattern analysis
  const internalSuccess = results.filter(r => r.type.includes('Internal') && r.status === 'success').length;
  const ukSuccess = results.filter(r => r.type.includes('UK Domain') && r.status === 'success').length;
  const externalSuccess = results.filter(r => r.type.includes('External') && r.status === 'success').length;
  
  log.info('Pattern Analysis:');
  log.info(`  Internal domains: ${internalSuccess > 0 ? '✅ Working' : '❌ Failed'}`);
  log.info(`  UK domains (.co.uk): ${ukSuccess > 0 ? '✅ Working' : '❌ Failed'}`);
  log.info(`  External domains: ${externalSuccess > 0 ? '✅ Working' : '❌ Blocked'}`);
}

function provideRecommendations() {
  log.section('RECOMMENDATIONS FOR ROUNDCUBE TIMING ISSUES');
  
  const now = new Date();
  const ukHour = parseInt(new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    hour12: false
  }).format(now));
  
  const isUKBusinessHours = ukHour >= 9 && ukHour <= 17;
  
  log.info(`Current UK time: ${ukHour}:00 ${isUKBusinessHours ? '(Business Hours)' : '(Off Hours)'}`);
  
  if (isUKBusinessHours) {
    log.success('✅ Currently UK business hours - optimal time for email testing');
  } else {
    log.warning('⚠️ Currently UK off-hours - emails may be queued or delayed');
  }
  
  log.info('\n🔧 Technical Solutions:');
  
  log.info('1. Immediate Fix - Request IT Support:');
  log.info('   - Ask IT to whitelist mvnaveen18@gmail.com');
  log.info('   - Request external domain relay permissions');
  log.info('   - Configure SMTP relay for external domains');
  
  log.info('2. Alternative SMTP Configuration:');
  log.info('   - Use a dedicated transactional email service');
  log.info('   - Configure dual SMTP (internal + external)');
  log.info('   - Implement email queue with retry logic');
  
  log.info('3. Timing Optimization:');
  log.info('   - Schedule bulk emails during UK business hours');
  log.info('   - Implement timezone-aware email sending');
  log.info('   - Add retry mechanism for failed external emails');
  
  log.info('\n📧 Email Service Alternatives:');
  log.info('   - SendGrid: Reliable, professional transactional emails');
  log.info('   - AWS SES: Cost-effective, high deliverability');
  log.info('   - Mailgun: Developer-friendly with good APIs');
  log.info('   - Postmark: Excellent for transactional emails');
  
  log.info('\n⏰ Best Practices:');
  log.info('   - Test emails during UK business hours (9 AM - 5 PM GMT)');
  log.info('   - Monitor email delivery logs for patterns');
  log.info('   - Implement proper error handling and retries');
  log.info('   - Use email queuing for non-critical notifications');
}

async function main() {
  try {
    log.section('ROUNDCUBE WEBMAIL TIMING DIAGNOSTIC');
    
    analyzeTimingIssues();
    identifyRoundcubeIssues();
    
    const results = await testTimingImpact();
    analyzeResults(results);
    
    provideRecommendations();
    
    log.section('DIAGNOSTIC COMPLETE');
    log.info('Check the analysis above to understand timing-related email issues.');
    
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the diagnostic
main();
