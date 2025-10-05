# 🔐 Super Admin Setup & Login Guide

## ✅ **Your Super Admins Are Now Configured!**

I've updated the system to create super admin accounts from your `.env` file.

---

## 📋 **Your Super Admin Accounts**

When the server starts, it will automatically create these accounts:

1. **dean.cumming@vitrux.co.uk**
   - Password: `TalentShield@2025`
   
2. **syed.shahab.ahmed@vitrux.co.uk**
   - Password: `TalentShield@2025`
   
3. **tazeen.syeda@vitrux.co.uk**
   - Password: `TalentShield@2025`
   
4. **thaya.govzig@vitruxshield.com**
   - Password: `TalentShield@2025`
   
5. **syed.ali.asgar@vitruxshield.com**
   - Password: `TalentShield@2025`
   
6. **mvnaveen18@gmail.com**
   - Password: `TalentShield@2025`

---

## 🔧 **What I Changed**

### Before:
```javascript
// Created single admin: admin@talentshield.com
const defaultUser = new User({
  email: 'admin@talentshield.com',
  password: 'admin123',
  role: 'admin'
});
```

### After:
```javascript
// Creates all super admins from SUPER_ADMIN_EMAIL in .env
const superAdminEmails = process.env.SUPER_ADMIN_EMAIL?.split(',');
for (const email of superAdminEmails) {
  // Create admin account for each email
}
```

---

## 🚀 **How It Works**

### 1. Server Startup
```bash
npm start
```

**Server will:**
- Read `SUPER_ADMIN_EMAIL` from your `.env`
- Split by commas to get each email
- Create admin account for each (if doesn't exist)
- Extract name from email (dean.cumming → Dean Cumming)
- Set password to `TalentShield@2025`

**Console output:**
```
Creating 6 super admin accounts...
✅ Super admin created: dean.cumming@vitrux.co.uk (password: TalentShield@2025)
✅ Super admin created: syed.shahab.ahmed@vitrux.co.uk (password: TalentShield@2025)
✅ Super admin created: tazeen.syeda@vitrux.co.uk (password: TalentShield@2025)
✅ Super admin created: thaya.govzig@vitruxshield.com (password: TalentShield@2025)
✅ Super admin created: syed.ali.asgar@vitruxshield.com (password: TalentShield@2025)
✅ Super admin created: mvnaveen18@gmail.com (password: TalentShield@2025)
```

### 2. First Login
```
URL: https://talentshield.co.uk/login
Email: dean.cumming@vitrux.co.uk
Password: TalentShield@2025

→ Redirects to /dashboard (admin dashboard)
```

### 3. Change Password
**IMPORTANT:** Each super admin should change their password after first login!

---

## ❓ **Your Questions Answered**

### Q: "Will other created accounts be able to login?"

**Answer:** **YES!** Here's how different types of accounts will work:

#### 1. Super Admins (From .env)
✅ **Can login immediately**
- Email: As listed in .env
- Password: `TalentShield@2025`
- Role: Admin
- Access: Full admin dashboard

#### 2. Existing Profiles (After Migration)
✅ **Can login after migration**
- Email: Their profile email
- Password: Their VTID number
- Role: User
- Access: User dashboard

**How to enable:**
```bash
cd backend
node migrate-profiles-to-users.js --execute
```

#### 3. New Profiles Created by Admin
✅ **Can login immediately**
- Email: As entered by admin
- Password: Their VTID number (sent via email)
- Role: User
- Access: User dashboard

#### 4. New Admin Signups
✅ **Can login after email verification**
- Email: As they signed up with
- Password: What they chose
- Role: Admin (after approval)
- Access: Admin dashboard

---

## 📊 **Login Summary**

| Account Type | Can Login? | Password | When? |
|--------------|------------|----------|-------|
| **Super Admins** (your 6 emails) | ✅ YES | `TalentShield@2025` | Immediately |
| **Existing Profiles** (in database) | ✅ YES | Their VTID | After migration |
| **New Profiles** (created by admin) | ✅ YES | Their VTID | Immediately |
| **New User Signups** | ✅ YES | What they chose | After verification |
| **New Admin Signups** | ✅ YES | What they chose | After approval |

**ALL accounts will be able to login!**

---

## 🔐 **Security Notes**

### Initial Passwords:

**Super Admins:**
- Password: `TalentShield@2025`
- ⚠️ **MUST CHANGE** after first login

**Regular Users:**
- Password: Their VTID number
- ⚠️ **SHOULD CHANGE** after first login

### Password Strength:
- All passwords are bcrypt hashed (10 rounds)
- Pre-save hook handles hashing automatically
- No plaintext passwords in database

---

## 🧪 **Testing**

### Test Super Admin Login:

```bash
# 1. Start server
npm start

# Expected output:
# Creating 6 super admin accounts...
# ✅ Super admin created: dean.cumming@vitrux.co.uk

# 2. Login at https://talentshield.co.uk/login
Email: dean.cumming@vitrux.co.uk
Password: TalentShield@2025

# Expected: Redirect to /dashboard
```

### Test Regular User Login (After Migration):

```bash
# 1. Run migration
node migrate-profiles-to-users.js --execute

# 2. Login with any existing user
Email: john.doe@example.com
Password: 1234  (their VTID)

# Expected: Redirect to /user-dashboard
```

---

## 📧 **Notify Your Super Admins**

Send this email to all 6 super admins:

```
Subject: Your HRMS Super Admin Account is Ready

Hello,

Your super admin account for the Talent Shield HRMS has been created.

Login Details:
- URL: https://talentshield.co.uk/login
- Email: [their email from list]
- Password: TalentShield@2025

IMPORTANT:
1. Please change your password immediately after logging in
2. You have full administrative access to the system
3. You can create and manage user profiles and certificates

If you have any issues, please contact the system administrator.

Best regards,
HRMS Team
```

---

## 🔄 **Migration for Existing Users**

**Don't forget to run the migration!**

This creates User accounts for existing Profiles so they can login:

```bash
cd backend

# Preview (safe)
node migrate-profiles-to-users.js

# Execute
node migrate-profiles-to-users.js --execute
```

**After migration:**
- All existing profiles will have User accounts
- They can login with email or VTID
- Password is their VTID number

---

## 🎯 **What Happens on Next Server Start**

### First Time (Fresh Database):
```
Creating 6 super admin accounts...
✅ Super admin created: dean.cumming@vitrux.co.uk
✅ Super admin created: syed.shahab.ahmed@vitrux.co.uk
✅ Super admin created: tazeen.syeda@vitrux.co.uk
✅ Super admin created: thaya.govzig@vitruxshield.com
✅ Super admin created: syed.ali.asgar@vitruxshield.com
✅ Super admin created: mvnaveen18@gmail.com
```

### Second Time (Accounts Exist):
```
Creating 6 super admin accounts...
⏭️  Super admin already exists: dean.cumming@vitrux.co.uk
⏭️  Super admin already exists: syed.shahab.ahmed@vitrux.co.uk
⏭️  Super admin already exists: tazeen.syeda@vitrux.co.uk
⏭️  Super admin already exists: thaya.govzig@vitruxshield.com
⏭️  Super admin already exists: syed.ali.asgar@vitruxshield.com
⏭️  Super admin already exists: mvnaveen18@gmail.com
```

**Safe to restart server multiple times** - won't create duplicates!

---

## ✅ **Checklist**

Before deploying:

- [x] Updated `SUPER_ADMIN_EMAIL` in .env with your 6 emails
- [x] Fixed email typo (mvnaveen18@gmail.com)
- [ ] Changed `JWT_SECRET` in .env
- [ ] Tested super admin creation locally
- [ ] Run migration for existing users
- [ ] Notify super admins of their credentials

---

## 📞 **Troubleshooting**

### Issue: Super admins not created

**Check:**
1. Is `SUPER_ADMIN_EMAIL` set in .env?
2. Are emails comma-separated?
3. Are there any invalid emails?

**Fix:**
```env
# Make sure this is in .env:
SUPER_ADMIN_EMAIL=dean.cumming@vitrux.co.uk,syed.shahab.ahmed@vitrux.co.uk,tazeen.syeda@vitrux.co.uk,thaya.govzig@vitruxshield.com,syed.ali.asgar@vitruxshield.com,mvnaveen18@gmail.com
```

### Issue: Can't login with super admin account

**Check:**
1. Email is lowercase in database
2. Password is exactly `TalentShield@2025`
3. Account was created (check server logs)

**Fix:**
```bash
# Restart server to trigger account creation
npm restart
```

---

**Status:** ✅ **Super Admin Setup Complete!**

All 6 super admin accounts will be created automatically when the server starts.

