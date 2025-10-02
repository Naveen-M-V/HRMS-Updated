# Frontend Environment Configuration Fix

## Issue: Duplicate /api in URLs

### Problem Found:
The error showed:
```
DELETE https://talentshield.co.uk/api/api/certificates/...
                                    ^^^^^^^^ DUPLICATE!
```

This happens when:
- Frontend .env has: `REACT_APP_API_BASE_URL=https://talentshield.co.uk/api`
- Code adds: `/api/certificates/...`
- Result: `/api/api/certificates/...` ❌

---

## Solution Implemented

### 1. Created API Configuration Utility

**New File**: `frontend/src/utils/apiConfig.js`

This utility provides:
- `buildApiUrl(path)` - Automatically handles /api construction
- `getApiBaseUrl()` - Gets base URL without /api
- `getImageUrl(path)` - Handles image URLs
- Prevents duplicate /api in URLs

### 2. Updated ViewCertificate.js

**Changes**:
- Imported `buildApiUrl` utility
- Uses `buildApiUrl('/certificates/:id/file')` instead of manual concatenation
- Now correctly builds URL regardless of .env configuration
- Added Authorization header for better security

---

## Frontend .env Configuration

### Recommended Configuration:

**For Development** (`frontend/.env.development`):
```env
REACT_APP_API_BASE_URL=http://localhost:5003
REACT_APP_API_URL=http://localhost:5003
```

**For Production** (`frontend/.env`):
```env
REACT_APP_API_BASE_URL=https://talentshield.co.uk
REACT_APP_API_URL=https://talentshield.co.uk
```

### ❌ DO NOT Include /api in the URL:
```env
# WRONG:
REACT_APP_API_BASE_URL=https://talentshield.co.uk/api

# CORRECT:
REACT_APP_API_BASE_URL=https://talentshield.co.uk
```

The `/api` prefix is automatically added by the utility function!

---

## How It Works Now

### Old Way (Caused Duplicates):
```javascript
const apiUrl = process.env.REACT_APP_API_BASE_URL; 
// If this was "https://talentshield.co.uk/api"

const url = `${apiUrl}/api/certificates/${id}/file`;
// Result: "https://talentshield.co.uk/api/api/certificates/..." ❌
```

### New Way (Fixed):
```javascript
import { buildApiUrl } from '../utils/apiConfig';

const url = buildApiUrl(`/certificates/${id}/file`);
// Result: "https://talentshield.co.uk/api/certificates/..." ✅
```

The utility:
1. Gets base URL: `https://talentshield.co.uk`
2. Removes any `/api` suffix if present
3. Adds `/api` + your path
4. Returns: `https://talentshield.co.uk/api/certificates/...`

---

## Testing the Fix

### 1. Update Frontend .env

Edit `frontend/.env`:
```env
REACT_APP_API_BASE_URL=https://talentshield.co.uk
REACT_APP_API_URL=https://talentshield.co.uk
```

**Important**: No `/api` at the end!

### 2. Restart Frontend

```bash
cd frontend
npm start
```

### 3. Test Certificate File Delete

1. Login to application
2. Go to a certificate with a file
3. Click "View" button
4. Click "Delete File" button
5. Confirm deletion
6. Check browser console - should show:
   ```
   Deleting certificate file from: https://talentshield.co.uk/api/certificates/68de1f7b.../file
   ```
   (Only ONE `/api`)

7. Should succeed with 200 status

### 4. Verify in Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Perform the delete action
4. Find the DELETE request
5. Check URL - should have only ONE `/api`

---

## Other Files That May Need This Utility

The following files also use `REACT_APP_API_BASE_URL` and may benefit from using the utility:

- `frontend/src/context/CertificateContext.js`
- `frontend/src/context/ProfileContext.js`
- `frontend/src/context/AuthContext.js`
- `frontend/src/pages/ProfileDetailView.js`
- `frontend/src/pages/CreateCertificate.js`
- `frontend/src/pages/EditCertificate.js`
- `frontend/src/pages/ProfilesPage.js`

**Recommendation**: Gradually migrate these to use `buildApiUrl()` to prevent future duplicate /api issues.

---

## Quick Fix for Right Now

### Option 1: Update .env (Recommended)

**Edit `frontend/.env`**:
```env
# Remove /api from the end
REACT_APP_API_BASE_URL=https://talentshield.co.uk
```

Then restart frontend:
```bash
npm start
```

### Option 2: Keep .env as-is

If you want to keep `/api` in your .env, the new `buildApiUrl()` utility handles it automatically by detecting and removing it before adding it back correctly.

Either way works with the new utility!

---

## Email Debugging

Since you mentioned verification and authorization emails aren't being sent, here's how to debug:

### 1. Check Backend .env Email Settings

Your current settings (from what you showed):
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true  # ← You need to change this from false to true!
EMAIL_USER=sanjaymaheshwaran0124@gmail.com
EMAIL_PASS=vxkezkltztihyxih
```

**Critical**: With port 465, you MUST have `EMAIL_SECURE=true`

### 2. Test Email Configuration

```bash
cd backend
node test-email-complete.js
```

Expected output:
```
SMTP configuration is valid
Test email sent successfully
```

If you get an error:
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

Then:
1. Verify EMAIL_PASS is a Gmail App Password (not regular password)
2. Go to: https://myaccount.google.com/apppasswords
3. Generate new App Password
4. Update EMAIL_PASS in .env

### 3. Check Backend Logs When Signing Up

When you sign up, backend should log:
```
Attempting to send verification email to: user@example.com
Email config: {
  host: 'smtp.gmail.com',
  port: '465',
  user: 'configured',
  pass: 'configured'
}
✓ Verification email sent to user@example.com
```

If you see:
```
✗ Verification email failed: ...
```

Then there's an email configuration issue.

### 4. Check Spam Folder

Gmail sometimes marks automated emails as spam. Check:
1. Spam folder
2. All Mail folder
3. Promotions tab

---

## Complete Checklist

### Backend .env:
- [ ] EMAIL_PORT=465
- [ ] EMAIL_SECURE=true (NOT false!)
- [ ] EMAIL_USER set correctly
- [ ] EMAIL_PASS is App Password (16 chars)
- [ ] SUPER_ADMIN_EMAIL=mvnaveen18@gmail.com (no space!)
- [ ] CORS_ORIGINS correct

### Frontend .env:
- [ ] REACT_APP_API_BASE_URL=https://talentshield.co.uk (NO /api at end!)
- [ ] REACT_APP_API_URL=https://talentshield.co.uk

### Testing:
- [ ] Backend restart: `npm start`
- [ ] Frontend restart: `npm start`
- [ ] Test email: `node test-email-complete.js`
- [ ] Try signup - check for verification email
- [ ] Try admin signup - check for approval email to mvnaveen18@gmail.com
- [ ] Try certificate file delete - should work without 404

---

## Files Modified in This Fix

1. ✅ `frontend/src/utils/apiConfig.js` - NEW utility file
2. ✅ `frontend/src/pages/ViewCertificate.js` - Uses buildApiUrl()
3. ✅ `backend/.env.fixed` - Corrected configuration
4. ✅ `backend/server.js` - Added jobTitle and department to schema

All changes are backward compatible!
