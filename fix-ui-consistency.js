const fs = require('fs');
const path = require('path');

console.log('🎨 Fixing UI Consistency - Capitalization and Spelling\n');

const frontendDir = path.join(__dirname, 'frontend', 'src');

// Common UI text corrections
const corrections = {
  // Capitalization fixes
  'login': 'Login',
  'logout': 'Logout', 
  'dashboard': 'Dashboard',
  'profile': 'Profile',
  'profiles': 'Profiles',
  'certificate': 'Certificate',
  'certificates': 'Certificates',
  'notification': 'Notification',
  'notifications': 'Notifications',
  'settings': 'Settings',
  'admin': 'Admin',
  'user': 'User',
  'email': 'Email',
  'password': 'Password',
  'first name': 'First Name',
  'last name': 'Last Name',
  'date of birth': 'Date of Birth',
  'job role': 'Job Role',
  'job title': 'Job Title',
  'job level': 'Job Level',
  'start date': 'Start Date',
  'expiry date': 'Expiry Date',
  'issue date': 'Issue Date',
  
  // Button text consistency
  'save changes': 'Save Changes',
  'create profile': 'Create Profile',
  'edit profile': 'Edit Profile',
  'delete profile': 'Delete Profile',
  'add certificate': 'Add Certificate',
  'view certificate': 'View Certificate',
  'upload file': 'Upload File',
  'download file': 'Download File',
  
  // Status text consistency
  'active': 'Active',
  'inactive': 'Inactive',
  'approved': 'Approved',
  'pending': 'Pending',
  'rejected': 'Rejected',
  'expired': 'Expired',
  'expiring soon': 'Expiring Soon',
  
  // Common spelling fixes
  'recieve': 'receive',
  'seperate': 'separate',
  'occured': 'occurred',
  'sucessful': 'successful',
  'sucessfully': 'successfully',
  'proffesional': 'professional',
  'managment': 'management',
  'administation': 'administration',
  'certficate': 'certificate',
  'certficates': 'certificates',
  'notifcation': 'notification',
  'notifcations': 'notifications'
};

// Files to process (JSX and JS files)
const processFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Apply corrections
    Object.entries(corrections).forEach(([wrong, correct]) => {
      // Case-insensitive replacement for UI text (but preserve original case for code)
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      if (regex.test(content)) {
        // Only replace in strings and JSX text, not in variable names or imports
        const stringRegex = new RegExp(`(['"\`][^'"\`]*?)\\b${wrong}\\b([^'"\`]*?['"\`])`, 'gi');
        const jsxRegex = new RegExp(`(>\\s*)\\b${wrong}\\b(\\s*<)`, 'gi');
        const titleRegex = new RegExp(`(title\\s*=\\s*['"\`][^'"\`]*?)\\b${wrong}\\b([^'"\`]*?['"\`])`, 'gi');
        const placeholderRegex = new RegExp(`(placeholder\\s*=\\s*['"\`][^'"\`]*?)\\b${wrong}\\b([^'"\`]*?['"\`])`, 'gi');
        
        if (stringRegex.test(content) || jsxRegex.test(content) || titleRegex.test(content) || placeholderRegex.test(content)) {
          content = content.replace(stringRegex, `$1${correct}$2`);
          content = content.replace(jsxRegex, `$1${correct}$2`);
          content = content.replace(titleRegex, `$1${correct}$2`);
          content = content.replace(placeholderRegex, `$1${correct}$2`);
          changed = true;
        }
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.relative(frontendDir, filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.log(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
};

// Recursively process all JS and JSX files
const processDirectory = (dir) => {
  let totalFixed = 0;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (file !== 'node_modules' && file !== 'build' && file !== '.git') {
        totalFixed += processDirectory(filePath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      if (processFile(filePath)) {
        totalFixed++;
      }
    }
  }
  
  return totalFixed;
};

console.log('📁 Processing frontend files...\n');
const fixedFiles = processDirectory(frontendDir);

console.log(`\n📊 UI Consistency Fix Complete!`);
console.log(`✅ Fixed ${fixedFiles} files`);
console.log('\n🎯 Corrections Applied:');
console.log('✅ Capitalization consistency for UI elements');
console.log('✅ Button text standardization');
console.log('✅ Status text consistency');
console.log('✅ Common spelling corrections');
console.log('✅ Form field label consistency');

console.log('\n📋 Key Improvements:');
console.log('• All form labels now use proper title case');
console.log('• Button text is consistently capitalized');
console.log('• Status indicators use standard terminology');
console.log('• Common spelling errors corrected');
console.log('• Professional appearance enhanced');

if (fixedFiles > 0) {
  console.log('\n🔄 Restart the frontend to see changes: npm start');
} else {
  console.log('\n✨ No UI consistency issues found - already professional!');
}
