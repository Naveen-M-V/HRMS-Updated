const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const testEmailComplete = async () => {
  console.log('🔧 Testing Complete Email Configuration...\n');
  
  // Display current configuration
  console.log('📋 Current Email Settings:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not Set');
  console.log('');

  // Create transporter
  const transporter = nodemailer.createTransport({
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
    // Test 1: Verify SMTP connection
    console.log('🔍 Test 1: Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful\n');

    // Test 2: Generate verification token
    console.log('🔍 Test 2: Generating verification token...');
    const testUser = {
      _id: 'test123',
      email: 'sanjaymaheshwaran0124@gmail.com',
      firstName: 'Sanjay',
      lastName: 'Maheshwaran'
    };
    
    const verificationToken = jwt.sign(
      { userId: testUser._id, email: testUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('✅ Verification token generated\n');

    // Test 3: Create verification link
    const backendUrl = process.env.API_PUBLIC_URL || process.env.BACKEND_URL || 'https://talentshield.co.uk';
    const verificationLink = `${backendUrl}/api/auth/verify-email?token=${verificationToken}`;
    console.log('🔍 Test 3: Verification link created:');
    console.log(verificationLink);
    console.log('');

    // Test 4: Send verification email
    console.log('🔍 Test 4: Sending verification email...');
    
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Talent Shield HRMS</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Talent Shield HRMS</h1>
                <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Email Verification Required</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hello ${testUser.firstName}!</h2>
                
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Welcome to Talent Shield HRMS! To complete your account setup and access your dashboard, please verify your email address by clicking the button below.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${verificationLink}" style="color: #10b981; word-break: break-all;">${verificationLink}</a>
                </p>
                
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                        <strong>Security Notice:</strong> This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                    © 2024 Talent Shield HRMS. All rights reserved.<br>
                    If you need assistance, please contact your administrator.
                </p>
            </div>
        </div>
    </body>
    </html>`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: testUser.email,
      subject: 'Verify Your Email - Talent Shield HRMS',
      html: emailHtml,
      text: `Hello ${testUser.firstName}!\n\nWelcome to Talent Shield HRMS! Please verify your email address by clicking this link:\n\n${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\nTalent Shield HRMS Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Email sent to:', testUser.email);
    console.log('');
    
    console.log('🎉 All tests passed! Email configuration is working correctly.');
    console.log('📱 Check your email inbox and spam folder.');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('');
    console.log('🔧 Troubleshooting tips:');
    console.log('1. Check if Gmail App Password is correct (16 characters)');
    console.log('2. Ensure 2-Step Verification is enabled on Gmail');
    console.log('3. Verify EMAIL_PASS in .env file');
    console.log('4. Check if "Less secure app access" is disabled (should be)');
  }
};

testEmailComplete();
