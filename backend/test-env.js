require('./config/environment');

console.log('\n📋 Environment Configuration Check:\n');

const checks = [
  { name: 'MONGODB_URI', value: process.env.MONGODB_URI, required: true },
  { name: 'JWT_SECRET', value: process.env.JWT_SECRET, required: true, minLength: 32 },
  { name: 'SESSION_SECRET', value: process.env.SESSION_SECRET, required: true, minLength: 32 },
  { name: 'EMAIL_HOST', value: process.env.EMAIL_HOST, required: true },
  { name: 'EMAIL_PORT', value: process.env.EMAIL_PORT, required: true },
  { name: 'EMAIL_USER', value: process.env.EMAIL_USER, required: true },
  { name: 'EMAIL_PASS', value: process.env.EMAIL_PASS, required: true },
  { name: 'FRONTEND_URL', value: process.env.FRONTEND_URL, required: true },
  { name: 'CORS_ORIGIN', value: process.env.CORS_ORIGIN, required: true },
  { name: 'PORT', value: process.env.PORT, required: false },
];

let errors = 0;

checks.forEach(check => {
  const exists = !!check.value;
  const validLength = !check.minLength || (check.value && check.value.length >= check.minLength);
  const status = exists && validLength ? '✅' : '❌';
  
  if (check.required && (!exists || !validLength)) {
    errors++;
  }
  
  console.log(`${status} ${check.name}: ${exists ? (check.minLength ? `${check.value.length} chars` : 'Set') : 'MISSING'}`);
});

console.log(`\n${errors === 0 ? '✅ All checks passed!' : `❌ ${errors} error(s) found`}\n`);

if (process.env.JWT_SECRET === process.env.SESSION_SECRET) {
  console.log('⚠️  WARNING: JWT_SECRET and SESSION_SECRET should be different!\n');
}

if (errors === 0) {
  console.log('✅ Your .env file is correctly configured!\n');
  console.log('Next steps:');
  console.log('1. Run: npm start');
  console.log('2. Test email: node -e "require(\'./utils/emailService\').testEmailConfiguration().then(console.log)"\n');
}

process.exit(errors);
