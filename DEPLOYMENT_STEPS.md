# Deployment Steps for Super Admin Fix

## Changes Made:
1. Updated `backend/models/User.js` - Added 'super-admin' and 'admin' to role enum
2. Updated `backend/server.js` - Skip admin approval check for super-admins
3. Updated `backend/server.js` - Fixed ensureAdminExists() function
4. Created `backend/scripts/fixSuperAdminAccounts.js` - Script to update existing accounts

## Deployment Steps:

### 1. Push Changes to Git (if not done)
```bash
git add .
git commit -m "Fix super admin login - allow super-admin role and skip approval checks"
git push origin main
```

### 2. On the Server (SSH into your server)
```bash
# Navigate to your app directory
cd ~/apps/hrms

# Pull latest changes
git pull origin main

# Install any new dependencies (if needed)
cd backend
npm install

# Run the fix script to update existing super admin accounts
node scripts/fixSuperAdminAccounts.js

# Restart the backend server
pm2 restart hrms-backend
# OR if using different process manager:
# systemctl restart hrms-backend
# OR
# npm restart
```

### 3. Verify the Fix
- Try logging in with any super admin email:
  - thaya.govzig@vitruxshield.com
  - syed.ali.asgar@vitruxshield.com
  - mvnaveen18@gmail.com

### 4. Check Server Logs (if issues persist)
```bash
# View PM2 logs
pm2 logs hrms-backend

# OR view application logs
tail -f /path/to/your/logs/error.log
```

## What Was Fixed:
- ✅ User model now accepts 'super-admin' and 'admin' roles
- ✅ Login endpoint skips admin approval check for super-admins
- ✅ User.authenticate() method now finds admin and super-admin accounts
- ✅ ensureAdminExists() creates super-admin instead of admin
- ✅ Script to bulk update existing super admin accounts in database

## Expected Result:
After deployment and running the fix script, super admin accounts will be able to login without 403 errors.
