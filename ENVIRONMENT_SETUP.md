# Environment Setup Guide

## Backend Environment Variables

Make sure your `backend/.env` file contains the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/hrms

# Server
PORT=5003
NODE_ENV=development

# JWT & Session
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-session-secret-key

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="HRMS System <your-email@gmail.com>"

# Super Admin Email (receives admin approval requests)
SUPER_ADMIN_EMAIL=admin@talentshield.com

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5003
API_PUBLIC_URL=http://localhost:5003

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5003
```

## Frontend Environment Variables

Make sure your `frontend/.env` file contains:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5003
REACT_APP_API_URL=http://localhost:5003
```

For production, update to:
```env
REACT_APP_API_BASE_URL=https://talentshield.co.uk
REACT_APP_API_URL=https://talentshield.co.uk
```

## Important Notes

### Email Setup (Gmail Example)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
   - Use this password in EMAIL_PASS (not your regular Gmail password)

### Super Admin Email
- Set SUPER_ADMIN_EMAIL to the email address that should receive admin approval requests
- This email will get notified when new admins sign up
- The super admin must click the approval link in the email

### Testing Email Functionality
You can test email configuration by running:
```bash
cd backend
node test-email-complete.js
```

## Changes Made

### 1. File Storage Fixed
- ✅ Certificates with files now persist in database
- ✅ Profile pictures persist in database
- ✅ Files are retrieved correctly after page refresh
- ✅ Optimized queries to exclude binary data when listing

### 2. CRUD Operations Fixed
- ✅ View certificate - works with file download
- ✅ Edit certificate - supports updating with or without new file
- ✅ Delete certificate - removes certificate and notifies admins
- ✅ View profile - works with profile picture
- ✅ Edit profile - supports updating profile data
- ✅ Delete profile - removes profile, associated certificates, and user account

### 3. Admin Authorization Flow
- ✅ New admin signup sends verification email to the admin
- ✅ Admin approval request sent to SUPER_ADMIN_EMAIL
- ✅ Super admin clicks approval link to activate the admin account
- ✅ Login enforces both email verification AND admin approval for admin users
- ✅ Regular users don't need admin approval (only admins do)

### 4. Create User Functionality
- ✅ Admin creates user via "Create User" page
- ✅ System generates secure random password
- ✅ **Credentials sent to the CREATING ADMIN's email** (not the new user)
- ✅ Welcome email sent to the new user (without credentials)
- ✅ Admin can then share credentials with the new user securely
- ✅ New user profile created with auto-generated VTID

## How It Works

### Admin Signup Flow
1. User signs up with role="admin"
2. System creates user with `adminApprovalStatus: 'pending'`
3. Email verification link sent to user's email
4. Admin approval request sent to SUPER_ADMIN_EMAIL
5. User verifies email (clicks link in email)
6. Super admin approves account (clicks link in approval email)
7. User can now log in with admin privileges

### Create User Flow (Admin Only)
1. Admin logs in and goes to "Create User" page
2. Admin enters new user's name and email
3. System generates random password
4. **Email with credentials sent to CREATING ADMIN**
5. Welcome email sent to new user (notifies them account created)
6. Admin shares credentials with new user securely
7. New user logs in and changes password

### Certificate Upload Flow
1. Admin/User uploads certificate with file
2. File stored as binary in MongoDB (fileData field)
3. Certificate metadata stored (filename, size, mimeType)
4. On page refresh, certificates load from database
5. Files can be viewed/downloaded via `/api/certificates/:id/file`

### Profile Picture Flow
1. User uploads profile picture
2. Image stored as binary in MongoDB (profilePictureData field)
3. Image metadata stored (size, mimeType)
4. On page refresh, profile picture loads from database
5. Image accessible via `/api/profiles/:id/picture`

## Testing Checklist

### Backend
- [ ] Server starts without errors: `npm start` in backend folder
- [ ] MongoDB connected successfully
- [ ] Email configuration test passes
- [ ] All routes respond correctly

### Frontend
- [ ] App starts without errors: `npm start` in frontend folder
- [ ] Login page loads
- [ ] API calls reach backend (check browser console)

### Features to Test
- [ ] Admin signup with email verification and approval
- [ ] Create new user (credentials sent to admin)
- [ ] Create profile
- [ ] Upload profile picture (persists after refresh)
- [ ] Create certificate with file (persists after refresh)
- [ ] Edit certificate
- [ ] Delete certificate
- [ ] View certificate file
- [ ] Delete profile (cascade deletes certificates)

## Troubleshooting

### Emails Not Sending
- Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS are correct
- For Gmail, ensure you're using App Password, not regular password
- Check spam folder for emails
- Run `node test-email-complete.js` to test configuration

### API Calls Failing
- Ensure REACT_APP_API_BASE_URL matches backend URL
- Check CORS_ORIGINS includes frontend URL
- Verify backend is running on correct PORT
- Check browser console for error details

### Files Not Persisting
- This should now be fixed - files stored in MongoDB
- Check MongoDB has enough storage space
- Verify file size is under 10MB limit
- Check server logs for errors during upload

### Admin Cannot Login
- Verify email has been verified (check email)
- Verify admin has been approved by super admin
- Check adminApprovalStatus in database should be 'approved'
- Check emailVerified in database should be true
