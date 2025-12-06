# Admin Account Management System

## Overview
The HRMS now has a complete admin approval workflow. Here's how it works:

## User Types

### 1. **Super Admin** (`role: 'super-admin'`)
- Defined in `.env` file under `SUPER_ADMIN_EMAIL`
- Full system access
- Can approve new admin accounts
- No approval needed (auto-approved)
- Exists in User model without profile requirements (no VTID, profileType, or startDate needed)

### 2. **Admin** (`role: 'admin'`)
- Can manage system but with limited permissions compared to super-admins
- **Requires super-admin approval** after signup
- Cannot approve other admins
- Exists in User model without profile requirements

### 3. **Profile** (`role: 'profile'`)
- Interns, trainees, contract trainees
- Requires VTID, profileType, and startDate
- May require email verification and admin approval (depending on settings)

### 4. **Employee** (in EmployeeHub model)
- Regular employees with clock-in/out, rota, shifts
- Has roles: 'employee', 'admin', 'super-admin'

---

## Admin Account Creation Workflow

### Step 1: New Admin Signs Up
```
POST /api/auth/signup
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john.doe@company.com",
  "password": "SecurePass123",
  "role": "admin"
}
```

**What happens:**
- Account is created with `isAdminApproved: false`
- Account is created with `isActive: true` but cannot login until approved
- Approval request emails are sent to ALL super-admins listed in `SUPER_ADMIN_EMAIL`

### Step 2: Super Admin Receives Email
- Email contains: Applicant name, email, and an "Approve Admin" button
- Button links to: `https://yourdomain.com/api/auth/approve-admin?token=xxx`

### Step 3: Super Admin Clicks Approve
- Token is verified
- User's `isAdminApproved` is set to `true`
- Approval notification email is sent to the new admin
- Super admin is redirected to login page with success message

### Step 4: New Admin Can Login
- New admin can now login with their email and password
- They have admin access to the system

---

## Current Super Admin Accounts

From your `.env` file:
1. thaya.govzig@vitruxshield.com
2. syed.ali.asgar@vitruxshield.com
3. mvnaveen18@gmail.com

These accounts:
- ✅ Skip approval checks (super-admins bypass `isAdminApproved` check)
- ✅ Have full system access
- ✅ Receive approval requests for new admin signups
- ✅ Don't require VTID, profileType, or startDate (not profiles)

---

## Login Flow

### For Admin/Super-Admin Accounts:
1. User enters email and password
2. System checks User model first (finds admin accounts here)
3. Verifies password
4. Checks `isEmailVerified` (must be true)
5. **Checks `isAdminApproved`** (must be true for regular admins, skipped for super-admins)
6. If all pass → login successful

### For Employee Accounts:
1. User enters email and password
2. System checks EmployeeHub model (finds employees here)
3. Verifies password
4. Login successful (no approval checks for employees)

---

## API Endpoints

### Signup
```
POST /api/auth/signup
Body: { firstName, lastName, email, password, role: 'admin' }
Response: { message: "Admin account created. Pending super-admin approval.", requiresApproval: true }
```

### Approve Admin (via email link)
```
GET /api/auth/approve-admin?token=xxx
Response: Redirects to login page with success message
```

### Login
```
POST /api/auth/login
Body: { identifier: email, password }
Response: { user: {...}, token: "jwt_token" }
```

---

## Files Modified

1. **`backend/models/User.js`**
   - Made VTID, profileType, startDate optional for admin accounts
   - Added 'super-admin' and 'admin' to role enum

2. **`backend/models/EmployeesHub.js`**
   - Added 'super-admin' to role enum

3. **`backend/server.js`**
   - Updated signup endpoint to handle admin approval workflow
   - Added approval token generation for admin signups
   - Added email notifications to super admins
   - Created `/api/auth/approve-admin` endpoint
   - Updated login to skip approval check for super-admins
   - Fixed duplicate userSchema to include 'super-admin' role

4. **`backend/scripts/createSuperAdminAccounts.js`**
   - Script to create/update super admin accounts from `.env`

---

## Testing the Workflow

### 1. Create a new admin account:
```bash
curl -X POST https://hrms.athryan.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Admin",
    "email": "test.admin@example.com",
    "password": "TestPass123",
    "role": "admin"
  }'
```

### 2. Check super admin emails:
- All super admins receive approval request

### 3. Click "Approve Admin" in email:
- Sets `isAdminApproved: true`
- New admin receives confirmation email

### 4. New admin can login:
```bash
curl -X POST https://hrms.athryan.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test.admin@example.com",
    "password": "TestPass123"
  }'
```

---

## Environment Variables Required

```env
# Super Admin Emails (comma-separated)
SUPER_ADMIN_EMAIL=thaya.govzig@vitruxshield.com,syed.ali.asgar@vitruxshield.com,mvnaveen18@gmail.com

# Email Configuration (for sending approval requests)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=HRMS System <your-email@gmail.com>

# Frontend URL (for redirect after approval)
FRONTEND_URL=https://hrms.athryan.com

# JWT Secret
JWT_SECRET=your-secret-key
```

---

## Summary

✅ **Yes, the system now works exactly as you described:**
- New admin signups trigger approval emails to super admins
- Super admins click approve in email
- New admins gain admin access after approval
- Super admins bypass all approval checks
- Admin accounts are separate from profiles and employees
