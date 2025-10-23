const nodemailer = require('nodemailer');

console.log('🔧 Testing SMTP Connection...');

const transporter = nodemailer.createTransport({
  host: 'mail.talentshield.co.uk',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'notifications@talentshield.co.uk',
    pass: 'Admin@2025' // Replace with actual password
  },
  tls: {
    rejectUnauthorized: false // For testing, remove in production
  }
});

// Verify connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Connection failed:', error);
  } else {
    console.log('✅ Server is ready to send emails');
    
    // Send test email
    transporter.sendMail({
      from: '"Talent Shield" <notifications@talentshield.co.uk>',
      to: 'thaya.govzig2101@gmail.com',
      subject: 'Test from Node.js',
      text: 'This is a test email from the Node.js application'
    }, (err, info) => {
      if (err) {
        console.log('❌ Email send failed:', err);
      } else {
        console.log('✅ Email sent:', info.messageId);
      }
    });
  }
});