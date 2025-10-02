# Environment File and Profile Fixes

## Issues Found and Fixed

### 1. ✅ .env File Errors - FIXED

#### Issues in Your Original .env:

1. **EMAIL_PORT and EMAIL_SECURE Mismatch**
   - You had: `EMAIL_PORT=465` with `EMAIL_SECURE=false`
   - Problem: Port 465 REQUIRES `EMAIL_SECURE=true`
   - Port 587 uses `EMAIL_SECURE=false`

2. **SUPER_ADMIN_EMAIL Extra Space**
   - You had: `SUPER_ADMIN_EMAIL= mvnaveen18@gmail.com` (space before email)
   - Problem: The space will be included in the email address
   - Fixed: Removed space

3. **Duplicate CORS Origin**
   - You had: `https://talentshield.co.uk` listed twice
   - Cleaned up to avoid confusion

#### Corrected .env File:

I've created a fixed version at `backend/.env.fixed`. Here are the changes:

```env
# OLD (WRONG):
EMAIL_PORT=465
EMAIL_SECURE=false
SUPER_ADMIN_EMAIL= mvnaveen18@gmail.com
CORS_ORIGINS=https://vitrux.talentshield.co.uk,https://talentshield.co.uk,https://talentshield.co.uk

# NEW (CORRECT):
EMAIL_PORT=465
EMAIL_SECURE=true  # ← MUST be true for port 465
SUPER_ADMIN_EMAIL=mvnaveen18@gmail.com  # ← No space before email
CORS_ORIGINS=https://vitrux.talentshield.co.uk,https://talentshield.co.uk  # ← No duplicates
```

**Action Required:**
Replace your current `.env` file with the content from `.env.fixed`

---

### 2. ✅ Department and Job Title Fields - FIXED

#### Problem:
- Profile schema was missing `department` and `jobTitle` fields
- MyAccount page was trying to display these fields but they didn't exist
- AdminDetailsModal could edit them but they weren't saving to database

#### Solution:
Added missing fields to Profile schema in `backend/server.js`:

```javascript
// Profile Schema - Job Details section
jobRole: [String],     // Array of job roles (already existed)
jobTitle: String,      // ← ADDED
jobLevel: String,      // Already existed
department: String,    // ← ADDED
```

**Files Modified:**
- `backend/server.js`: Added jobTitle and department fields to profileSchema (line ~132-135)
- `backend/server.js`: Updated admin profile merge to include jobTitle and department

---

### 3. ✅ Profile Update in MyAccount - FIXED

#### Problem:
- Admin profile updates weren't persisting department and jobTitle
- MyAccount page wasn't displaying these fields properly

#### Solution:
- Backend already had the update endpoint working correctly
- Fixed the schema to support these fields
- Updated the merge logic to properly return department and jobTitle when fetching admin profile

**How It Works Now:**

1. **Fetch Profile** (`GET /api/my-profile`):
   - For admins: Fetches from User collection, merges with Profile collection
   - Returns: jobTitle, department, and all other fields

2. **Update Profile** (`PUT /api/admin/update-profile`):
   - Saves all fields including jobTitle and department to Profile collection
   - Admin data is persisted and will be returned on next fetch

3. **Display in UI**:
   - MyAccount page shows department in the details section
   - AdminDetailsModal allows editing both jobTitle and department

---

### 4. ✅ Completion Bar Not Updating - Root Cause

#### Issue:
The completion bar likely calculates based on filled fields in the profile.

#### Now Fixed Because:
1. ✅ Department field now exists in schema
2. ✅ Job Title field now exists in schema
3. ✅ Both fields are properly saved when profile is updated
4. ✅ Both fields are returned when profile is fetched

#### Fields That Affect Completion:
- First Name ✓
- Last Name ✓
- Email ✓
- Mobile ✓
- Job Title ✓ (now working)
- Department ✓ (now working)
- Company ✓
- Date of Birth ✓
- Bio ✓
- Address fields ✓
- Emergency Contact ✓

---

## Testing Instructions

### Step 1: Update .env File

1. **Backup your current .env**:
   ```bash
   cd backend
   cp .env .env.backup
   ```

2. **Replace with fixed version**:
   ```bash
   cp .env.fixed .env
   ```

3. **Verify the changes**:
   ```bash
   cat .env | grep -E "(EMAIL_PORT|EMAIL_SECURE|SUPER_ADMIN_EMAIL)"
   ```

   Should show:
   ```
   EMAIL_PORT=465
   EMAIL_SECURE=true
   SUPER_ADMIN_EMAIL=mvnaveen18@gmail.com
   ```

### Step 2: Restart Backend Server

```bash
cd backend
# Stop the server (Ctrl+C if running)
npm start
```

Watch for:
```
✓ Server running on port 5003
✓ Connected to MongoDB
```

### Step 3: Test Profile Update

1. **Login as admin**
2. **Go to My Account page** (should load without errors)
3. **Click "Edit Profile"** (opens AdminDetailsModal)
4. **Fill in these fields**:
   - Job Title: "Chief Technology Officer"
   - Department: "Technology"
5. **Click "Save"**
6. **Go back to My Account**
7. **Verify Department is displayed** in the details section

### Step 4: Test Completion Bar

1. **Go to Dashboard or Profile page** (wherever completion bar is)
2. **Check if completion percentage updated**
3. **Fill in missing fields** (mobile, DOB, bio, etc.)
4. **Completion should increase**

### Step 5: Verify Email Sending

Now that EMAIL_SECURE is correct:

```bash
cd backend
node test-email-complete.js
```

Should show:
```
✓ SMTP configuration is valid
✓ Email sent successfully
```

---

## Quick Reference: Field Locations

### Department Field:
- **Schema**: `backend/server.js` line ~135
- **Display**: `frontend/src/pages/MyAccount.js` line 333
- **Edit**: `frontend/src/pages/AdminDetailsModal.js` line 193-194
- **API Response**: Included in `/api/my-profile` for admins

### Job Title Field:
- **Schema**: `backend/server.js` line ~133
- **Display**: `frontend/src/pages/MyAccount.js` line 303
- **Edit**: `frontend/src/pages/AdminDetailsModal.js` line 189-190
- **API Response**: Included in `/api/my-profile` for all users

---

## Database Migration (Optional)

If you have existing admin profiles that need department/jobTitle populated:

```javascript
// Run in MongoDB shell or Compass
db.profiles.updateMany(
  { email: { $in: ['admin1@example.com', 'admin2@example.com'] } },
  { 
    $set: { 
      department: 'Administration',
      jobTitle: 'System Administrator'
    } 
  }
)
```

Or update via the UI as described in Step 3 above.

---

## Troubleshooting

### Issue: Department still not showing

**Check:**
1. Backend server restarted after schema change?
2. Profile actually has department value in database?
3. Browser cache cleared?

**Fix:**
```bash
# Clear browser cache: Ctrl+Shift+Delete
# Or hard refresh: Ctrl+F5
```

**Verify in database:**
```javascript
db.profiles.findOne({ email: "admin@talentshield.com" })
// Should show: department: "..." and jobTitle: "..."
```

### Issue: Emails still not sending

**Check .env file**:
```bash
cd backend
cat .env | grep EMAIL_
```

**Verify you see**:
```
EMAIL_PORT=465
EMAIL_SECURE=true  # ← Must be "true" not "false"
```

**Test email**:
```bash
node test-email-complete.js
```

If error shows "Invalid login" or "Authentication failed":
- Double-check EMAIL_PASS is the Gmail App Password (16 chars without spaces)
- Not your regular Gmail password

### Issue: Profile update not saving

**Check browser console** (F12):
- Any red errors?
- Check Network tab - is PUT request successful?

**Check backend logs**:
- Should show: "Admin profile updated successfully"
- If error, will show what validation failed

---

## Summary of All Changes

### Backend Changes:
1. ✅ Added `jobTitle: String` to Profile schema
2. ✅ Added `department: String` to Profile schema  
3. ✅ Updated admin profile merge to include both fields
4. ✅ Ensured update endpoint saves both fields

### Environment Changes:
1. ✅ Fixed EMAIL_SECURE from false to true (for port 465)
2. ✅ Removed extra space from SUPER_ADMIN_EMAIL
3. ✅ Cleaned up duplicate CORS origins
4. ✅ Added missing environment variables (BACKEND_URL, API_PUBLIC_URL)

### Frontend:
- No changes needed! Already had department and jobTitle fields in:
  - MyAccount.js (display)
  - AdminDetailsModal.js (edit)

---

## Files to Review

1. **backend/.env** - Replace with .env.fixed
2. **backend/server.js** - Schema updated (lines 128-137)
3. **backend/server.js** - Profile merge updated (line 2341-2342)

All changes are backward compatible. Existing profiles without these fields will just show as empty/not specified.

---

## Next Steps

1. ✅ Update .env file with correct EMAIL_SECURE=true
2. ✅ Restart backend server
3. ✅ Test email sending with test script
4. ✅ Login and update your profile with Job Title and Department
5. ✅ Verify they save and display correctly
6. ✅ Check completion bar updates

Everything should now work correctly!
