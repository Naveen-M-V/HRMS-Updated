# Password Reset and Account Management Guide

## 🔧 New Features Added

### 1. Forgot Password API Endpoints
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### 2. Management Scripts
- `backend/scripts/listEmployeeAccounts.js` - List all employee/user accounts
- `backend/scripts/resetPassword.js` - Manually reset a user's password

## 📝 How to Use

### Option 1: Using the Frontend (Recommended)
1. Go to the login page
2. Click "Forgot Password?"
3. Enter your email address
4. Check server console for the reset link (in development mode)
5. Click the link or copy it to your browser
6. Enter your new password

### Option 2: Using the Reset Password Script
```bash
cd backend
node scripts/resetPassword.js <email> <newpassword>
```

Example:
```bash
node scripts/resetPassword.js john.doe@example.com NewPass123!
```

### Option 3: List All Accounts
```bash
cd backend
node scripts/listEmployeeAccounts.js
```

This will show:
- All active employees from EmployeeHub
- All users/profiles from User model
- Their emails, roles, and other details
- Instructions for resetting passwords

## 🔐 API Usage

### Forgot Password
```javascript
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent.",
  "resetUrl": "http://localhost:3000/reset-password?token=xxx&email=user@example.com"
}
```

Note: `resetUrl` is only included in development mode.

### Reset Password
```javascript
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "email": "user@example.com",
  "newPassword": "NewSecurePassword123!"
}
```

Response:
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

## 🚨 Troubleshooting Login Issues

### 401 Unauthorized Error
This usually means:
1. **Wrong email/password** - Use the reset password script to set a known password
2. **Account locked** - Too many failed attempts (wait 30 minutes or reset password)
3. **Account inactive** - Check `isActive` field is `true`
4. **Account terminated** - Check `status` field is not `Terminated`

### Steps to Fix:
1. List all accounts:
   ```bash
   node backend/scripts/listEmployeeAccounts.js
   ```

2. Find your account's email

3. Reset the password:
   ```bash
   node backend/scripts/resetPassword.js your.email@example.com YourNewPassword123!
   ```

4. Try logging in again with the new password

## 🔍 Database Schema

### EmployeeHub Model
- `passwordResetToken`: String (hashed)
- `passwordResetExpires`: Date
- `loginAttempts`: Number
- `lockUntil`: Date

### User Model  
- `resetPasswordToken`: String (hashed)
- `resetPasswordExpires`: Date
- `loginAttempts`: Number
- `lockUntil`: Date

Note: Different field names between models are handled automatically by the controller.

## 🛡️ Security Features
- Tokens are hashed using SHA256
- Tokens expire after 1 hour
- Account locks after 5 failed login attempts (30 minute lockout)
- Password must be at least 6 characters
- Terminated employees cannot login
- Email existence is not revealed for security

## 📧 Email Integration (Future)
Currently, reset links are logged to the console in development mode.
For production, integrate an email service like:
- SendGrid
- AWS SES
- Nodemailer with SMTP

## 🔄 Next Steps
1. Run the list accounts script to see all users
2. Use the reset password script to set known passwords for testing
3. Test the forgot password flow from the frontend
4. Integrate email service for production deployment
