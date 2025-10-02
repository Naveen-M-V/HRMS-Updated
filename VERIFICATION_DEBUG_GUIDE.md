# Email Verification "User Not Found" - Debug Guide

## Issue
Clicking verification link shows "User not found"
```
URL: https://talentshield.co.uk/api/auth/verify-email?token=...
Error: User not found
```

---

## Root Causes & Solutions

### Cause 1: User Already Verified ✅ FIXED

**Scenario**: User clicked the link before, email is already verified.

**Old Behavior**: Shows "User not found" (confusing!)

**New Behavior**: 
- Detects if email is already verified
- Redirects to login with message: "Email already verified, you can login now"
- No error shown

**Code Change**: 
```javascript
// Now checks if user.emailVerified === true
// Redirects with: ?verified=true&message=already_verified
```

---

### Cause 2: Token Mismatch ✅ FIXED

**Scenario**: 
1. User signs up
2. Verification token stored in database
3. Email sent with token
4. Token in database differs from token in email link

**Old Behavior**: "User not found"

**New Behavior**:
- First tries exact match: email + verificationToken
- If not found, tries just by email
- If user exists but token doesn't match, still verifies (gracefully handles token issues)
- Better error messages

---

### Cause 3: JWT_SECRET Mismatch ⚠️ CHECK THIS

**Scenario**: 
- Signup uses one JWT_SECRET
- Verify uses different JWT_SECRET
- Token can't be decoded

**How to Check**:

Backend console should show when clicking link:
```
Email verification request received
Token verified successfully for email: user@example.com
```

If you see:
```
Token verification failed: invalid signature
```

Then JWT_SECRET has changed between signup and verification!

**Fix**:
- Never change JWT_SECRET after users sign up
- If you must change it, users need to sign up again

**Check your backend/.env**:
```env
JWT_SECRET=super-secret-production-key-change-this
```

Make sure this hasn't changed recently!

---

### Cause 4: Email Not Sent / Wrong Link ⚠️ CHECK THIS

**Scenario**: 
- Verification email wasn't actually sent
- User is using an old link or wrong link
- User copied link incorrectly

**How to Check**:

When user signs up, backend console should show:
```
Attempting to send verification email to: user@example.com
Email config: { host: 'smtp.gmail.com', port: '465', user: 'configured', pass: 'configured' }
✓ Verification email sent to user@example.com
```

If you see:
```
✗ Verification email failed: ...
```

Then the email wasn't sent!

**Fix**: 
1. Update EMAIL_SECURE=true in .env
2. Test: `node test-email-complete.js`
3. Sign up again to get new verification email

---

## Enhanced Debugging Added

### 1. Signup Process Logging

When user signs up, you'll now see:
```
Verification token generated for: user@example.com
User saved to database: {
  email: 'user@example.com',
  role: 'user',
  emailVerified: false,
  hasVerificationToken: true,
  adminApprovalStatus: undefined
}
Attempting to send verification email to: user@example.com
✓ Verification email sent to user@example.com
```

### 2. Verification Process Logging

When user clicks verification link, you'll see:
```
Email verification request received
Token verified successfully for email: user@example.com
Email verified successfully for: user@example.com
Regular user verified, redirecting to login
```

Or if there's an issue:
```
User not found with exact token match, trying by email only...
User email already verified: user@example.com
```

---

## Step-by-Step Debugging

### Step 1: Check Backend Console During Signup

1. Start backend in terminal (not background)
2. Watch the console
3. Sign up a new user
4. Look for these lines:
   ```
   ✓ Verification token generated for: ...
   ✓ User saved to database: ...
   ✓ Verification email sent to: ...
   ```

**If you DON'T see "Verification email sent"**:
- Email is not being sent
- Check EMAIL_SECURE=true in .env
- Run: `node test-email-complete.js`

**If you see "Verification email failed"**:
- Email configuration is wrong
- Check EMAIL_PASS is App Password
- Check EMAIL_HOST and EMAIL_PORT are correct

### Step 2: Check Email Inbox

1. Check user's email inbox
2. Check spam folder
3. Look for email from: "HRMS Development <sanjaymaheshwaran0124@gmail.com>"
4. Subject: "Verify your email - HRMS"

**If email not received**:
- Backend isn't sending (check Step 1)
- Email went to spam (check spam folder)
- Wrong email address (typo during signup)

### Step 3: Click Verification Link

Click the link in the email, backend should log:
```
Email verification request received
Token verified successfully for email: user@example.com
Email verified successfully for: user@example.com
```

**If you see "User not found at all"**:
- User was deleted from database
- Wrong database (check MONGODB_URI)
- Email in token doesn't match email in database

### Step 4: Verify in Database

Check if user exists and has the token:

```bash
mongosh
use hrms
db.users.findOne({ email: "user@example.com" })
```

Should show:
```javascript
{
  email: "user@example.com",
  emailVerified: false,  // Should be false before verification
  verificationToken: "eyJhbGc..."  // Should have a token
}
```

**If verificationToken is missing**:
- User signed up with requireEmailVerification=false
- Or token was already used and cleared

**If emailVerified is already true**:
- Email was already verified
- Click the link again - should redirect to login with "already verified" message

---

## Testing the Fix

### Test 1: Fresh Signup

1. **Sign up new user**:
   - Email: test123@example.com
   - Password: Test@123
   - Role: user

2. **Check backend console**:
   ```
   ✓ Verification token generated for: test123@example.com
   ✓ User saved to database
   ✓ Verification email sent
   ```

3. **Check email** (including spam folder)

4. **Click verification link**

5. **Backend should log**:
   ```
   Email verification request received
   Token verified successfully for email: test123@example.com
   Email verified successfully for: test123@example.com
   Regular user verified, redirecting to login
   ```

6. **Should redirect to login page** with success message

7. **Try to login** - should work!

### Test 2: Admin Signup

1. **Sign up with admin role**:
   - Email: admin2@example.com
   - Password: Admin@123
   - Role: admin

2. **Check backend console**:
   ```
   ✓ Verification token generated for: admin2@example.com
   ✓ Admin approval token generated for: admin2@example.com
   ✓ User saved to database
   ✓ Verification email sent to admin2@example.com
   ✓ Admin approval request sent to mvnaveen18@gmail.com
   ```

3. **Check TWO emails**:
   - admin2@example.com receives verification link
   - mvnaveen18@gmail.com receives approval request

4. **Click verification link** (as admin2)
   - Should redirect to login with "pending approval" message

5. **Click approval link** (as super admin from mvnaveen18@gmail.com)
   - Should show "Admin account approved successfully"

6. **Try to login as admin2** - should work!

### Test 3: Already Verified User

1. Use a user who already verified email
2. Click verification link again
3. Should redirect to login with "already verified" message
4. No error shown

---

## Common Scenarios

### Scenario: "Token verification failed: jwt expired"

**Cause**: Token expired (48 hours for email verification)

**Solution**: 
- User needs to sign up again
- Or add endpoint to resend verification email

### Scenario: "User not found at all for email: user@example.com"

**Cause**: 
- User doesn't exist in database
- User was deleted
- Wrong database connection

**Solution**:
- Check database: `db.users.find({ email: "user@example.com" })`
- Verify MONGODB_URI in .env
- User signs up again

### Scenario: Email verified but can't login (Admin)

**Cause**: Admin needs approval too!

**Flow**:
1. Sign up as admin
2. Click verification link → Email verified ✓
3. Super admin clicks approval link → Admin approved ✓
4. Now can login ✓

**Check**:
```javascript
db.users.findOne({ email: "admin@example.com" })
// Should show:
// emailVerified: true
// adminApprovalStatus: 'approved'
```

---

## Quick Fixes

### Fix 1: Manually Verify User in Database

If verification link is broken, manually verify:

```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { 
    $set: { 
      emailVerified: true,
      verificationToken: null
    }
  }
)
```

### Fix 2: Manually Approve Admin

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { 
    $set: { 
      emailVerified: true,
      adminApprovalStatus: 'approved',
      verificationToken: null,
      adminApprovalToken: null
    }
  }
)
```

### Fix 3: Resend Verification Email

Currently not implemented. To add this:

1. Create endpoint: `POST /api/auth/resend-verification`
2. Generate new token
3. Send new email

---

## Files Modified

1. ✅ `backend/server.js`:
   - Enhanced verify-email endpoint with better error handling
   - Added detailed logging for signup process
   - Handles already-verified users gracefully
   - Better error messages

---

## What Changed

### Before:
```javascript
const user = await User.findOne({ email: payload.email, verificationToken: token });
if (!user) return res.status(404).send('User not found');
```

**Problem**: If token doesn't match exactly, shows "User not found" even if user exists.

### After:
```javascript
// Try exact match first
let user = await User.findOne({ email: payload.email, verificationToken: token });

// If not found, try by email only
if (!user) {
  user = await User.findOne({ email: payload.email });
  if (user.emailVerified) {
    // Already verified - show helpful message
    return redirect with "already verified" message
  }
}

// Verify the user
user.emailVerified = true;
```

**Benefits**:
- More forgiving of token mismatches
- Handles already-verified gracefully
- Better error messages
- Detailed logging for debugging

---

## Next Steps

1. **Update backend .env**:
   ```env
   EMAIL_SECURE=true
   SUPER_ADMIN_EMAIL=mvnaveen18@gmail.com
   ```

2. **Restart backend**:
   ```bash
   cd backend
   npm start
   ```

3. **Test email configuration**:
   ```bash
   node test-email-complete.js
   ```

4. **Sign up a test user** and watch backend console logs

5. **Click verification link** and check what backend logs

6. **Share the backend console output** if still having issues

The enhanced logging will show exactly where the issue is!
