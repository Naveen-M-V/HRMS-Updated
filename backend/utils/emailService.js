const nodemailer = require('nodemailer');

// Get email sender address
const getEmailFrom = () => process.env.EMAIL_FROM || process.env.EMAIL_USER;

// Create SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
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
      from: getEmailFrom(),
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
      from: getEmailFrom(),
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
      from: getEmailFrom(),
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
      from: getEmailFrom(),
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
      from: getEmailFrom(),
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
      from: getEmailFrom(),
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

// Send credentials to admin who created the user
const sendAdminNewUserCredentialsEmail = async (adminEmail, newUserName, newUserEmail, newUserPassword, loginUrl) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: getEmailFrom(),
      to: adminEmail,
      subject: 'New User Created - Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1>New User Created Successfully</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hello Admin,</p>
            <p>You have successfully created a new user account in the Talent Shield HRMS system.</p>
            
            <div style="background-color:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #3b82f6;">
              <h3 style="margin-top:0;color:#3b82f6;">New User Details</h3>
              <p><strong>Name:</strong> ${newUserName}</p>
              <p><strong>Email:</strong> ${newUserEmail}</p>
              <p><strong>Temporary Password:</strong> <span style="background:#f3f4f6;padding:8px 12px;border-radius:4px;font-family:monospace;font-size:16px;font-weight:bold;color:#1f2937;">${newUserPassword}</span></p>
            </div>
            
            <div style="background-color:#fef3c7;padding:15px;border-radius:6px;margin:20px 0;">
              <p style="margin:0;color:#92400e;"><strong>Important:</strong> Please share these credentials securely with the new user. They can change their password after their first login.</p>
            </div>
            
            <div style="text-align:center; margin: 24px 0;">
              <a href="${loginUrl}" style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">View System</a>
            </div>
            
            <p>Best regards,<br>Talent Shield HRMS Team</p>
          </div>
        </div>
      `
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('Admin new user credentials email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending admin new user credentials email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email to newly created user
const sendWelcomeEmailToNewUser = async (userEmail, userName, loginUrl) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: getEmailFrom(),
      to: userEmail,
      subject: 'Welcome to Talent Shield HRMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to Talent Shield HRMS</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Your account has been created in the Talent Shield HRMS system by your administrator.</p>
            
            <div style="background-color:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981;">
              <h3 style="margin-top:0;color:#10b981;">What's Next?</h3>
              <p>Your administrator will provide you with your login credentials shortly. Once you receive them, you can access the system using the link below.</p>
            </div>
            
            <div style="text-align:center; margin: 24px 0;">
              <a href="${loginUrl}" style="background:#10b981;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Go to Login Page</a>
            </div>
            
            <div style="background-color:#dbeafe;padding:15px;border-radius:6px;margin:20px 0;">
              <p style="margin:0;color:#1e40af;"><strong>Security Tip:</strong> When you receive your credentials, please change your password immediately after your first login.</p>
            </div>
            
            <p>If you have any questions, please contact your system administrator.</p>
            <p>Best regards,<br>Talent Shield HRMS Team</p>
          </div>
        </div>
      `
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to new user:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending welcome email to new user:', error);
    return { success: false, error: error.message };
  }
};

// ===== REUSABLE CORE FUNCTION =====
// Generic sendEmail function for all email notifications
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: getEmailFrom(),
      to,
      subject,
      html
    };
    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

// ===== PROFILE EVENT EMAILS =====

// 1. Send welcome email when Profile is created
// CALL THIS IN: Profile creation endpoint (e.g., POST /api/profiles)
const sendProfileCreationEmail = async (profileData, userData = null) => {
  const { email, firstName, lastName, vtid } = profileData;
  const fullName = `${firstName} ${lastName}`;
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000/login';

  let credentialsSection = '';
  if (userData && userData.email && userData.password) {
    credentialsSection = `
      <div style="background-color:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981;">
        <h3 style="margin-top:0;color:#10b981;">Your Login Credentials</h3>
        <p><strong>Email:</strong> ${userData.email}</p>
        <p><strong>Password:</strong> <span style="background:#f3f4f6;padding:8px 12px;border-radius:4px;font-family:monospace;font-size:16px;font-weight:bold;color:#1f2937;">${userData.password}</span></p>
        <p><strong>VTID:</strong> ${vtid}</p>
      </div>
      <div style="background-color:#fef3c7;padding:15px;border-radius:6px;margin:20px 0;">
        <p style="margin:0;color:#92400e;"><strong>Security:</strong> Keep your password secure. Change it after your first login.</p>
      </div>
    `;
  } else {
    credentialsSection = `
      <div style="background-color:#dbeafe;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #3b82f6;">
        <h3 style="margin-top:0;color:#3b82f6;">Your Profile Information</h3>
        <p><strong>VTID:</strong> ${vtid}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p style="margin-top:15px;color:#1e40af;">Your login credentials will be provided by your administrator.</p>
      </div>
    `;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin:0;font-size:28px;">Welcome to Talent Shield HRMS</h1>
      </div>
      <div style="padding: 30px 20px; background-color: #f9fafb;">
        <p style="font-size:16px;color:#374151;">Hello <strong>${fullName}</strong>,</p>
        <p style="color:#6b7280;">Your profile has been successfully created in the Talent Shield HRMS system. Welcome aboard!</p>
        
        ${credentialsSection}
        
        <div style="text-align:center; margin: 30px 0;">
          <a href="${loginUrl}" style="background:#10b981;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;font-size:16px;">Login to Your Account</a>
        </div>
        
        <div style="background-color:#f3f4f6;padding:20px;border-radius:6px;margin:20px 0;">
          <p style="margin:0;color:#4b5563;font-size:14px;"><strong>Need help?</strong> Contact your system administrator for assistance.</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin:5px 0;">This is an automated message from Talent Shield HRMS</p>
          <p style="margin:5px 0;">© ${new Date().getFullYear()} Talent Shield. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Talent Shield HRMS - Profile Created',
    html
  });
};

// 2. Send email when Profile is updated
// CALL THIS IN: Profile update endpoint (e.g., PUT /api/profiles/:id)
const sendProfileUpdateEmail = async (profileData, updatedFields) => {
  const { email, firstName, lastName, vtid } = profileData;
  const fullName = `${firstName} ${lastName}`;

  const fieldMappings = {
    firstName: 'First Name',
    lastName: 'Last Name',
    mobile: 'Mobile Number',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    jobRole: 'Job Role',
    jobTitle: 'Job Title',
    jobLevel: 'Job Level',
    department: 'Department',
    startDate: 'Start Date',
    status: 'Status',
    nationality: 'Nationality',
    emergencyContact: 'Emergency Contact',
    address: 'Address'
  };

  let fieldsHtml = '';
  Object.keys(updatedFields).forEach(field => {
    const displayName = fieldMappings[field] || field;
    let value = updatedFields[field];
    
    if (typeof value === 'object' && value !== null) {
      value = JSON.stringify(value, null, 2);
    }
    
    fieldsHtml += `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">${displayName}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${value}</td>
      </tr>
    `;
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin:0;font-size:28px;">Profile Updated</h1>
      </div>
      <div style="padding: 30px 20px; background-color: #f9fafb;">
        <p style="font-size:16px;color:#374151;">Hello <strong>${fullName}</strong>,</p>
        <p style="color:#6b7280;">Your profile information has been updated successfully.</p>
        
        <div style="background-color:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #f59e0b;">
          <h3 style="margin-top:0;color:#f59e0b;">Updated Fields</h3>
          <table style="width:100%;border-collapse:collapse;">
            ${fieldsHtml}
          </table>
        </div>
        
        <div style="background-color:#dbeafe;padding:15px;border-radius:6px;margin:20px 0;">
          <p style="margin:0;color:#1e40af;"><strong>VTID:</strong> ${vtid}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin:5px 0;">This is an automated message from Talent Shield HRMS</p>
          <p style="margin:5px 0;">Sent on: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Profile Updated - Talent Shield HRMS',
    html
  });
};

// 3. Send email when Profile is deleted
// CALL THIS IN: Profile deletion endpoint (e.g., DELETE /api/profiles/:id)
const sendProfileDeletionEmail = async (profileData) => {
  const { email, firstName, lastName, vtid } = profileData;
  const fullName = `${firstName} ${lastName}`;
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@talentshield.com';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin:0;font-size:28px;">Profile Deleted</h1>
      </div>
      <div style="padding: 30px 20px; background-color: #f9fafb;">
        <p style="font-size:16px;color:#374151;">Hello <strong>${fullName}</strong>,</p>
        <p style="color:#6b7280;">Your profile has been removed from the Talent Shield HRMS system.</p>
        
        <div style="background-color:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ef4444;">
          <h3 style="margin-top:0;color:#ef4444;">Profile Details</h3>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>VTID:</strong> ${vtid}</p>
          <p><strong>Deletion Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="background-color:#fef3c7;padding:15px;border-radius:6px;margin:20px 0;">
          <p style="margin:0;color:#92400e;">If this was done in error, please contact your administrator immediately at <a href="mailto:${supportEmail}" style="color:#b45309;">${supportEmail}</a></p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin:5px 0;">This is an automated message from Talent Shield HRMS</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Profile Deletion Notification - Talent Shield HRMS',
    html
  });
};

// ===== CERTIFICATE EVENT EMAILS =====

// 4. Send email when Certificate is added
// CALL THIS IN: Certificate creation endpoint (e.g., POST /api/certificates)
const sendCertificateAddedEmail = async (profileData, certificateData) => {
  const { email, firstName, lastName, vtid } = profileData;
  const { certificate, category, jobRole, expiryDate } = certificateData;
  const fullName = `${firstName} ${lastName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin:0;font-size:28px;">✓ Certificate Added</h1>
      </div>
      <div style="padding: 30px 20px; background-color: #f9fafb;">
        <p style="font-size:16px;color:#374151;">Hello <strong>${fullName}</strong>,</p>
        <p style="color:#6b7280;">A new certificate has been added to your profile.</p>
        
        <div style="background-color:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981;">
          <h3 style="margin-top:0;color:#10b981;">Certificate Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Certificate Name</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${certificate}</td>
            </tr>
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Category</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${category}</td>
            </tr>
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Job Role</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${jobRole}</td>
            </tr>
            <tr>
              <td style="padding:10px;color:#374151;font-weight:600;">Expiry Date</td>
              <td style="padding:10px;color:#6b7280;">${expiryDate}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color:#dbeafe;padding:15px;border-radius:6px;margin:20px 0;">
          <p style="margin:0;color:#1e40af;"><strong>VTID:</strong> ${vtid}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin:5px 0;">This is an automated message from Talent Shield HRMS</p>
          <p style="margin:5px 0;">Added on: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Certificate Added: ${certificate}`,
    html
  });
};

// 5. Send email when Certificate is deleted
// CALL THIS IN: Certificate deletion endpoint (e.g., DELETE /api/certificates/:id)
const sendCertificateDeletedEmail = async (profileData, certificateData) => {
  const { email, firstName, lastName, vtid } = profileData;
  const { certificate, category, jobRole, expiryDate } = certificateData;
  const fullName = `${firstName} ${lastName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin:0;font-size:28px;">Certificate Removed</h1>
      </div>
      <div style="padding: 30px 20px; background-color: #f9fafb;">
        <p style="font-size:16px;color:#374151;">Hello <strong>${fullName}</strong>,</p>
        <p style="color:#6b7280;">A certificate has been removed from your profile.</p>
        
        <div style="background-color:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ef4444;">
          <h3 style="margin-top:0;color:#ef4444;">Removed Certificate Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Certificate Name</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${certificate}</td>
            </tr>
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Category</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${category}</td>
            </tr>
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Job Role</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${jobRole}</td>
            </tr>
            <tr>
              <td style="padding:10px;color:#374151;font-weight:600;">Expiry Date</td>
              <td style="padding:10px;color:#6b7280;">${expiryDate}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color:#fef3c7;padding:15px;border-radius:6px;margin:20px 0;">
          <p style="margin:0;color:#92400e;"><strong>Note:</strong> If this removal was done in error, please contact your administrator.</p>
        </div>
        
        <div style="background-color:#dbeafe;padding:15px;border-radius:6px;margin:20px 0;">
          <p style="margin:0;color:#1e40af;"><strong>VTID:</strong> ${vtid}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin:5px 0;">This is an automated message from Talent Shield HRMS</p>
          <p style="margin:5px 0;">Removed on: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Certificate Removed: ${certificate}`,
    html
  });
};

// 6. Send email reminder before certificate expiry
// CALL THIS IN: Scheduled job/cron task (e.g., daily check for upcoming expirations)
const sendCertificateExpiryReminderEmail = async (profileData, certificateData, daysUntilExpiry) => {
  const { email, firstName, lastName, vtid } = profileData;
  const { certificate, category, jobRole, expiryDate } = certificateData;
  const fullName = `${firstName} ${lastName}`;

  const urgencyColor = daysUntilExpiry <= 7 ? '#ef4444' : daysUntilExpiry <= 30 ? '#f59e0b' : '#3b82f6';
  const urgencyText = daysUntilExpiry <= 7 ? 'URGENT' : daysUntilExpiry <= 30 ? 'WARNING' : 'REMINDER';
  const urgencyIcon = daysUntilExpiry <= 7 ? '⚠️' : daysUntilExpiry <= 30 ? '⏰' : '📅';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: ${urgencyColor}; color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin:0;font-size:28px;">${urgencyIcon} ${urgencyText}: Certificate Expiring Soon</h1>
      </div>
      <div style="padding: 30px 20px; background-color: #f9fafb;">
        <p style="font-size:16px;color:#374151;">Hello <strong>${fullName}</strong>,</p>
        <p style="color:#6b7280;">Your certificate is expiring in <strong style="color:${urgencyColor};">${daysUntilExpiry} days</strong>.</p>
        
        <div style="background-color:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid ${urgencyColor};">
          <h3 style="margin-top:0;color:${urgencyColor};">Certificate Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Certificate Name</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${certificate}</td>
            </tr>
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Category</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${category}</td>
            </tr>
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Job Role</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${jobRole}</td>
            </tr>
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Expiry Date</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:${urgencyColor};font-weight:bold;">${expiryDate}</td>
            </tr>
            <tr>
              <td style="padding:10px;color:#374151;font-weight:600;">Days Remaining</td>
              <td style="padding:10px;color:${urgencyColor};font-weight:bold;font-size:18px;">${daysUntilExpiry} days</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color:#fef3c7;padding:20px;border-radius:6px;margin:20px 0;border-left:4px solid #f59e0b;">
          <p style="margin:0;color:#92400e;"><strong>⚡ Action Required:</strong> Please renew your certificate before it expires to maintain compliance and avoid any service disruption.</p>
        </div>
        
        <div style="background-color:#dbeafe;padding:15px;border-radius:6px;margin:20px 0;">
          <p style="margin:0;color:#1e40af;"><strong>VTID:</strong> ${vtid}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin:5px 0;">This is an automated reminder from Talent Shield HRMS</p>
          <p style="margin:5px 0;">Sent on: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `${urgencyText}: Certificate Expiring in ${daysUntilExpiry} Days - ${certificate}`,
    html
  });
};

// 7. Send email after certificate has expired
// CALL THIS IN: Scheduled job/cron task (e.g., daily check for expired certificates)
const sendCertificateExpiredEmail = async (profileData, certificateData) => {
  const { email, firstName, lastName, vtid } = profileData;
  const { certificate, category, jobRole, expiryDate } = certificateData;
  const fullName = `${firstName} ${lastName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px 20px; text-align: center;">
        <h1 style="margin:0;font-size:28px;">🚨 URGENT: Certificate Expired</h1>
      </div>
      <div style="padding: 30px 20px; background-color: #f9fafb;">
        <p style="font-size:16px;color:#374151;">Hello <strong>${fullName}</strong>,</p>
        <p style="color:#dc2626;font-weight:600;">Your certificate has <strong>EXPIRED</strong>. Immediate action is required.</p>
        
        <div style="background-color:#fff;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #dc2626;">
          <h3 style="margin-top:0;color:#dc2626;">Expired Certificate Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Certificate Name</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${certificate}</td>
            </tr>
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Category</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${category}</td>
            </tr>
            <tr>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#374151;font-weight:600;">Job Role</td>
              <td style="padding:10px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${jobRole}</td>
            </tr>
            <tr>
              <td style="padding:10px;color:#374151;font-weight:600;">Expired On</td>
              <td style="padding:10px;color:#dc2626;font-weight:bold;">${expiryDate}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color:#fee2e2;padding:20px;border-radius:6px;margin:20px 0;border:2px solid #dc2626;">
          <p style="margin:0;color:#991b1b;font-weight:600;"><strong>⚠️ CRITICAL ACTION REQUIRED:</strong></p>
          <p style="color:#7f1d1d;margin-top:10px;">This certificate has expired and you may not be compliant. Please renew it immediately to avoid:</p>
          <ul style="color:#7f1d1d;margin:10px 0;padding-left:20px;">
            <li>Service disruption</li>
            <li>Compliance violations</li>
            <li>Access restrictions</li>
          </ul>
          <p style="color:#7f1d1d;margin-top:10px;"><strong>Contact your administrator or training coordinator immediately.</strong></p>
        </div>
        
        <div style="background-color:#dbeafe;padding:15px;border-radius:6px;margin:20px 0;">
          <p style="margin:0;color:#1e40af;"><strong>VTID:</strong> ${vtid}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin:5px 0;">This is an automated alert from Talent Shield HRMS</p>
          <p style="margin:5px 0;">Sent on: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `🚨 URGENT: Certificate EXPIRED - ${certificate}`,
    html
  });
};

module.exports = {
  sendEmail,
  sendLoginSuccessEmail,
  sendCertificateExpiryEmail,
  sendNotificationEmail,
  testEmailConfiguration,
  sendVerificationEmail,
  sendAdminApprovalRequestEmail,
  sendUserCredentialsEmail,
  sendAdminNewUserCredentialsEmail,
  sendWelcomeEmailToNewUser,
  sendProfileCreationEmail,
  sendProfileUpdateEmail,
  sendProfileDeletionEmail,
  sendCertificateAddedEmail,
  sendCertificateDeletedEmail,
  sendCertificateExpiryReminderEmail,
  sendCertificateExpiredEmail
};
