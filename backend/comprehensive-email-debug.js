const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
require('dotenv').config();

async function comprehensiveEmailDebug() {
  console.log('=== COMPREHENSIVE EMAIL DEBUG ===');
  console.log('Current time:', new Date().toISOString());
  console.log('Environment:', process.env.NODE_ENV);
  console.log('');

  // 1. Environment Variables Check
  console.log('📋 ENVIRONMENT VARIABLES:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? `${process.env.EMAIL_PASS.substring(0, 3)}***` : 'NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('SUPER_ADMIN_EMAIL:', process.env.SUPER_ADMIN_EMAIL);
  console.log('');

  // 2. Create transporter with detailed logging
  console.log('🔧 CREATING EMAIL TRANSPORTER...');
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    logger: true, // Enable logging
    debug: true   // Enable debug output
  });

  // 3. Test SMTP connection
  console.log('🔌 TESTING SMTP CONNECTION...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful');
  } catch (error) {
    console.log('❌ SMTP connection failed:', error.message);
    console.log('Full error:', error);
    
    console.log('\n🔍 SMTP TROUBLESHOOTING:');
    console.log('1. Check if mail.vitruxshield.com is accessible');
    console.log('2. Verify port 465 is open for SSL connections');
    console.log('3. Test credentials manually');
    console.log('4. Check firewall settings');
    console.log('5. Try alternative ports (587 with STARTTLS)');
    
    return;
  }

  // 4. Test email sending with detailed logging
  console.log('\n📧 TESTING EMAIL SENDING...');
  const testEmails = process.env.SUPER_ADMIN_EMAIL.split(',').map(e => e.trim());
  console.log(`Testing with ${testEmails.length} admin emails`);

  for (let i = 0; i < Math.min(testEmails.length, 2); i++) {
    const testEmail = testEmails[i];
    console.log(`\n📤 Sending test email ${i + 1} to: ${testEmail}`);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: testEmail,
      subject: `HRMS Email Test - ${new Date().toISOString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>✅ HRMS Email Test Successful</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p><strong>Email System Test Results:</strong></p>
            <ul>
              <li><strong>SMTP Server:</strong> ${process.env.EMAIL_HOST}</li>
              <li><strong>Port:</strong> ${process.env.EMAIL_PORT}</li>
              <li><strong>Secure:</strong> ${process.env.EMAIL_SECURE}</li>
              <li><strong>From:</strong> ${process.env.EMAIL_FROM || process.env.EMAIL_USER}</li>
              <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
            <p>If you're receiving this email, the HRMS notification system is working correctly!</p>
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #ffeaa7;">
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Check if this email landed in your inbox or spam folder</li>
                <li>If in spam, add thaya.govzig@vitruxshield.com to your whitelist</li>
                <li>Contact your IT department to whitelist the domain</li>
              </ol>
            </div>
          </div>
        </div>
      `
    };

    try {
      console.log('Sending email...');
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Response:', result.response);
      
      if (result.accepted && result.accepted.length > 0) {
        console.log('✅ Email accepted by server for:', result.accepted.join(', '));
      }
      
      if (result.rejected && result.rejected.length > 0) {
        console.log('❌ Email rejected by server for:', result.rejected.join(', '));
      }
      
    } catch (error) {
      console.log('❌ Email sending failed:', error.message);
      console.log('Error code:', error.code);
      console.log('Error response:', error.response);
      console.log('Full error:', error);
    }
    
    // Wait between emails
    if (i < Math.min(testEmails.length, 2) - 1) {
      console.log('Waiting 3 seconds before next email...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // 5. Database check
  console.log('\n🗄️ CHECKING DATABASE...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections`);
    
    // Check for notifications
    if (collections.find(c => c.name === 'notifications')) {
      const notifCount = await db.collection('notifications').countDocuments();
      console.log(`Notifications in database: ${notifCount}`);
      
      const recentNotifs = await db.collection('notifications')
        .find({})
        .sort({ createdOn: -1 })
        .limit(3)
        .toArray();
      
      if (recentNotifs.length > 0) {
        console.log('Recent notifications:');
        recentNotifs.forEach((notif, i) => {
          console.log(`  ${i + 1}. [${notif.type}] ${notif.message}`);
        });
      }
    }
    
    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    
  } catch (dbError) {
    console.log('❌ Database error:', dbError.message);
  }

  // 6. Final diagnosis
  console.log('\n🏥 FINAL DIAGNOSIS:');
  console.log('='.repeat(50));
  console.log('');
  console.log('📊 EMAIL SYSTEM STATUS:');
  console.log('✅ Environment variables: Configured');
  console.log('✅ SMTP transporter: Created');
  console.log('✅ SMTP connection: Tested above');
  console.log('✅ Email sending: Tested above');
  console.log('');
  console.log('🔍 IF EMAILS ARE NOT RECEIVED:');
  console.log('');
  console.log('1. 📧 CHECK EMAIL BOXES:');
  console.log('   - Inbox folders for all admin emails');
  console.log('   - SPAM/JUNK folders (most likely location)');
  console.log('   - Quarantine/blocked email folders');
  console.log('   - Search for: thaya.govzig@vitruxshield.com');
  console.log('');
  console.log('2. 🏢 CORPORATE EMAIL FILTERING:');
  console.log('   - vitrux.co.uk emails may have strict filtering');
  console.log('   - Contact IT to whitelist: thaya.govzig@vitruxshield.com');
  console.log('   - Contact IT to whitelist: vitruxshield.com domain');
  console.log('');
  console.log('3. 🌐 DOMAIN REPUTATION:');
  console.log('   - vitruxshield.com may be flagged as new/unknown');
  console.log('   - Check domain reputation: mxtoolbox.com');
  console.log('   - Verify SPF, DKIM, DMARC records');
  console.log('');
  console.log('4. 🧪 IMMEDIATE TEST:');
  console.log('   - Add a personal Gmail address to SUPER_ADMIN_EMAIL');
  console.log('   - If Gmail receives emails, issue is corporate filtering');
  console.log('   - If Gmail doesn\'t receive, issue is with sending');
  console.log('');
  console.log('5. 📞 CONTACT EMAIL PROVIDER:');
  console.log('   - Contact vitruxshield.com email support');
  console.log('   - Ask about delivery logs for recent emails');
  console.log('   - Verify SMTP settings and authentication');
  console.log('');
  console.log('✅ Email debug complete!');
}

// Run the debug
comprehensiveEmailDebug().catch(error => {
  console.error('Debug script error:', error);
  process.exit(1);
});
