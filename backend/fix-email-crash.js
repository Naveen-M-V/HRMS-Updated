#!/usr/bin/env node

/**
 * Emergency Fix Script for Email Authentication Crash
 * This script updates the server to handle email failures gracefully
 * Run this on the production server to fix the crash issue
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying emergency email fix...\n');

// Step 1: Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found. Creating one with safe defaults...');
  const envContent = `# HRMS Backend Environment Configuration
NODE_ENV=production
PORT=5003

# Database
MONGODB_URI=mongodb+srv://hrms:7WA1i7BAB1XwQQRh@hrms.ppzwrf0.mongodb.net/?retryWrites=true&w=majority&appName=hrms

# JWT
JWT_SECRET=hrms-jwt-secret-2024-secure-key
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=hrms-session-secret-2024-secure-key

# Email (DISABLED FOR NOW)
MOCK_EMAIL_SENDING=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=HRMS System <your-email@gmail.com>

# CORS
CORS_ORIGIN=https://talentshield.co.uk

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads/
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with email mocking enabled\n');
} else {
  // Step 2: Update existing .env to enable email mocking
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if MOCK_EMAIL_SENDING exists
  if (!envContent.includes('MOCK_EMAIL_SENDING')) {
    envContent = '# Email Mocking (Temporary Fix)\nMOCK_EMAIL_SENDING=true\n\n' + envContent;
    console.log('✅ Added MOCK_EMAIL_SENDING=true to .env\n');
  } else {
    // Update existing value
    envContent = envContent.replace(/MOCK_EMAIL_SENDING=.*/g, 'MOCK_EMAIL_SENDING=true');
    console.log('✅ Updated MOCK_EMAIL_SENDING to true\n');
  }
  
  fs.writeFileSync(envPath, envContent);
}

// Step 3: Create a wrapper for the email service if it doesn't exist
const emailServicePath = path.join(__dirname, 'utils', 'emailService.js');
const emailServiceBackupPath = path.join(__dirname, 'utils', 'emailService.original.js');

if (fs.existsSync(emailServicePath)) {
  // Backup original file
  if (!fs.existsSync(emailServiceBackupPath)) {
    fs.copyFileSync(emailServicePath, emailServiceBackupPath);
    console.log('✅ Backed up original emailService.js\n');
  }
  
  // Check if the file already has our safety wrapper
  const emailContent = fs.readFileSync(emailServicePath, 'utf8');
  if (!emailContent.includes('SAFETY_WRAPPER_APPLIED')) {
    // Add safety wrapper at the beginning
    const safetyWrapper = `// SAFETY_WRAPPER_APPLIED - Emergency fix for email crashes
const originalModule = (() => {
${emailContent}
})();

// Wrap all exported functions to handle errors gracefully
const wrapFunction = (fn) => {
  return async (...args) => {
    try {
      // Check if email should be mocked
      if (process.env.MOCK_EMAIL_SENDING === 'true') {
        console.log('Email mocked:', fn.name, args[0]);
        return { success: true, messageId: 'MOCK-' + Date.now(), mocked: true };
      }
      return await fn(...args);
    } catch (error) {
      console.error('Email error (non-critical):', error.message);
      return { success: false, error: error.message, mocked: false };
    }
  };
};

// Export wrapped functions
const wrappedExports = {};
for (const key in originalModule) {
  if (typeof originalModule[key] === 'function') {
    wrappedExports[key] = wrapFunction(originalModule[key]);
  } else {
    wrappedExports[key] = originalModule[key];
  }
}

module.exports = wrappedExports;
`;
    
    fs.writeFileSync(emailServicePath, safetyWrapper);
    console.log('✅ Applied safety wrapper to emailService.js\n');
  } else {
    console.log('ℹ️  Safety wrapper already applied to emailService.js\n');
  }
}

console.log('📋 Next Steps:');
console.log('1. Restart the server with: pm2 restart hrms');
console.log('2. Monitor logs with: pm2 logs hrms --lines 50');
console.log('3. Test the application to ensure it works without email');
console.log('\n📧 To enable real emails later:');
console.log('1. Update EMAIL_USER and EMAIL_PASS in .env with valid Gmail credentials');
console.log('2. Set MOCK_EMAIL_SENDING=false in .env');
console.log('3. Restart the server again');
console.log('\n✅ Emergency fix complete!');
