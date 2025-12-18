# Quick Reference - Leave Request Approver Fix

## Problem
Admins and super-admins don't appear in the manager dropdown when submitting leave requests.

## If admins don't show in the dropdown:

### Step 1: Create Environment File (if needed)
```bash
cd /root/hrms-updated/backend
node scripts/createEnvForScripts.js
# Follow the prompts and enter your MongoDB connection string
```

### Step 2: Diagnose the Issue
```bash
cd /root/hrms-updated/backend

# Option A: Using .env file (after running createEnvForScripts.js)
node scripts/checkApprovers.js

# Option B: Pass MongoDB URI directly (no .env needed)
node scripts/checkApproversSimple.js "mongodb://your-connection-string"
```

### Step 3: Check the Output
- ✅ If it shows "Approvers are properly configured!" → Issue is elsewhere (clear browser cache)
- ❌ If it shows "NO ADMIN USERS FOUND" → Create admin users first
- ⚠️ If it shows missing EmployeeHub records → Continue to step 4

### Step 4: Fix Missing EmployeeHub Records
```bash
cd /root/hrms-updated/backend

# Option A: Using .env file
node scripts/syncUserRolesToEmployeeHub.js

# Option B: Set environment variable first
export MONGODB_URI="mongodb://your-connection-string"
node scripts/syncUserRolesToEmployeeHub.js
```

## What Gets Fixed
The sync script will:
1. Find all approved admin/super-admin users
2. Create EmployeeHub records for missing admins
3. Activate inactive records
4. Update Terminated status to Active

## After Running Sync

1. **Restart the backend server** if running
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Refresh the leave request page**
4. The admin/super-admin names should now appear in the dropdown

## Verify It Works

1. Log in as employee
2. Go to "Leave Request" on dashboard
3. Try to submit a new leave request
4. Click on "Approval Manager" dropdown
5. Should see admin/super-admin names
6. Submit the request
7. Admin dashboard should show it in "Pending Requests" tab

## MongoDB Connection String Format

```
mongodb://username:password@host:port/database
mongodb+srv://username:password@cluster.mongodb.net/database
```

## Environment Variables for Production

Set these before running scripts (only MONGODB_URI is required for diagnostics):
```bash
export MONGODB_URI="your-mongodb-connection-string"
export JWT_SECRET="your-jwt-secret"
export SESSION_SECRET="your-session-secret"
export EMAIL_HOST="your-email-host"
export EMAIL_USER="your-email-user"
export EMAIL_PASS="your-email-password"
```

Or create `.env.production` file with these values.

## Files Modified

- `backend/routes/auth.js` - New /api/auth/approvers endpoint
- `backend/controllers/authController.js` - getApprovers method
- `frontend/src/components/LeaveManagement/LeaveForm.jsx` - Updated to use new endpoint
- `backend/scripts/checkApprovers.js` - Fixed .env loading
- `backend/scripts/syncUserRolesToEmployeeHub.js` - Fixed .env loading
- `backend/scripts/checkApproversSimple.js` - NEW simple diagnostic script
- `backend/scripts/createEnvForScripts.js` - NEW helper to create .env file

## Troubleshooting

### Script says "MONGODB_URI environment variable is not set"
Run: `node scripts/createEnvForScripts.js` to create .env file

### Script says "NO ADMIN USERS FOUND"
- Check if admin users exist in User collection
- Go to admin dashboard and verify admins are created
- If not, create new admin accounts

### After fix, dropdown still shows "No approvers available"
1. Run `node scripts/checkApproversSimple.js` again
2. Clear browser cache completely
3. Restart backend server
4. Try on a different browser or incognito mode
