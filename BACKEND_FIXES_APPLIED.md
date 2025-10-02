# Backend Server Fixes - 502 Error Resolution

## Problem
- Backend returning **502 Bad Gateway**
- Server likely crashed due to duplicate route definitions

## ✅ Fixes Applied

### 1. Removed Duplicate Route: `/api/certificates/:id/file`
**Lines 1088-1110** - DELETED duplicate route
- Kept the first implementation (line 1061)
- Removed the second duplicate

### 2. Removed Duplicate Route: `/api/profiles/:id/stats`
**Lines 1751-1782** - DELETED duplicate route with jobTitle bug
- Kept the first implementation (line 801)
- The duplicate referenced `jobTitle` which doesn't exist in schema

### 3. Added profileId Validation to Certificate Creation
**Lines 951-965** - NEW validation logic
- Validates profileId format (must be valid ObjectId)
- Verifies profile exists in database
- Auto-sets profileName from profile record
- Returns proper error messages if validation fails

## How to Restart Backend

### Option 1: PM2 (Production)
```bash
cd e:/Websites/New\ folder\ \(2\)/hrms/backend
pm2 restart server
# or
pm2 restart all
```

### Option 2: Manual (Development)
```bash
cd e:/Websites/New\ folder\ \(2\)/hrms/backend
# Stop current process (Ctrl+C if running)
node server.js
# or
npm start
```

### Option 3: PM2 with Fresh Start
```bash
cd e:/Websites/New\ folder\ \(2\)/hrms/backend
pm2 stop all
pm2 delete all
pm2 start server.js --name "hrms-backend"
pm2 save
```

## Verify Server is Running

### Check PM2 Status:
```bash
pm2 status
pm2 logs server
```

### Test API Endpoints:
```bash
# Test dashboard stats
curl https://talentshield.co.uk/api/certificates/dashboard-stats

# Test profile endpoint  
curl https://talentshield.co.uk/api/my-profile

# Should return JSON, not 502
```

### Check Browser Console:
- Refresh the dashboard page
- Should see successful API calls (200 status)
- No more 502 errors

## What Was Wrong

### Duplicate Routes Caused:
1. **Express confusion** - Same route defined twice causes unpredictable behavior
2. **Server crash** - Potential memory issues or startup failures
3. **502 Gateway** - Nginx/proxy can't connect to crashed backend

### The jobTitle Bug:
```javascript
// WRONG - jobTitle doesn't exist in schema!
jobTitle: profile.jobTitle  // undefined

// Should be:
jobRole: profile.jobRole
```

## Files Modified
- `backend/server.js`
  - Line 1088-1110: Removed duplicate file route
  - Line 1751-1782: Removed duplicate stats route
  - Line 951-965: Added profileId validation

## Expected Behavior After Fix

✅ Backend starts without errors
✅ Dashboard loads successfully
✅ Profile page loads successfully  
✅ Certificate creation validates profileId
✅ No 502 errors
✅ All API endpoints respond with 200

## If Still Getting 502

1. **Check backend logs:**
   ```bash
   pm2 logs
   # or
   tail -f /path/to/backend/logs/error.log
   ```

2. **Check if port is in use:**
   ```bash
   netstat -ano | findstr :5003
   ```

3. **Check for syntax errors:**
   ```bash
   cd backend
   node -c server.js
   ```

4. **Restart Nginx/Proxy:**
   ```bash
   sudo systemctl restart nginx
   # or
   sudo service nginx restart
   ```

5. **Check Nginx config:**
   ```nginx
   # Should have proxy to port 5003
   location /api {
       proxy_pass http://localhost:5003;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```
