# 🚀 Pre-Deployment Checklist - HRMS Critical Fixes

## ⚠️ **CRITICAL: Read This First!**

**Major changes have been made to the authentication system. Follow this checklist carefully before deploying to production.**

---

## 📋 Summary of Changes

### ✅ **What Was Fixed:**
1. **Profile Creation** - jobTitle casting error resolved
2. **Password Security** - Auto-hashing with bcrypt (no more plaintext)
3. **VTID Login** - Users can login with VTID, email, or username
4. **User ↔ Profile Linking** - Bidirectional ObjectId references
5. **Certificate Dates** - Proper Date types with auto-conversion
6. **Login Unification** - Single secure authentication flow
7. **Double-Hashing Bug** - Fixed in signup and user creation
8. **Admin Create User** - Now properly creates User accounts

### ⚠️ **Breaking Changes:**
1. Login now checks **User collection only** (not Profile)
2. **Existing profiles without User accounts cannot login**
3. Password hashing is automatic (affects all new users)

---

## 🔧 Pre-Deployment Steps

### Step 1: Backup Your Database ✅

**CRITICAL: Do this first!**

```bash
# MongoDB Atlas: Use built-in backup
# Or export your data:
mongodump --uri="<your-mongodb-uri>" --out=./backup-$(date +%Y%m%d)
```

---

### Step 2: Update .env File ✅

**Required changes:**

```env
# CRITICAL: Change this from placeholder!
JWT_SECRET=<generate-unique-32+char-secret>

# Fix email typo:
SUPER_ADMIN_EMAIL=...,12kaveen@gmail.com  # was gmailcom

# Verify these are correct:
EMAIL_HOST=mail.vitruxshield.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=thaya.govzig@vitruxshield.com
EMAIL_PASS=Welcome@2025
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 3: Test Locally First ✅

**Before deploying to production:**

```bash
cd backend

# 1. Validate environment
node test-env.js

# 2. Start server
npm start

# Expected output:
# ✅ Loaded environment: production from .env
# ✅ All required environment variables are present
# Connected to MongoDB
# Server running on port 5003
# Default user created: admin@talentshield.com / admin123
```

**Test login locally:**
1. Try logging in with default admin: `admin@talentshield.com` / `admin123`
2. Create a test profile
3. Verify User account is created
4. Login with the new user's VTID

---

### Step 4: Run Migration Script (CRITICAL!) ✅

**This creates User accounts for existing Profiles**

```bash
cd backend

# 1. Dry run first (preview only - SAFE)
node migrate-profiles-to-users.js

# Review the output - check:
# - How many users will be created
# - Any errors or warnings
# - Initial passwords (will be VTID)

# 2. Execute the migration (MAKES CHANGES)
node migrate-profiles-to-users.js --execute
```

**What this does:**
- Finds all Profiles without a linked User
- Creates User account for each (password = their VTID)
- Links User ↔ Profile bidirectionally
- **Does NOT send emails automatically** (you'll need to notify users)

**After migration:**
- Users can login with their email or VTID
- Initial password is their VTID number
- They should change password after first login

---

### Step 5: Deploy to Production ✅

**Upload files to server:**

```bash
# Files that changed:
backend/server.js                    # Core fixes
backend/utils/certificateScheduler.js # Fixed notifications
backend/.env                          # Updated secrets
backend/migrate-profiles-to-users.js  # Migration script
backend/test-env.js                   # Validation tool

# Deleted:
backend/models/Certificate.js         # Was duplicate
```

**On the production server:**

```bash
cd /path/to/hrms/backend

# 1. Pull latest code
git pull origin main

# 2. Install dependencies (if needed)
npm install

# 3. Update .env with production values
nano .env
# - Set JWT_SECRET
# - Verify email config
# - Fix typos

# 4. Validate environment
node test-env.js

# 5. Run migration
node migrate-profiles-to-users.js          # Dry run
node migrate-profiles-to-users.js --execute # Execute

# 6. Restart server
pm2 restart hrms
# or
npm start
```

---

### Step 6: Verify Production Deployment ✅

**Test these critical paths:**

#### Test 1: Admin Login
```
URL: https://talentshield.co.uk/login
Email: admin@talentshield.com
Password: admin123

✅ Expected: Login successful → redirected to /dashboard
❌ If fails: Check JWT_SECRET, check MongoDB connection
```

#### Test 2: User Login (Existing User)
```
URL: https://talentshield.co.uk/login
Email/VTID: <existing-user-email-or-vtid>
Password: <their-vtid-number>

✅ Expected: Login successful → redirected to /user-dashboard
❌ If fails: Check if migration ran successfully
```

#### Test 3: Create New Profile
```
1. Login as admin
2. Go to Create Profile
3. Fill in: First Name, Last Name, Email, Job Title
4. Submit

✅ Expected: 
   - Profile created
   - User account auto-created
   - Email sent to user
   - Can login with VTID
```

#### Test 4: User Dashboard Access
```
1. Login as regular user
2. Verify dashboard loads
3. Check profile information displays
4. Check certificates display

✅ Expected: All data loads correctly
❌ If fails: Check backend logs, verify profile exists
```

---

### Step 7: Notify Users ✅

**IMPORTANT: Users need to know their new credentials!**

**Template email to send:**

```
Subject: HRMS Login Credentials Updated

Dear [User Name],

Our HRMS system has been updated with enhanced security features.

Your login credentials:
- Login URL: https://talentshield.co.uk/login
- Username: Your email address OR your VTID
- Password: Your VTID number ([VTID])

For security, please change your password after your first login.

If you have any issues logging in, please contact support.

Best regards,
HRMS Team
```

---

## 🔍 Post-Deployment Monitoring

**Watch for these in server logs:**

```bash
# On production server:
pm2 logs hrms
# or
tail -f /var/log/hrms.log

# Look for:
✅ "Default user created" - Good
✅ "User account created for profile" - Good
✅ "User account created and linked" - Good
❌ "Error creating user account" - INVESTIGATE
❌ "Invalid credentials" - Check if migration ran
❌ "No active session" - Session/cookie issues
```

---

## 🚨 Rollback Plan (If Things Go Wrong)

### If login completely fails:

```bash
# 1. Stop the server
pm2 stop hrms

# 2. Restore database backup
mongorestore --uri="<your-mongodb-uri>" --drop ./backup-YYYYMMDD

# 3. Revert code changes
git reset --hard HEAD~1

# 4. Restart with old code
npm start

# 5. Notify users of temporary rollback
```

---

## ✅ Success Criteria

**Your deployment is successful if:**

- [ ] Environment validation passes (`node test-env.js`)
- [ ] Server starts without errors
- [ ] Default admin can login
- [ ] Existing users can login (after migration)
- [ ] New profiles auto-create User accounts
- [ ] User dashboard loads for regular users
- [ ] Admin dashboard loads for admins
- [ ] Email notifications are being sent
- [ ] Certificate expiry scheduler is running

---

## 📊 Database State After Migration

### Before:
```
Users:      [admin@talentshield.com] (1)
Profiles:   [user1, user2, user3...] (no User link)
```

### After:
```
Users:      [admin@talentshield.com, user1, user2, user3...]
            Each User.profileId → Profile._id
Profiles:   [user1, user2, user3...]
            Each Profile.userId → User._id
```

**Relationships:**
- User ↔ Profile: Bidirectional one-to-one
- Profile ↔ Certificates: Profile.id ↔ Certificate.profileId
- Login uses User collection only

---

## 🔐 Security Notes

### Passwords:
- ✅ All new passwords are bcrypt hashed (10 rounds)
- ✅ Pre-save hook handles hashing automatically
- ✅ No double-hashing bugs remain
- ⚠️ Initial passwords are VTID (users should change)

### JWT:
- ⚠️ **MUST change JWT_SECRET from placeholder**
- ✅ Existing sessions will be invalidated (users re-login once)
- ✅ 24-hour token expiry

### Email:
- ✅ Using production mail server (mail.vitruxshield.com)
- ⚠️ Only works on production server (not localhost)

---

## 📞 Troubleshooting

### Issue: "Invalid credentials" after migration
**Cause:** User account not created or password mismatch  
**Fix:** Run migration again, check User collection in MongoDB

### Issue: "No active session" error
**Cause:** Session cookie not being set/read  
**Fix:** Check CORS_ORIGIN matches frontend URL, verify SESSION_SECRET

### Issue: User dashboard shows "Profile not found"
**Cause:** Profile.email case mismatch or profile doesn't exist  
**Fix:** Check if profile exists, verify email is lowercase

### Issue: Emails not sending
**Cause:** Mail server not accessible or wrong credentials  
**Fix:** Verify EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env

### Issue: "Missing required environment variables"
**Cause:** .env file not loaded or missing values  
**Fix:** Run `node test-env.js`, verify all required vars are set

---

## 📚 Additional Documentation

- **[FINAL_SUMMARY.md](./FINAL_SUMMARY.md)** - Complete overview
- **[CRITICAL_FIXES_APPLIED_OCT2025.md](./CRITICAL_FIXES_APPLIED_OCT2025.md)** - Technical details
- **[ENV_CHECKLIST_AND_ISSUES.md](./ENV_CHECKLIST_AND_ISSUES.md)** - Environment setup
- **[QUICK_START_AFTER_FIXES.md](./QUICK_START_AFTER_FIXES.md)** - Testing guide

---

## ✅ Final Checklist

Before you deploy, confirm:

- [ ] Database backup completed
- [ ] JWT_SECRET changed from placeholder
- [ ] Email typo fixed (gmail.com)
- [ ] .env validated with test-env.js
- [ ] Tested locally (admin login, create profile, user login)
- [ ] Migration script tested in dry-run mode
- [ ] Migration script executed successfully
- [ ] All users notified of new credentials
- [ ] Rollback plan understood and ready
- [ ] Server logs monitoring set up
- [ ] Success criteria understood

---

**Date:** October 5, 2025  
**Version:** Critical Fixes v1.0  
**Status:** ✅ Ready for Deployment (after checklist complete)

**Good luck with the deployment! 🚀**
