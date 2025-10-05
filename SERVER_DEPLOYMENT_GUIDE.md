# 🚀 Server Deployment & Troubleshooting Guide

## 🐛 **ISSUE: Profile Creation Error - FIXED!**

**Error:** `jobTitle: Cast to string failed for value "[ 'CAL/OMI (MEWP)' ]"`

**Cause:** Frontend sends jobTitle as an array, but backend schema expects a string.

**Fix Applied:** Backend now automatically converts array to string.

---

## ✅ **What I Just Fixed:**

### Updated These Functions:
1. **Profile Creation** (`POST /api/profiles`)
   - Now converts `jobTitle` array to string automatically
   - Takes first element if array: `['CAL/OMI'] → 'CAL/OMI'`

2. **Profile Update** (`PUT /api/profiles/:id`)
   - Same fix for profile updates

### The Fix:
```javascript
// Before saving, convert array to string
if (Array.isArray(profileData.jobTitle)) {
  profileData.jobTitle = profileData.jobTitle[0] || '';
}
```

---

## 🔧 **Deploy the Fix to Server:**

### **Option 1: Git Deployment (Recommended)**

```bash
# On your local machine:
cd /e:/Websites/HRMS510/hrms
git add .
git commit -m "Fixed jobTitle array to string conversion"
git push origin main

# On server:
cd /path/to/hrms/backend
git pull origin main
pm2 restart hrms
# OR
npm restart
```

### **Option 2: Direct File Upload**

If you're not using git, upload the modified `server.js`:

```bash
# Upload via FTP/SFTP:
# Upload: backend/server.js
# To: /path/to/hrms/backend/server.js

# Then on server:
pm2 restart hrms
```

---

## 🔍 **What to Check on Server:**

### **1. Check if Server is Running**

```bash
# SSH into your server
ssh user@your-server.com

# Check if Node/PM2 is running
pm2 list
# OR
ps aux | grep node

# Expected output:
# hrms  |  online  |  5003  |  0s
```

### **2. Check Server Logs**

```bash
# View PM2 logs
pm2 logs hrms --lines 50

# OR view direct logs
tail -f /path/to/hrms/backend/logs/error.log

# Look for:
✅ "Server running on port 5003"
✅ "Connected to MongoDB"
✅ "Creating 6 super admin accounts..."
❌ Any errors related to profile creation
```

### **3. Check if Code is Updated**

```bash
# On server:
cd /path/to/hrms/backend

# Check if jobTitle is string (not array)
grep -n "jobTitle.*String" server.js

# Expected output:
# 141:  jobTitle: { type: String, default: '' },
```

### **4. Check Git Status**

```bash
# On server:
cd /path/to/hrms/backend
git status

# Should show:
# On branch main
# Your branch is up to date with 'origin/main'
```

### **5. Check if Super Admins Were Created**

```bash
# On server, check MongoDB:
# Option A: Using Mongo shell
mongo <your-connection-string>
use hrms
db.users.find({ role: 'admin' }).count()

# Expected: 6 (your super admins)

# Option B: Check in PM2 logs
pm2 logs hrms | grep "Super admin created"

# Expected:
# ✅ Super admin created: dean.cumming@vitrux.co.uk
# ✅ Super admin created: syed.shahab.ahmed@vitrux.co.uk
# ... (6 total)
```

---

## 🧪 **Test After Deployment:**

### **Test 1: Profile Creation**

```bash
# Login to admin panel: https://talentshield.co.uk/login
# Email: dean.cumming@vitrux.co.uk
# Password: TalentShield@2025

# Go to Create Profile
# Fill in:
# - First Name: Test
# - Last Name: User
# - Email: test@example.com
# - Job Title: CAL/OMI (MEWP)  ← This was causing the error

# Click Submit

# Expected: ✅ Profile created successfully
```

### **Test 2: Check User Account Creation**

```bash
# After creating profile, check if User account was created:

# On server:
mongo <your-connection-string>
use hrms
db.users.find({ email: "test@example.com" })

# Expected: Should find 1 user with:
# - email: test@example.com
# - vtid: (some number)
# - role: user
# - profileId: (linked to profile)
```

### **Test 3: Login with New User**

```bash
# At https://talentshield.co.uk/login

# Get the VTID from profile (e.g., 1234)
# Login with:
# Email: test@example.com
# Password: 1234 (the VTID)

# Expected: ✅ Redirect to /user-dashboard
```

---

## 📊 **Server Status Checklist:**

### Before Deployment:
- [ ] Backed up database (if needed)
- [ ] Updated JWT_SECRET in .env
- [ ] Committed code changes
- [ ] Pushed to git repository

### Deployment:
- [ ] Pulled latest code on server (`git pull`)
- [ ] Installed dependencies (`npm install`)
- [ ] Restarted server (`pm2 restart hrms`)
- [ ] Checked server logs (no errors)

### Verification:
- [ ] Server is running (check `pm2 list`)
- [ ] Super admins created (6 accounts)
- [ ] Can login as super admin
- [ ] Can create profile (jobTitle works)
- [ ] User account auto-created for profile
- [ ] Can login as regular user with VTID

---

## 🚨 **Common Issues & Fixes:**

### **Issue: "Profile validation failed: jobTitle"**

**Status:** ✅ FIXED (in latest code)

**If still happening:**
```bash
# 1. Make sure you pulled latest code
git pull origin main

# 2. Restart server
pm2 restart hrms

# 3. Clear any cached data
pm2 delete hrms
pm2 start ecosystem.config.js
```

---

### **Issue: "Server not starting"**

**Check:**
```bash
# 1. View error logs
pm2 logs hrms --err --lines 50

# 2. Check .env file exists
ls -la /path/to/hrms/backend/.env

# 3. Validate environment
node test-env.js

# 4. Check MongoDB connection
node -e "require('mongoose').connect(process.env.MONGODB_URI || 'your-uri').then(() => console.log('✅ Connected')).catch(e => console.error('❌', e.message))"
```

---

### **Issue: "Super admins not created"**

**Check:**
```bash
# 1. Check .env has SUPER_ADMIN_EMAIL
cat .env | grep SUPER_ADMIN_EMAIL

# Expected:
# SUPER_ADMIN_EMAIL=dean.cumming@vitrux.co.uk,syed.shahab.ahmed@vitrux.co.uk,...

# 2. Check server logs
pm2 logs hrms | grep "super admin"

# 3. Manually check database
mongo <connection-string>
use hrms
db.users.find({ role: 'admin' }).pretty()
```

---

### **Issue: "Can't login with super admin"**

**Solutions:**
```bash
# 1. Verify account exists in database
mongo <connection-string>
use hrms
db.users.findOne({ email: "dean.cumming@vitrux.co.uk" })

# 2. Check password is correct: TalentShield@2025

# 3. Check if password was hashed
# In MongoDB, password should start with: $2b$10$

# 4. If password is wrong, reset it:
mongo <connection-string>
use hrms
# You'll need to delete and recreate the user
db.users.deleteOne({ email: "dean.cumming@vitrux.co.uk" })
# Then restart server to recreate
```

---

### **Issue: "User can't login after profile creation"**

**Check:**
```bash
# 1. Verify User account was created
mongo <connection-string>
use hrms
db.users.findOne({ email: "user@example.com" })

# Expected: User doc with vtid and profileId

# 2. If missing, there was an error in user creation
# Check server logs for:
pm2 logs hrms | grep "Error creating user account"

# 3. Password should be their VTID (check profile.vtid)
```

---

## 📝 **Quick Commands Reference:**

### **Restart Server:**
```bash
pm2 restart hrms
# OR
pm2 reload hrms
# OR
systemctl restart hrms.service
```

### **View Logs:**
```bash
pm2 logs hrms           # All logs
pm2 logs hrms --err     # Error logs only
pm2 logs hrms --lines 100  # Last 100 lines
```

### **Check Status:**
```bash
pm2 list                # All processes
pm2 show hrms           # Detailed info
pm2 monit               # Real-time monitor
```

### **Clear Logs:**
```bash
pm2 flush hrms          # Clear logs
```

### **Database Commands:**
```bash
mongo <connection-string>
use hrms

# Count users
db.users.count()

# Count profiles
db.profiles.count()

# Find super admins
db.users.find({ role: 'admin' })

# Find user by email
db.users.findOne({ email: "dean.cumming@vitrux.co.uk" })
```

---

## ✅ **Deployment Steps (TL;DR):**

```bash
# 1. Local machine
git add .
git commit -m "Applied all fixes"
git push origin main

# 2. On server
cd /path/to/hrms/backend
git pull
npm install
pm2 restart hrms

# 3. Check logs
pm2 logs hrms --lines 50

# 4. Test
# Login: https://talentshield.co.uk/login
# Email: dean.cumming@vitrux.co.uk
# Password: TalentShield@2025

# 5. Create test profile
# Verify jobTitle works (no array error)

# ✅ Done!
```

---

## 🎯 **Success Criteria:**

Your deployment is successful when:

- ✅ Server starts without errors
- ✅ 6 super admin accounts created
- ✅ Can login as super admin
- ✅ Can create profile (jobTitle accepts array from frontend)
- ✅ User account auto-created for profile
- ✅ New user can login with VTID
- ✅ User dashboard loads correctly

---

**Last Updated:** October 5, 2025  
**Status:** ✅ Profile creation bug fixed  
**Next:** Deploy to server and test
