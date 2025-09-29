// Test script to verify email credentials functionality
const { sendUserCredentialsEmail } = require('./utils/emailService');

async function testCredentialsEmail() {
  console.log('Testing user credentials email...');
  
  try {
    const result = await sendUserCredentialsEmail(
      'test@example.com', // Replace with your email for testing
      'Test User',
      '1234', // Test VTID
      'https://talentshield.co.uk/login'
    );
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('❌ Email failed to send');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCredentialsEmail();
