# .env Configuration Checklist & Additional Issues

## 📋 .env File Verification Checklist

Compare your `.env` file with this checklist. All items marked **REQUIRED** must be configured:

### ✅ Required Variables

```env
# Database - REQUIRED
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```
- [ ] Configured with your MongoDB connection string
- [ ] Database user has readWrite permissions
- [ ] IP whitelist includes your server IP (or 0.0.0.0/0 for dev)

---

```env
# Server - REQUIRED
PORT=5004
NODE_ENV=development
```
- [ ] Port is set (default 5004 is fine)
- [ ] NODE_ENV is set to `development` or `production`

---

```env
# JWT & Session - REQUIRED
JWT_SECRET=your-secure-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=24h
SESSION_SECRET=your-secure-session-secret-minimum-32-characters
```
- [ ] JWT_SECRET is at least 32 characters long
- [ ] SESSION_SECRET is at least 32 characters long
- [ ] Both secrets are different from each other
- [ ] **WARNING:** Do NOT use the template values - generate unique secrets!

**Generate secure secrets with:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

```env
# Email - REQUIRED
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=HRMS System <your-email@gmail.com>
```
- [ ] EMAIL_HOST is correct (smtp.gmail.com for Gmail)
- [ ] EMAIL_PORT is 587 (or 465 if using EMAIL_SECURE=true)
- [ ] EMAIL_SECURE matches your port (false for 587, true for 465)
- [ ] EMAIL_USER is your Gmail address
- [ ] EMAIL_PASS is your **App Password** (NOT your regular Gmail password)
- [ ] EMAIL_FROM matches your email

**For Gmail App Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Enable 2FA if not already enabled
3. Create App Password for "Mail"
4. Use the 16-character password (format: xxxx xxxx xxxx xxxx)

---

```env
# Frontend URL - REQUIRED
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```
- [ ] FRONTEND_URL matches your actual frontend URL
- [ ] CORS_ORIGIN matches FRONTEND_URL
- [ ] Update both for production deployment

---

```env
# Optional but Recommended
SUPER_ADMIN_EMAIL=admin@yourdomain.com
API_PUBLIC_URL=http://localhost:5004
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
```
- [ ] SUPER_ADMIN_EMAIL is set for admin notifications
- [ ] API_PUBLIC_URL matches your backend URL

---

## 🚨 Critical Issue Found: Duplicate Certificate Model

**Issue:** There are TWO Certificate model definitions:
1. `backend/server.js` (line 413) - **MAIN** - Full schema with all fields
2. `backend/models/Certificate.js` - **DUPLICATE** - Minimal schema (outdated)

**Problem:** This can cause schema conflicts and unpredictable behavior.

### Fix Required:

**Option 1 (Recommended):** Delete the duplicate file
```bash
# From backend folder:
rm models/Certificate.js
# or on Windows:
del models\Certificate.js
```

**Option 2:** Use the models file and delete from server.js
- Move the complete schema from server.js to models/Certificate.js
- Import it in server.js instead of defining inline

**Recommendation:** Delete `models/Certificate.js` since server.js has the complete, up-to-date schema.

---

## 🔍 Other Potential Issues to Check

### 1. Check if server starts without errors:

```bash
cd backend
npm start
```

**Look for:**
- ✅ "Loaded environment: development from .env"
- ✅ "All required environment variables are present"
- ✅ "Connected to MongoDB"
- ✅ "Server running on port 5004"
- ✅ "Starting email notification schedulers..."

**Red flags:**
- ❌ "Missing required environment variables"
- ❌ MongoDB connection errors
- ❌ "Model already defined" errors

---

### 2. Verify Email Configuration:

```bash
cd backend
node -e "require('./utils/emailService').testEmailConfiguration().then(console.log)"
```

**Expected output:**
```
✅ Email configuration test successful
{ success: true, messageId: '<...>' }
```

**If it fails:**
- Check EMAIL_USER and EMAIL_PASS in .env
- Verify you're using App Password (not regular password)
- Check if Gmail is blocking the connection

---

### 3. Common .env Mistakes:

❌ **Wrong:**
```env
EMAIL_PASS=my regular gmail password
JWT_SECRET=mysecret
SESSION_SECRET=mysecret
EMAIL_PORT=465
EMAIL_SECURE=false  # Mismatched!
```

✅ **Correct:**
```env
EMAIL_PASS=abcd efgh ijkl mnop  # 16-char app password
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0  # Long random string
SESSION_SECRET=x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1  # Different from JWT_SECRET
EMAIL_PORT=587
EMAIL_SECURE=false  # Matches port 587
```

---

### 4. Port Conflicts:

If you see "Port already in use":

**Check what's using the port:**
```bash
# Windows:
netstat -ano | findstr :5004

# Kill the process:
taskkill /PID <process-id> /F
```

**Or change the port in .env:**
```env
PORT=5005  # Use a different port
```

---

### 5. MongoDB Connection Issues:

**Common problems:**
- IP not whitelisted in MongoDB Atlas
- Wrong username/password in connection string
- Network firewall blocking connection

**Test MongoDB connection:**
```bash
node -e "require('mongoose').connect(process.env.MONGODB_URI || 'YOUR_URI').then(() => console.log('✅ Connected')).catch(err => console.error('❌ Error:', err.message))"
```

---

## ✅ Quick Validation Script

Save this as `test-env.js` in the backend folder:

```javascript
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

process.exit(errors);
```

**Run it:**
```bash
node test-env.js
```

---

## 🎯 Next Steps

1. **Delete duplicate Certificate model:**
   ```bash
   del backend\models\Certificate.js
   ```

2. **Verify .env configuration** using the checklist above

3. **Run validation script:**
   ```bash
   node backend/test-env.js
   ```

4. **Test email configuration:**
   ```bash
   node -e "require('./backend/utils/emailService').testEmailConfiguration().then(console.log)"
   ```

5. **Start the server and check for errors:**
   ```bash
   cd backend
   npm start
   ```

6. **Test the application:**
   - Create a profile
   - Login with VTID
   - Create a certificate
   - Check email notifications

---

## 📞 Troubleshooting

### Server won't start:
1. Check all required variables are in .env
2. Check MongoDB connection string is correct
3. Check port is not already in use
4. Look at the error message carefully

### Emails not sending:
1. Use App Password, not regular password
2. Check EMAIL_PORT and EMAIL_SECURE match
3. Verify 2FA is enabled on Gmail
4. Check spam folder for test emails

### Login issues:
1. Clear browser cookies/localStorage
2. Check if user exists in database
3. Verify password is being hashed
4. Check console logs for errors

---

**Last Updated:** October 5, 2025
