require('dotenv').config();

const PORT = process.env.PORT || 5000;
const baseUrl = process.env.API_PUBLIC_URL || process.env.BACKEND_URL || `http://localhost:${PORT}`;
const testToken = 'test-token-123';
const approveUrl = `${baseUrl}/api/auth/approve-admin?token=${encodeURIComponent(testToken)}`;

console.log('Environment variables:');
console.log('API_PUBLIC_URL:', process.env.API_PUBLIC_URL);
console.log('BACKEND_URL:', process.env.BACKEND_URL);
console.log('PORT:', PORT);
console.log('');
console.log('Generated approval URL:');
console.log(approveUrl);
