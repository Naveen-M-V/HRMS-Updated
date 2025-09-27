// backend/utils/emailService.js
const nodemailer = require('nodemailer');

// Create SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  });
};

// Send login success email
const sendLoginSuccessEmail = async (userEmail, userName, loginTime, ipAddress) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Login Successful - HRMS System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h1>Login Successful</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>You have successfully logged into the HRMS system.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>Login Details:</h3>
              <p><strong>Time:</strong> ${loginTime}</p>
              <p><strong>IP Address:</strong> ${ipAddress}</p>
            </div>
            
            <p>If this wasn't you, please contact your system administrator immediately.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
              <p>This is an automated message from HRMS System</p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Login success email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending login success email:', error);
    return { success: false, error: error.message };
  }
};

// Send certificate expiry notification
const sendCertificateExpiryEmail = async (userEmail, userName, certificateName, expiryDate, daysUntilExpiry) => {
  try {
    const transporter = createTransporter();
    
    const urgencyColor = daysUntilExpiry <= 7 ? '#f44336' : daysUntilExpiry <= 30 ? '#ff9800' : '#2196F3';
    const urgencyText = daysUntilExpiry <= 7 ? 'URGENT' : daysUntilExpiry <= 30 ? 'WARNING' : 'NOTICE';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: userEmail,
      subject: `${urgencyText}: Certificate Expiry Notification - ${certificateName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${urgencyColor}; color: white; padding: 20px; text-align: center;">
            <h1>${urgencyText}: Certificate Expiring</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>This is a reminder that your certificate is expiring soon.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid ${urgencyColor};">
              <h3>Certificate Details:</h3>
              <p><strong>Certificate:</strong> ${certificateName}</p>
              <p><strong>Expiry Date:</strong> ${expiryDate}</p>
              <p><strong>Days Until Expiry:</strong> ${daysUntilExpiry} days</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #ffeaa7;">
              <p><strong>Action Required:</strong> Please renew your certificate before it expires to avoid any disruption in services.</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
              <p>This is an automated message from HRMS System</p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Certificate expiry email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending certificate expiry email:', error);
    return { success: false, error: error.message };
  }
};

// Send notification email (generic)
const sendNotificationEmail = async (userEmail, subject, html) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: userEmail,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Notification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send an email notifying the Super Admin that a new Admin signup requires approval
 * @param {Object} newUser - The user object containing at least firstName, lastName, email
 */
const sendApprovalRequestEmail = async (newUser) => {
  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: superAdminEmail,
      subject: 'New Admin Signup Request - Approval Needed',
      html: `
        <p>Hello Super Admin,</p>
        <p>A new admin account has been created on Talent Shield HRMS and requires your approval to activate.</p>
        <h3>Admin Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${newUser.firstName} ${newUser.lastName}</li>
          <li><strong>Email:</strong> ${newUser.email}</li>
          <li><strong>Signup Date:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>Please review this request at your earliest convenience.</p>
        <p>Thank you,<br/>Talent Shield HRMS Team</p>
      `
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("Admin signup approval email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending admin approval email:", error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('SMTP configuration is valid');
    return { success: true, message: 'SMTP configuration is valid' };
  } catch (error) {
    console.error('SMTP configuration error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendLoginSuccessEmail,
  sendCertificateExpiryEmail,
  sendNotificationEmail,
  sendApprovalRequestEmail,
  testEmailConfiguration
};
