const mongoose = require('mongoose');
require('dotenv').config();

// Import email functions
const { sendNotificationEmail, testEmailConfiguration } = require('./utils/emailService');

console.log('🧪 Testing Profile Deletion Email Functionality\n');

const testProfileDeletionEmail = async () => {
  try {
    console.log('🔧 Testing email configuration...');
    const configTest = await testEmailConfiguration();
    if (!configTest.success) {
      console.log('❌ Email configuration failed:', configTest.error);
      return;
    }
    console.log('✅ Email configuration verified\n');

    // Test profile deletion email
    console.log('📧 Testing profile deletion email...');
    
    const testProfile = {
      firstName: 'Tyler',
      lastName: 'Durden', 
      email: 'tylerdurden2696@gmail.com'
    };

    try {
      const result = await sendNotificationEmail(
        testProfile.email,
        `${testProfile.firstName} ${testProfile.lastName}`,
        'Profile Deletion Notice',
        `Your profile has been deleted from the HRMS system. If you have any questions, please contact your administrator.`,
        'warning'
      );
      
      if (result.success) {
        console.log('✅ Profile deletion email sent successfully!');
        console.log('📧 Email sent to:', testProfile.email);
        console.log('📝 Subject: Profile Deletion Notice');
        console.log('🎯 Type: Warning notification');
      } else {
        console.log('❌ Failed to send email:', result.error);
      }
    } catch (error) {
      console.log('❌ Error sending profile deletion email:', error.message);
    }

    console.log('\n🔍 Email Configuration Details:');
    console.log('📧 EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('🔌 EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('🔐 EMAIL_SECURE:', process.env.EMAIL_SECURE);
    console.log('👤 EMAIL_USER:', process.env.EMAIL_USER);
    console.log('📤 EMAIL_FROM:', process.env.EMAIL_FROM);

    console.log('\n📋 Next Steps:');
    console.log('1. Check the email inbox for tylerdurden2696@gmail.com');
    console.log('2. Look for spam/junk folder if not in inbox');
    console.log('3. Verify SMTP credentials are correct');
    console.log('4. If using Gmail, ensure App Password is used (not regular password)');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testProfileDeletionEmail();
