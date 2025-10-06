const nodemailer = require('nodemailer');
require('dotenv').config();

const testSMTPConnection = async () => {
  console.log('🔧 Testing SMTP Connection...\n');
  
  console.log('Configuration:');
  console.log(`Host: ${process.env.EMAIL_HOST}`);
  console.log(`Port: ${process.env.EMAIL_PORT}`);
  console.log(`User: ${process.env.EMAIL_USER}`);
  console.log(`Secure: ${process.env.EMAIL_SECURE}`);
  console.log('');

  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 10000      // 10 seconds
    });

    console.log('🔌 Testing connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Test sending a simple email
    console.log('\n📧 Testing email send...');
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'mvnaveen18@gmail.com', // Your email from SUPER_ADMIN_EMAIL
      subject: 'SMTP Test - ' + new Date().toLocaleString(),
      text: 'This is a test email to verify SMTP configuration is working.',
      html: '<p>This is a test email to verify SMTP configuration is working.</p>'
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.log('❌ SMTP Connection Failed:');
    console.log('Error Code:', error.code);
    console.log('Error Message:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n🔍 Troubleshooting Tips:');
      console.log('1. Check if mail.talentshield.co.uk is accessible');
      console.log('2. Verify port 587 is not blocked by firewall');
      console.log('3. Test with telnet: telnet mail.talentshield.co.uk 587');
      console.log('4. Try alternative ports: 25, 465, 2525');
    } else if (error.code === 'EAUTH') {
      console.log('\n🔍 Authentication Issue:');
      console.log('1. Verify EMAIL_USER and EMAIL_PASS are correct');
      console.log('2. Check if account is locked or suspended');
    }
  }
};

testSMTPConnection();
