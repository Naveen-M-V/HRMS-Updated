# HRMS System - Bugs and Inconsistencies Report

## CRITICAL: Job Role vs Job Title Confusion

### The Problem
The system has **TWO separate concepts** that are being used interchangeably:
- `jobRole` - Should be: What the person does (e.g., "Fibre Jointing")
- `jobTitle` - Should be: What position they hold (e.g., "Senior Engineer")

**BUT the code treats them as THE SAME THING!**

---

## Major Inconsistencies

### 1. **Backend Schema Duplication**
```javascript
// Profile Schema (server.js:128-129)
jobRole: [String],    // Array
jobTitle: [String],   // Array - DUPLICATES jobRole!

// Certificate Schema (server.js:294)
jobRole: String,      // Single string - DIFFERENT TYPE!

// Separate Collections (shouldn't exist)
- JobRole collection (with its own schema)
- JobTitle collection (with its own schema)
```

**Issue**: Profiles store BOTH as arrays with same data. Certificates store as single string.

### 2. **Frontend Components - 3 Different Dropdowns for Same Thing**
- `JobRoleDropdown.js` - Default name: "jobRole"
- `JobTitleDropdown.js` - Default name: "jobTitle"  
- `MultiJobRoleSelector.js` - Default name: "jobTitle" (but named "JobRole")
- `JobRoleCheckboxPicker.js` - Another duplicate

**Issue**: Multiple components doing the same job, causing confusion.

### 3. **Data Type Inconsistencies**

**Arrays vs Strings Throughout:**
```javascript
// ProfilesCreate.js (line 257-258)
jobRole: Array.isArray(formData.jobRole) ? formData.jobRole : [formData.jobRole],
jobTitle: Array.isArray(formData.jobRole) ? formData.jobRole : [formData.jobRole],

// EditUserProfile.js (line 99)
jobTitle: profile.jobTitle || (Array.isArray(profile.jobRole) ? profile.jobRole.join(', ') : profile.jobRole)

// EditUserProfile.js (lines 175-176) - Saves SAME data to BOTH fields
jobRole: formData.jobTitle.split(',').map(role => role.trim()),
jobTitle: formData.jobTitle.split(',').map(role => role.trim())
```

**Issue**: Constant conversion between arrays and comma-separated strings. Data stored twice.

### 4. **CreateCertificate.js - Wrong Field Assignment**

```javascript
// Line 299 - CRITICAL BUG
jobRole: selectedProfile.jobTitle  // Uses jobTitle for jobRole field!

// Lines 407-418 - Display Confusion
<label>Job Role</label>
{profile.jobTitle}  // Shows jobTitle but labels it "Job Role"
```

**Issue**: Certificate gets the wrong data for jobRole field.

### 5. **EditProfile.js - Opposite Mapping**

```javascript
// Line 229 - Function named wrong
const handleJobTitleChange = (jobRole) => { ... }  // Parameter is jobRole!

// Line 258 - Reverse mapping
jobRole: formData.jobTitle  // Maps jobTitle TO jobRole
```

**Issue**: Backwards data flow.

### 6. **Display Components - Fallback Pattern (Acknowledges Problem)**

```javascript
// ProfileDetailView.js (lines 337-342)
const jobTitles = Array.isArray(p.jobTitle) ? p.jobTitle : (p.jobTitle ? [p.jobTitle] : []);
const jobRoles = Array.isArray(p.jobRole) ? p.jobRole : (p.jobRole ? [p.jobRole] : []);
const displayRoles = jobTitles.length > 0 ? jobTitles : jobRoles;

// ProfilesPage.js (lines 285-290) - Same pattern
```

**Issue**: Code tries jobTitle first, falls back to jobRole - shows developers know data is inconsistent.

---

## UNUSED/POTENTIALLY UNUSED FILES

### Definitely Unused (Not Referenced in Routes or Imports):

1. **Frontend Pages:**
   - `pages/EditProfile.js` - Imported but route `/editprofile` is NEVER navigated to
   - `pages/Profile.js` - Imported but route `/profile` is NEVER used
   - `pages/ResetPassword.js` - Not imported in App.js at all
   - `pages/VerifyOTP.js` - Not imported in App.js at all
   - `pages/ShareStaff.js` - Route exists but no navigation to `/sharestaff`
   - `pages/StaffDetail.js` - Route exists but no navigation to `/staffdetail`

2. **Frontend Components:**
   - `components/CertificateDemo.js` - Not imported anywhere
   - `components/taskard.js` - Not imported anywhere (typo? should be TaskCard?)
   - `components/Progressbar.js` - Not imported anywhere
   - `components/JobRoleCheckboxPicker.js` - Superseded by MultiJobRoleSelector
   - `components/JobTitleDropdown.js` - Should be consolidated

3. **Frontend Data:**
   - `data/new.js` - Unclear usage, needs verification

4. **Backend Test/Debug Scripts:**
   - `backend/test-email.js` - Test script
   - `backend/test-email-complete.js` - Test script
   - `backend/test-approval-url.js` - Test script
   - `backend/simple-fix.js` - One-time fix script
   - `backend/fix-approved-admin.js` - One-time fix script
   - `backend/find-admins.js` - Debug script
   - `backend/create-first-admin.js` - One-time setup script
   - `backend/debug-db.js` - Debug script

5. **Backend Utilities (Potentially Unused):**
   - `backend/utils/certificateMonitor.js` - Check if monitoring is active
   - `frontend/src/utils/errorHandler.js` - Not imported anywhere
   - `frontend/src/utils/jobRoleResolver.js` - Not imported anywhere
   - `frontend/src/utils/notificationUtils.js` - Not imported anywhere
   - `frontend/src/utils/profileCompleteness.js` - Not imported anywhere

6. **Test Files:**
   - `frontend/src/App.test.js` - Standard test file
   - `frontend/src/setupTests.js` - Test setup
   - `frontend/src/reportWebVitals.js` - Performance monitoring

---

## RECOMMENDED FIXES

### Phase 1: Decide on Single Field
**Decision needed:** Use ONLY `jobRole` OR `jobTitle`, not both.

**Recommended:** Use `jobRole` (more accurate for this system).

### Phase 2: Backend Changes
1. **Remove duplicate field from Profile schema**
2. **Convert Certificate.jobRole from String to [String]**
3. **Delete JobTitle collection** (if keeping jobRole)
4. **Migration script** to consolidate existing data

### Phase 3: Frontend Changes
1. **Delete unused components:**
   - JobTitleDropdown.js
   - JobRoleCheckboxPicker.js
   - Keep only MultiJobRoleSelector.js

2. **Update all forms to use single field:**
   - ProfilesCreate.js
   - EditUserProfile.js
   - CreateCertificate.js
   - EditProfile.js

3. **Remove conversion logic** (no more join/split)

4. **Fix CreateCertificate.js line 299** - Use correct field

### Phase 4: Clean Up
1. **Delete unused files** listed above
2. **Remove unused routes** from App.js
3. **Update API endpoints** to use single field name
4. **Update all display components**

---

## CRITICAL BUGS TO FIX IMMEDIATELY

### Bug #1: CreateCertificate Wrong Field
**File:** `CreateCertificate.js:299`
**Issue:** `jobRole: selectedProfile.jobTitle`
**Fix:** Use `jobRole: selectedProfile.jobRole`

### Bug #2: Duplicate Data Storage
**Files:** All profile creation/edit pages
**Issue:** Same data saved to both jobRole AND jobTitle
**Fix:** Save to only ONE field

### Bug #3: Array vs String Type Mismatch  
**Files:** Profile schema (arrays) vs Certificate schema (string)
**Issue:** Certificates can't handle multiple job roles
**Fix:** Change Certificate.jobRole to array type

### Bug #4: EditProfile Backwards Mapping
**File:** `EditProfile.js:258`
**Issue:** `jobRole: formData.jobTitle` (backwards)
**Fix:** Consistent field naming

---

## File Deletion Candidates (After Verification)

**High confidence (delete after confirming no usage):**
```
frontend/src/pages/EditProfile.js (duplicate of EditUserProfile)
frontend/src/pages/Profile.js (unused route)
frontend/src/pages/ResetPassword.js (not implemented)
frontend/src/pages/VerifyOTP.js (not implemented)
frontend/src/components/CertificateDemo.js
frontend/src/components/taskard.js
frontend/src/components/Progressbar.js
frontend/src/components/JobTitleDropdown.js
frontend/src/components/JobRoleCheckboxPicker.js
frontend/src/utils/errorHandler.js
frontend/src/utils/jobRoleResolver.js
frontend/src/utils/notificationUtils.js
frontend/src/utils/profileCompleteness.js
```

**Test/Debug scripts (safe to delete):**
```
backend/test-*.js
backend/simple-fix.js
backend/fix-approved-admin.js
backend/find-admins.js
backend/create-first-admin.js
backend/debug-db.js
```
