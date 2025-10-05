# Quick Start Guide - After Critical Fixes

## 🚀 Getting Started

All critical bugs have been fixed! Follow these steps to get your HRMS up and running.

---

## Step 1: Configure Email Service

The mailing service is already set up, but you need to configure your email credentials.

### Edit `.env` file in `/backend` folder:

```env
# Email Configuration (REQUIRED)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com          # ← Your Gmail address
EMAIL_PASS=xxxx xxxx xxxx xxxx           # ← Your Gmail App Password
EMAIL_FROM=HRMS System <your-email@gmail.com>

# Frontend URL (REQUIRED for email links)
FRONTEND_URL=http://localhost:3000       # ← Your frontend URL

# Database (already configured)
MONGODB_URI=mongodb+srv://...            # ← Keep your existing value
```

### How to Get Gmail App Password:

1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication if not already enabled
3. Go to https://myaccount.google.com/apppasswords
4. Generate a new app password for "Mail"
5. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
6. Paste it as `EMAIL_PASS` in your `.env` file

---

## Step 2: Start the Application

### Backend:
```bash
cd backend
npm install  # If not already done
npm start    # or npm run dev for development
```

### Frontend:
```bash
cd frontend
npm install  # If not already done
npm start
```

---

## Step 3: Test Critical Features

### ✅ Test Profile Creation

1. Navigate to Create Profile page
2. Fill in all fields including **Job Title** (single value, not array)
3. Submit the form
4. **Expected Results:**
   - Profile created successfully
   - User account automatically created with VTID as password
   - Email sent to user with login credentials
   - VTID displayed/generated

### ✅ Test Login

Try all three login methods:

1. **Login with Email:**
   - Email: `user@example.com`
   - Password: Their VTID (e.g., `1234`)

2. **Login with VTID:**
   - Identifier: `1234`
   - Password: `1234`

3. **Login with Username (for admins):**
   - Username: `admin`
   - Password: Their password

**Expected Results:**
- Login successful
- Redirected to appropriate dashboard
- Login success email sent

### ✅ Test Certificate Creation

1. Create a certificate for a profile
2. Set **Issue Date** and **Expiry Date**
3. **Expected Results:**
   - Dates saved as Date objects (not strings)
   - Certificate created successfully
   - Can query by expiry date

---

## 🔍 Verify Email System

### Test Email Sending:

Run this test script in the backend folder:
```bash
node -e "require('./utils/emailService').testEmailConfiguration().then(console.log)"
```

**Expected Output:**
```
✅ Email configuration test successful
Message sent: <message-id>
```

If you see an error, check your email credentials in `.env`

---

## 📧 Email Notifications That Are Now Active

1. **Profile Created** - Welcome email with login credentials
2. **Login Success** - Notification when someone logs in
3. **Certificate Expiry** - Reminders at 60, 30, 14, 7, 3, 1 days before expiry
4. **Certificate Expired** - Alert when certificate expires

The certificate monitoring cron job runs automatically when the server starts.

---

## 🐛 Known Issues Fixed

- ✅ Profile creation jobTitle casting error - **FIXED**
- ✅ Passwords stored in plaintext - **FIXED** (now bcrypt hashed)
- ✅ No VTID login support - **FIXED** (can login with VTID, email, or username)
- ✅ Certificate dates as strings - **FIXED** (now Date objects)
- ✅ Certificate notifications broken - **FIXED** (uses profileId properly)
- ✅ No User ↔ Profile relationship - **FIXED** (bidirectional refs)
- ✅ Missing database indexes - **FIXED** (indexes added)

---

## 🔧 Troubleshooting

### Profile Creation Error
**Error:** "Cast to string failed for value '[]'"
**Solution:** ✅ Already fixed - jobTitle is now a string, not array

### Login Not Working
**Issue:** Can't login with VTID
**Solution:** ✅ Already fixed - VTID login now supported

### Email Not Sending
**Issue:** No emails being sent
**Solution:** 
1. Check `.env` file has correct `EMAIL_USER` and `EMAIL_PASS`
2. Make sure `EMAIL_PASS` is the App Password (not your regular Gmail password)
3. Run the email test command above

### Existing Users Can't Login
**Issue:** Old users with plaintext passwords
**Solution:** 
- New password hashing only affects NEW users
- Existing admins with hashed passwords work fine
- If profile-based users can't login, they need a User account created
- Run backend and it will create User accounts for existing profiles

---

## 📊 Database Schema Changes

### User Schema - NEW FIELDS:
- `vtid` - Can login with VTID
- `profileId` - Link to Profile
- `passwordChangedAt` - Track password changes
- `lastLoginAt` - Track last login

### Profile Schema - NEW FIELDS:
- `userId` - Link to User account

### Certificate Schema - TYPE CHANGES:
- `issueDate` - String → **Date**
- `expiryDate` - String → **Date** (indexed)
- `cost` - String → **Number**
- `totalCost` - String → **Number**
- `isInterim` - String → **Boolean**

---

## 💡 Tips

1. **First Admin Account:**
   - Default admin is auto-created on first run
   - Email: `admin@talentshield.com`
   - Password: `Admin@123`
   - Change this immediately!

2. **Creating Profiles:**
   - Always creates a linked User account automatically
   - User gets email with VTID as password
   - Users should change password after first login

3. **Certificate Monitoring:**
   - Runs automatically every day at 9 AM
   - Checks for expiring and expired certificates
   - Sends email reminders
   - No manual intervention needed

4. **Performance:**
   - Database indexes added for fast queries
   - Certificate expiry queries are now efficient
   - Profile lookups by email/VTID are instant

---

## 📞 Support

### If You Encounter Issues:

1. Check the console logs for detailed error messages
2. Verify `.env` file configuration
3. Make sure MongoDB is accessible
4. Test email configuration with the test script
5. Check [CRITICAL_FIXES_APPLIED_OCT2025.md](./CRITICAL_FIXES_APPLIED_OCT2025.md) for detailed fix information

---

## ✨ What's New

### Security Improvements
- 🔒 All passwords now bcrypt hashed (10 rounds)
- 🔑 Unified secure authentication for all users
- 📝 Password change tracking

### User Experience
- 🎫 Login with VTID, email, or username
- 📧 Automatic email notifications
- ⚡ Faster queries with new indexes

### Data Integrity
- 🔗 Proper User ↔ Profile relationships
- 📅 Proper Date types for certificates
- 🔢 Proper Number types for costs
- ✅ Better data validation

---

**Version:** October 2025 Critical Fixes  
**Status:** ✅ Ready for Production  
**Last Updated:** October 5, 2025
