# Debugging Guide - HRMS Issues

## Issues Fixed

### 1. ✅ Certificate File Delete Button Not Working

**Problem**: Delete button in ViewCertificate.js was not deleting files from database.

**Solution**: 
- Added new backend endpoint: `DELETE /api/certificates/:id/file`
- Updated frontend to call the proper DELETE endpoint
- File data is now properly removed from MongoDB (sets fileData, certificateFile, fileSize, mimeType to null)

**Files Changed**:
- `backend/server.js`: Added DELETE endpoint at line ~1110
- `frontend/src/pages/ViewCertificate.js`: Updated handleDeleteFile function

**Testing**:
1. View a certificate with an uploaded file
2. Click "Delete File" button
3. Confirm the deletion
4. File should be removed from database
5. Refresh page - file should still be gone

---

### 2. 🔍 Login 400 Bad Request Error

**Possible Causes**:

#### A. Frontend Not Sending Credentials Properly
Check browser console for the request being sent:
```javascript
// Should send:
{
  identifier: "email@example.com",  // or username
  password: "yourpassword",
  rememberMe: false
}
```

**Debug Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Find the POST request to `/api/auth/login`
5. Check the Request Payload - are identifier and password present?

#### B. CORS Issues
If you see CORS errors in console:

**Check backend .env**:
```env
CORS_ORIGINS=http://localhost:3000
```

**Check frontend .env**:
```env
REACT_APP_API_BASE_URL=http://localhost:5003
```

#### C. Server Not Running
Make sure backend server is running:
```bash
cd backend
npm start
```

You should see:
```
Server running on port 5003
Connected to MongoDB
```

**Fixed with Better Logging**:
Added detailed console logging to backend login endpoint:
- Shows what data is received
- Shows validation failures
- Helps identify exact issue

---

### 3. 🔍 Email Not Being Sent (Verification & Authorization)

**Diagnosis**:

Run the backend server and check console logs when signing up:
```
Attempting to send verification email to: user@example.com
Email config: {
  host: 'smtp.gmail.com',
  port: '587',
  user: 'configured',  // or 'missing'
  pass: 'configured'   // or 'missing'
}
```

**Common Issues**:

#### Issue A: Email Configuration Missing

**Check your backend/.env file has these variables set**:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM="HRMS System <your-email@gmail.com>"
SUPER_ADMIN_EMAIL=admin@talentshield.com
```

#### Issue B: Gmail App Password Not Set

**If using Gmail, you MUST use an App Password, not your regular password!**

Steps to generate Gmail App Password:
1. Go to Google Account Settings
2. Security → 2-Step Verification (enable if not enabled)
3. Security → App passwords
4. Select "Mail" and "Other (Custom name)"
5. Name it "HRMS"
6. Copy the 16-character password
7. Use this in `EMAIL_PASS` in .env

#### Issue C: Email Service Blocked

Some ISPs or networks block SMTP ports. Try:
- Using port 465 with `EMAIL_SECURE=true`
- Using a different email provider (SendGrid, Mailgun)
- Check firewall settings

#### Issue D: Emails Going to Spam

Check:
1. Recipient's spam folder
2. Gmail "All Mail" folder
3. Email filtering rules

**Test Email Configuration**:

Run the test script:
```bash
cd backend
node test-email-complete.js
```

This will test:
- SMTP connection
- Email sending
- Error reporting

---

## How to Debug Step-by-Step

### Debug Login Issue

1. **Check Backend is Running**:
```bash
cd backend
npm start
# Should show: Server running on port 5003
```

2. **Check Frontend .env**:
```env
REACT_APP_API_BASE_URL=http://localhost:5003
```

3. **Try Login with Console Open**:
- Open browser DevTools (F12)
- Go to Console tab
- Try to login
- Look for errors

4. **Check Network Request**:
- Network tab in DevTools
- Find POST to `/api/auth/login`
- Check Request Payload
- Check Response

5. **Check Backend Logs**:
Look for:
```
Login request received: { hasIdentifier: true, hasEmail: true, hasPassword: true, ... }
```

If you see:
```
Login validation failed: { loginIdentifier: undefined, hasPassword: true }
```
Then the identifier is not being sent properly.

### Debug Email Issue

1. **Verify Email Config in .env**:
```bash
cd backend
cat .env | grep EMAIL
```

Should show:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM="HRMS <your-email@gmail.com>"
```

2. **Test SMTP Connection**:
```bash
cd backend
node test-email-complete.js
```

Expected output:
```
✓ SMTP configuration is valid
✓ Test email sent successfully
```

3. **Sign Up New User and Watch Logs**:

Backend console should show:
```
Attempting to send verification email to: newuser@example.com
Email config: {
  host: 'smtp.gmail.com',
  port: '587',
  user: 'configured',
  pass: 'configured'
}
✓ Verification email sent to newuser@example.com
```

If you see:
```
✗ Verification email failed: Invalid login: 535-5.7.8 Username and Password not accepted
```

Then your EMAIL_PASS is wrong or you're not using an App Password.

4. **Sign Up Admin and Check Approval Email**:

Should see:
```
Attempting to send admin approval email to: admin@talentshield.com
✓ Admin approval request sent to admin@talentshield.com
```

---

## Quick Fixes

### Fix 1: Reset Email Configuration

Edit `backend/.env`:
```env
# For Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM="TalentShield HRMS <youremail@gmail.com>"

# Super Admin
SUPER_ADMIN_EMAIL=admin@talentshield.com
```

Restart backend:
```bash
cd backend
npm start
```

### Fix 2: Test Login with curl

```bash
curl -X POST http://localhost:5003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@talentshield.com","password":"admin123"}'
```

Expected response:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "admin@talentshield.com",
    "role": "admin"
  }
}
```

### Fix 3: Check MongoDB Connection

Backend should show:
```
Connected to MongoDB
Default admin account created (or already exists)
```

If you see connection errors:
```env
# In backend/.env
MONGODB_URI=mongodb://localhost:27017/hrms
```

Make sure MongoDB is running:
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

---

## Error Messages Explained

### "Email/username and password are required"
**Cause**: Frontend not sending `identifier` or `password` in request.
**Fix**: Check AuthContext.js login function sends correct data.

### "Invalid email or password"
**Cause**: 
- Wrong password
- User doesn't exist
- Looking in wrong collection (User vs Profile)

**Fix**: 
- Check password is correct
- Verify user exists in database
- Check if user is admin (User collection) or regular user (Profile collection)

### "Email not verified"
**Cause**: User hasn't clicked verification email link.
**Fix**: 
- Check email (including spam)
- Manually verify in database: `db.users.updateOne({email: "user@example.com"}, {$set: {emailVerified: true}})`

### "Admin account pending approval"
**Cause**: Super admin hasn't approved the admin account.
**Fix**:
- Super admin checks email for approval link
- Click approval link
- Or manually approve: `db.users.updateOne({email: "admin@example.com"}, {$set: {adminApprovalStatus: "approved"}})`

### "Failed to delete certificate file"
**Cause**: Old code was trying to use wrong method.
**Fix**: ✅ Already fixed with new DELETE endpoint.

---

## Verification Checklist

### Backend Running ✓
- [ ] `npm start` in backend folder runs without errors
- [ ] Console shows "Server running on port 5003"
- [ ] Console shows "Connected to MongoDB"

### Email Configuration ✓
- [ ] EMAIL_HOST set in .env
- [ ] EMAIL_PORT set in .env
- [ ] EMAIL_USER set in .env
- [ ] EMAIL_PASS set in .env (App Password for Gmail)
- [ ] EMAIL_FROM set in .env
- [ ] SUPER_ADMIN_EMAIL set in .env
- [ ] Test email script works: `node test-email-complete.js`

### Frontend Configuration ✓
- [ ] REACT_APP_API_BASE_URL set in frontend/.env
- [ ] Points to correct backend URL (http://localhost:5003 for dev)

### Database ✓
- [ ] MongoDB is running
- [ ] MONGODB_URI is correct in backend/.env
- [ ] Can connect to database

### Login Works ✓
- [ ] Can login with admin@talentshield.com / Admin@123
- [ ] No 400 errors
- [ ] Token is received
- [ ] Redirected to dashboard

### Emails Send ✓
- [ ] Signup sends verification email
- [ ] Admin signup sends approval email to super admin
- [ ] Create user sends credentials to admin
- [ ] Emails not in spam folder

### Certificate File Delete ✓
- [ ] Can upload certificate file
- [ ] File persists after refresh
- [ ] Can delete file
- [ ] Delete removes file from database
- [ ] Deletion persists after refresh

---

## Still Having Issues?

1. **Enable Detailed Logging**:

Edit `backend/server.js` and add at the top:
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

2. **Check Browser Console**:
- F12 → Console tab
- Look for red errors
- Copy full error message

3. **Check Backend Console**:
- Look for stack traces
- Check for MongoDB errors
- Check for email errors

4. **Test Each Component Separately**:
- Test MongoDB connection
- Test email sending
- Test API endpoints with curl/Postman
- Test frontend separately

5. **Common Fixes**:
- Restart backend server
- Clear browser cache (Ctrl+Shift+Delete)
- Clear localStorage (F12 → Application → Local Storage → Clear)
- Restart MongoDB
- Check firewall settings
- Try different network (mobile hotspot)

---

## Support Commands

### Check if backend is running:
```bash
curl http://localhost:5003/api/test
```

### Check MongoDB:
```bash
mongosh
use hrms
db.users.find({email: "admin@talentshield.com"})
```

### Check environment variables:
```bash
cd backend
cat .env
```

### Restart everything:
```bash
# Stop backend (Ctrl+C)
# Restart MongoDB
# Start backend
cd backend
npm start
```

### Clear all data and start fresh:
```bash
mongosh
use hrms
db.dropDatabase()
# Then restart backend - will recreate default admin
```
