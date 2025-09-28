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

// Send email verification link
const sendVerificationEmail = async (userEmail, verifyUrl, userName = 'User') => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: 'Verify your email - HRMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center;">
            <h1>Email Verification</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Thanks for signing up. Please verify your email to activate your account.</p>
            <div style="text-align:center; margin: 24px 0;">
              <a href="${verifyUrl}" style="background:#2196F3;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Verify Email</a>
            </div>
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color:#555;">${verifyUrl}</p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </div>
        </div>
      `
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send user account credentials email
const sendUserCredentialsEmail = async (userEmail, userName, password, loginUrl) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: 'Welcome to Talent Shield HRMS - Your Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to Talent Shield HRMS</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Your account has been successfully created in the Talent Shield HRMS system. You can now access your profile and certificates.</p>
            
            <div style="background-color:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981;">
              <h3 style="margin-top:0;color:#10b981;">Your Login Credentials</h3>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Password:</strong> <span style="background:#f3f4f6;padding:8px 12px;border-radius:4px;font-family:monospace;font-size:16px;font-weight:bold;color:#1f2937;">${password}</span></p>
            </div>
            
            <div style="text-align:center; margin: 24px 0;">
              <a href="${loginUrl}" style="background:#10b981;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Login to Your Account</a>
            </div>
            
            <div style="background-color:#fef3c7;padding:15px;border-radius:6px;margin:20px 0;">
              <p style="margin:0;color:#92400e;"><strong>Important:</strong> Please keep your password secure and do not share it with anyone. You can change your password after logging in for the first time.</p>
            </div>
            
            <p>If you have any questions or need assistance, please contact your administrator.</p>
            <p>Best regards,<br>Talent Shield HRMS Team</p>
          </div>
        </div>
      `
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('User credentials email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending user credentials email:', error);
    return { success: false, error: error.message };
  }
};

// Send super-admin approval request for admin signup
const sendAdminApprovalRequestEmail = async (superAdminEmail, applicantName, applicantEmail, approveUrl) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: superAdminEmail,
      subject: 'Admin Signup Approval Request - HRMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #ff9800; color: white; padding: 20px; text-align: center;">
            <h1>Approval Request</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>A new admin signup needs your approval.</p>
            <div style="background-color:#fff;padding:15px;border-radius:6px;margin:16px 0;">
              <p><strong>Name:</strong> ${applicantName}</p>
              <p><strong>Email:</strong> ${applicantEmail}</p>
            </div>
            <div style="text-align:center; margin: 24px 0;">
              <a href="${approveUrl}" style="background:#4CAF50;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block;">Approve Admin</a>
            </div>
            <p>If you did not expect this request, please ignore.</p>
          </div>
        </div>
      `
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('Admin approval request email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending admin approval email:', error);
    return { success: false, error: error.message };
  }
};

// Send login success email
const sendLoginSuccessEmail = async (userEmail, userName, loginTime, ipAddress) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
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
      from: process.env.EMAIL_FROM,
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

// Send general notification email
const sendNotificationEmail = async (userEmail, userName, subject, message, type = 'info') => {
  try {
    const transporter = createTransporter();
    
    const typeColors = {
      success: '#4CAF50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196F3'
    };
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `HRMS Notification: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${typeColors[type]}; color: white; padding: 20px; text-align: center;">
            <h1>HRMS Notification</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>${subject}</h3>
              <p>${message}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
              <p>This is an automated message from HRMS System</p>
              <p>Sent on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Notification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending notification email:', error);
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
  testEmailConfiguration,
  sendVerificationEmail,
  sendAdminApprovalRequestEmail,
  sendUserCredentialsEmail
};
