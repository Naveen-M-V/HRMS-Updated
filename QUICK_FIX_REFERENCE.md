# Quick Fix Reference - Do This NOW

## 🔴 URGENT: Fix These 3 Issues

### 1. Backend .env - Change This Line:

**File**: `backend/.env` (Line ~26)

**CHANGE FROM**:
```env
EMAIL_SECURE=false
```

**CHANGE TO**:
```env
EMAIL_SECURE=true
```

**Why**: Port 465 requires secure connection. This is why emails aren't sending!

---

### 2. Backend .env - Remove Space:

**File**: `backend/.env` (Line ~36)

**CHANGE FROM**:
```env
SUPER_ADMIN_EMAIL= mvnaveen18@gmail.com
```

**CHANGE TO**:
```env
SUPER_ADMIN_EMAIL=mvnaveen18@gmail.com
```

**Why**: Extra space breaks the email address.

---

### 3. Frontend .env - Remove /api:

**File**: `frontend/.env`

Check if you have:
```env
REACT_APP_API_BASE_URL=https://talentshield.co.uk/api
```

**CHANGE TO**:
```env
REACT_APP_API_BASE_URL=https://talentshield.co.uk
```

**Why**: This causes the duplicate /api/api/ error.

---

## After Making These Changes:

### Restart Backend:
```bash
cd backend
# Press Ctrl+C to stop
npm start
```

### Restart Frontend:
```bash
cd frontend  
# Press Ctrl+C to stop
npm start
```

### Test Email:
```bash
cd backend
node test-email-complete.js
```

Should show: "✓ Email sent successfully"

---

## Expected Results After Fix:

✅ **Login** - Works without 400 error  
✅ **Signup** - Sends verification email  
✅ **Admin Signup** - Sends approval email to mvnaveen18@gmail.com  
✅ **Delete Certificate File** - Works without 404 error  
✅ **Department Field** - Shows and updates in My Account  
✅ **Job Title Field** - Shows and updates in My Account  
✅ **Completion Bar** - Updates when you fill department/job title  

---

## If Still Having Issues:

### Email Not Sending:
Check that `vxkezkltztihyxih` is actually your Gmail App Password:
1. Go to: https://myaccount.google.com/apppasswords
2. Generate new App Password
3. Replace EMAIL_PASS value
4. Restart backend

### Certificate Delete Still 404:
Check frontend .env has NO /api at the end of URL.

### Login 400 Error:
Open browser console (F12) and share the error message.

---

## Summary of Files Changed Today:

| File | What Changed | Status |
|------|--------------|--------|
| `backend/server.js` | Added jobTitle, department fields | ✅ Done |
| `backend/server.js` | Added DELETE /api/certificates/:id/file endpoint | ✅ Done |
| `backend/server.js` | Enhanced login/email logging | ✅ Done |
| `backend/utils/emailService.js` | Added admin credential emails | ✅ Done |
| `frontend/src/utils/apiConfig.js` | NEW - URL builder utility | ✅ Done |
| `frontend/src/pages/ViewCertificate.js` | Fixed delete file function | ✅ Done |
| `frontend/src/pages/CreateCertificate.js` | Mandatory/Alternative certs | ✅ Done |
| `frontend/src/components/MultiJobRoleSelector.js` | Uses 93 hardcoded roles | ✅ Done |
| `frontend/src/data/certificateJobRoleMapping.js` | Enhanced helper functions | ✅ Done |

**ALL CHANGES DONE - Just need to update .env files and restart!**
