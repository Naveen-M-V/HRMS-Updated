# 🔧 Fix All Hardcoded API URLs

## Files That Need Fixing

The following files still have hardcoded `https://talentshield.co.uk` URLs:

1. ✅ `frontend/src/components/JobLevelDropdown.js` - FIXED
2. ✅ `frontend/src/pages/ProfilesCreate.js` - FIXED  
3. ❌ `frontend/src/components/JobRoleCheckboxPicker.js` - NEEDS FIX
4. ❌ `frontend/src/components/JobTitleDropdown.js` - NEEDS FIX
5. ❌ `frontend/src/pages/MyAccount.js` - NEEDS FIX
6. ❌ `frontend/src/pages/ProfilesPage.js` - NEEDS FIX
7. ❌ `frontend/src/pages/VerifyOTP.js` - NEEDS FIX
8. ❌ `frontend/src/utils/config.js` - NEEDS FIX

## Quick Fix Instructions

For each file that needs fixing:

### Pattern to Find and Replace:

**FIND:**
```javascript
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  return process.env.REACT_APP_API_URL || 'https://talentshield.co.uk';
};
```

**OR** any variation of:
```javascript
process.env.REACT_APP_API_URL || 'https://talentshield.co.uk'
'https://talentshield.co.uk'
```

**REPLACE WITH:**
1. Add import at top:
```javascript
import { buildApiUrl } from '../utils/apiConfig';
```

2. Remove the `getApiUrl()` function

3. Replace all fetch calls:
```javascript
// OLD
fetch(`${getApiUrl()}/api/endpoint`)
// NEW
fetch(buildApiUrl('/endpoint'))
```

## Automated Fix (Recommended)

I'll provide the fixes for each file below. Apply them in order.

---

## File Fixes

### 1. JobRoleCheckboxPicker.js

**Add import:**
```javascript
import { buildApiUrl } from '../utils/apiConfig';
```

**Remove lines 15-20** (the getApiUrl function)

**Line 30 - Change from:**
```javascript
const response = await fetch(`${getApiUrl()}/api/job-roles`);
```

**To:**
```javascript
const response = await fetch(buildApiUrl('/job-roles'));
```

---

### 2. JobTitleDropdown.js

Same pattern as JobRoleCheckboxPicker.js

---

### 3. MyAccount.js

**Find all instances of:**
```javascript
const apiUrl = process.env.REACT_APP_API_URL || 'https://talentshield.co.uk';
```

**Replace with:**
```javascript
import { buildApiUrl } from '../utils/apiConfig';
```

And change fetch calls accordingly.

---

### 4. ProfilesPage.js

**Find:**
```javascript
return process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || "https://talentshield.co.uk";
```

**Replace with:**
```javascript
import { buildApiUrl } from '../utils/apiConfig';
```

---

### 5. VerifyOTP.js

**Find:**
```javascript
const response = await fetch('http://talentshield.co.uk/api/auth/verify-otp', {
```

**Replace with:**
```javascript
import { buildApiUrl } from '../utils/apiConfig';
const response = await fetch(buildApiUrl('/auth/verify-otp'), {
```

---

## After Fixing All Files

1. **Restart frontend:**
```bash
cd frontend
npm start
```

2. **Test these pages:**
- ✅ Dashboard
- ✅ Profiles Create
- ✅ Profiles List
- ✅ My Account
- ✅ Login/Verify OTP
- ✅ Rota Management

3. **Verify in browser console:**
- No calls to `https://talentshield.co.uk`
- All calls go to `http://localhost:5003`

---

## Or Use Find & Replace in VS Code

1. Open VS Code
2. Press `Ctrl + Shift + H` (Find and Replace in Files)
3. Set search location to: `frontend/src`

**Search for:**
```
'https://talentshield.co.uk'
```

**Manual review each result** and replace with appropriate `buildApiUrl()` usage.

---

**Status**: 2/8 files fixed. 6 more to go.
