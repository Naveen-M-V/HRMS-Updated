const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔧 HRMS Email Diagnostic - Production Configuration\n');

// Test email configuration with your current settings
const testEmailConfig = async () => {
  console.log('📋 Current Email Configuration:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('');

  // Test both transporter configurations
  console.log('🔍 Testing Email Service Configurations...\n');

  // Configuration 1: From utils/emailService.js
  const transporter1 = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Configuration 2: From server.js
  const transporter2 = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Test 1: Utils/emailService.js configuration');
    await transporter1.verify();
    console.log('✅ Configuration 1 (utils/emailService.js) - SMTP connection successful');
    
    console.log('\nTest 2: Server.js configuration');
    await transporter2.verify();
    console.log('✅ Configuration 2 (server.js) - SMTP connection successful');

    // Test sending actual email
    console.log('\nTest 3: Sending test email...');
    const testEmail = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'thaya.govzig@vitruxshield.com', // Send to your email
      subject: '🔧 HRMS Email Test - ' + new Date().toISOString(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
            <h1>✅ Email Service Test</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p><strong>Email Configuration Test Results:</strong></p>
            <ul>
              <li>Host: ${process.env.EMAIL_HOST}</li>
              <li>Port: ${process.env.EMAIL_PORT}</li>
              <li>Secure: ${process.env.EMAIL_SECURE}</li>
              <li>User: ${process.env.EMAIL_USER}</li>
              <li>From: ${process.env.EMAIL_FROM}</li>
            </ul>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Server:</strong> Production HRMS</p>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 0; color: #1e40af;"><strong>Status:</strong> Email service is working correctly!</p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter1.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Email sent to:', testEmail.to);

    // Test email queue/delay
    console.log('\nTest 4: Testing email delivery speed...');
    const startTime = Date.now();
    
    const quickEmail = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'thaya.govzig@vitruxshield.com',
      subject: '⚡ Speed Test - ' + new Date().toISOString(),
      text: `Speed test email sent at: ${new Date().toISOString()}\nDelivery should be immediate.`
    };

    const speedInfo = await transporter1.sendMail(quickEmail);
    const endTime = Date.now();
    const deliveryTime = endTime - startTime;
    
    console.log('✅ Speed test email sent!');
    console.log('⏱️  Delivery time:', deliveryTime + 'ms');
    console.log('📧 Message ID:', speedInfo.messageId);

    if (deliveryTime > 5000) {
      console.log('⚠️  WARNING: Email delivery is slow (>5 seconds)');
      console.log('   This could cause delayed notifications');
    } else {
      console.log('✅ Email delivery speed is good');
    }

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Full error:', error);
    
    console.log('\n🔧 Troubleshooting:');
    if (error.message.includes('Invalid login')) {
      console.log('• Check EMAIL_USER and EMAIL_PASS credentials');
      console.log('• Verify email server allows SMTP access');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('• Check EMAIL_HOST and EMAIL_PORT');
      console.log('• Verify firewall/network connectivity');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('• Email server is slow or unresponsive');
      console.log('• This could cause delayed email delivery');
    }
  }
};

testEmailConfig();
