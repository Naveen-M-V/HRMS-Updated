# 🎯 API Auto-Detection Configuration

## What Was Changed

Updated [frontend/src/utils/apiConfig.js](file:///c:/Users/kanch/OneDrive/Desktop/hrms-updated/hrmsupdated/frontend/src/utils/apiConfig.js) to automatically detect which backend to use based on where the frontend is running.

## How It Works

### Automatic Detection Logic:

```javascript
if (hostname === 'localhost' || hostname === '127.0.0.1') {
  // Running locally → Use local backend
  return 'http://localhost:5003';
}

if (hostname === 'talentshield.co.uk') {
  // Running in production → Use production backend
  return 'https://talentshield.co.uk';
}
```

## Usage Scenarios

### Scenario 1: Local Development ✅
**Frontend**: `http://localhost:3000`  
**Backend**: `http://localhost:5003`  
**Auto-detects**: ✅ Uses localhost backend

### Scenario 2: Production Deployment ✅
**Frontend**: `https://talentshield.co.uk`  
**Backend**: `https://talentshield.co.uk`  
**Auto-detects**: ✅ Uses production backend

### Scenario 3: Custom Override (Optional) ✅
Create `frontend/.env.local`:
```env
REACT_APP_API_BASE_URL=http://localhost:5003
```
**Override**: ✅ Uses specified URL regardless of hostname

## Testing the Configuration

### Step 1: Restart Frontend
```bash
# Stop frontend (Ctrl + C)
cd frontend
npm start
```

### Step 2: Check Browser Console
Look for this message when app loads:
```
🔧 API Config loaded
   Hostname: localhost
   Will use API: http://localhost:5003
```

### Step 3: Verify API Calls
Open browser Network tab:
- All API calls should go to `http://localhost:5003/api/*`
- ✅ No more calls to `https://talentshield.co.uk`

### Step 4: Test on Different Pages
Navigate to:
- ✅ Dashboard → Should load
- ✅ Profiles → Should load (no CORS errors)
- ✅ Rota Management → Should load
- ✅ Clock-Ins → Should load

## Debug Helper

If you need to check the API configuration at runtime, open browser console and run:

```javascript
import { logApiConfig } from './utils/apiConfig';
logApiConfig();
```

Output:
```
🔧 API Configuration:
   Current hostname: localhost
   API Base URL: http://localhost:5003
   Environment: LOCAL DEV
```

## Environment Variables (Optional Override)

You can still use environment variables to override the auto-detection:

### For Local Development
Create `frontend/.env.local`:
```env
REACT_APP_API_BASE_URL=http://localhost:5003
```

### For Staging Environment
Create `frontend/.env.staging`:
```env
REACT_APP_API_BASE_URL=https://staging.talentshield.co.uk
```

### For Production
Edit `frontend/.env.production`:
```env
REACT_APP_API_BASE_URL=https://talentshield.co.uk
```

## Priority Order

The API URL is determined in this order:

1. **Environment Variable**: `REACT_APP_API_BASE_URL` (if set)
2. **Environment Variable**: `REACT_APP_API_URL` (if set)
3. **Auto-Detection**: Based on `window.location.hostname`
   - `localhost` → `http://localhost:5003`
   - `talentshield.co.uk` → `https://talentshield.co.uk`
4. **Default Fallback**: `http://localhost:5003`

## Benefits

✅ **No Manual Configuration**: Works automatically in dev and prod  
✅ **No .env Changes**: Same code works everywhere  
✅ **Easy Debugging**: Console logs show which API is used  
✅ **Override Support**: Can still use .env for special cases  
✅ **Safe Deployment**: Production automatically uses production API  

## Troubleshooting

### Still seeing production URLs?

**Solution 1**: Hard refresh browser
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

**Solution 2**: Clear browser cache
1. Open DevTools (F12)
2. Right-click Refresh button
3. Select "Empty Cache and Hard Reload"

**Solution 3**: Check if .env has override
```bash
# Check frontend/.env
cat frontend/.env | grep REACT_APP_API
```

If you see:
```env
REACT_APP_API_BASE_URL=https://talentshield.co.uk
```

Either:
- Remove that line, OR
- Change it to: `REACT_APP_API_BASE_URL=http://localhost:5003`

### Console shows wrong API?

Check your browser's address bar:
- Should be: `http://localhost:3000`
- Not: `http://192.168.x.x:3000` (use localhost instead)

## Next Steps

1. ✅ Restart frontend server
2. ✅ Check console for API config message
3. ✅ Verify all pages load correctly
4. ✅ Test creating/editing data
5. ✅ Deploy to production (auto-detects production API)

---

**Status**: ✅ AUTO-DETECTION ENABLED - Restart frontend to apply
