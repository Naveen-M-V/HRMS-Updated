# Email System Setup Checklist

## ✅ Prerequisites (Already Done)

- [x] Nodemailer installed (`nodemailer@7.0.6`)
- [x] Node-cron installed (`node-cron@4.2.1`)
- [x] Email service functions created (`utils/emailService.js`)
- [x] Certificate scheduler created (`utils/certificateScheduler.js`)
- [x] Integration examples provided

## 📋 Setup Steps

### 1. Environment Configuration

- [ ] Open your `.env` file in `hrms/backend/`
- [ ] Add the following variables (see `ENV_VARIABLES_NEEDED.md` for details):

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Talent Shield HRMS <your-email@gmail.com>
FRONTEND_URL=http://localhost:3000
SUPPORT_EMAIL=support@talentshield.com
```

- [ ] If using Gmail, create an app-specific password (see instructions below)
- [ ] Save the `.env` file

#### Gmail App Password Setup

1. Go to your Google Account: https://myaccount.google.com
2. Enable 2-Factor Authentication if not already enabled
3. Go to: https://myaccount.google.com/apppasswords
4. Select "Mail" and generate a password
5. Copy the 16-character password
6. Use it as `EMAIL_PASS` in your `.env` file

### 2. Enable Certificate Schedulers

- [ ] Open `hrms/backend/server.js`
- [ ] Find the database connection section (search for `mongoose.connect`)
- [ ] Add scheduler initialization after successful connection:

```javascript
// Add this import at the top of server.js
const { startAllCertificateSchedulers } = require('./utils/certificateScheduler');

// Add this after mongoose.connect().then()
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('✓ MongoDB connected');
  
  // Start certificate monitoring schedulers
  startAllCertificateSchedulers();
  
}).catch(err => {
  console.error('MongoDB connection error:', err);
});
```

- [ ] Save `server.js`

### 3. Integrate Email Notifications into Routes

You need to add email notifications to your existing route handlers. Choose the routes you want to implement:

#### Option A: Profile Routes (if exists)

Location: Find your profile routes file (e.g., `routes/profiles.js` or in `server.js`)

- [ ] Import email functions:
```javascript
const {
  sendProfileCreationEmail,
  sendProfileUpdateEmail,
  sendProfileDeletionEmail
} = require('./utils/emailService'); // Adjust path as needed
```

- [ ] **Profile Creation**: Add after `profile.save()`:
```javascript
sendProfileCreationEmail(newProfile).catch(err => 
  console.error('Email error:', err)
);
```

- [ ] **Profile Update**: Add after `findByIdAndUpdate()`:
```javascript
sendProfileUpdateEmail(updatedProfile, updates).catch(err => 
  console.error('Email error:', err)
);
```

- [ ] **Profile Deletion**: Add before `findByIdAndDelete()`:
```javascript
const profileData = {
  email: profile.email,
  firstName: profile.firstName,
  lastName: profile.lastName,
  vtid: profile.vtid
};
// ... delete profile ...
sendProfileDeletionEmail(profileData).catch(err => 
  console.error('Email error:', err)
);
```

#### Option B: Certificate Routes

Location: `routes/certificates.js` (or wherever certificates are managed)

- [ ] Import email functions:
```javascript
const {
  sendCertificateAddedEmail,
  sendCertificateDeletedEmail
} = require('../utils/emailService');
```

- [ ] **Certificate Added**: Add after `certificate.save()`:
```javascript
// Find profile and send email
const profile = await Profile.findOne({ /* match by name or profileId */ });
if (profile) {
  const certData = {
    certificate: newCertificate.certificate,
    category: newCertificate.category,
    jobRole: newCertificate.jobRole,
    expiryDate: newCertificate.expiryDate
  };
  sendCertificateAddedEmail(profile, certData).catch(err => 
    console.error('Email error:', err)
  );
}
```

- [ ] **Certificate Deleted**: Add before `findByIdAndDelete()`:
```javascript
const profile = await Profile.findOne({ /* match */ });
const certData = { /* certificate data */ };
// ... delete certificate ...
if (profile) {
  sendCertificateDeletedEmail(profile, certData).catch(err => 
    console.error('Email error:', err)
  );
}
```

See `EXAMPLE_EMAIL_INTEGRATION.js` for complete code examples.

### 4. Test the System

- [ ] Restart your backend server
- [ ] Check console for scheduler messages:
  - `[Certificate Scheduler] Certificate expiry reminder scheduler started`
  - `[Certificate Scheduler] Expired certificate notification scheduler started`

- [ ] Test email configuration:
```javascript
// Run in a test file or Node REPL
const { testEmailConfiguration } = require('./utils/emailService');
testEmailConfiguration().then(console.log);
```

- [ ] Test a profile creation email (if integrated):
  - Create a new profile via your API
  - Check email inbox for welcome message

- [ ] Test certificate notifications:
  - Add a certificate via your API
  - Check email inbox for notification

- [ ] Wait for scheduled jobs (or manually trigger):
```javascript
const { checkExpiringCertificates } = require('./utils/certificateScheduler');
checkExpiringCertificates(); // Run immediately for testing
```

### 5. Verify Email Delivery

- [ ] Check recipient inbox (Gmail, Outlook, etc.)
- [ ] Verify emails are not in spam folder
- [ ] Confirm email formatting looks correct (HTML rendering)
- [ ] Check that VTID and profile information are correct

### 6. Production Deployment (Optional)

- [ ] Update `FRONTEND_URL` in `.env` to production URL
- [ ] Update `SUPPORT_EMAIL` to real support address
- [ ] Consider using a professional email service:
  - SendGrid (100 emails/day free)
  - Mailgun (5,000 emails/month free)
  - AWS SES (very cheap)
- [ ] Set up email monitoring/logging
- [ ] Add email tracking to Certificate schema (optional but recommended)

## 🎯 Quick Test Commands

### Test SMTP Connection
```bash
cd hrms/backend
node -e "require('./utils/emailService').testEmailConfiguration().then(console.log)"
```

### Test Profile Creation Email
```bash
node -e "
const { sendProfileCreationEmail } = require('./utils/emailService');
sendProfileCreationEmail({
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  vtid: 9999
}).then(console.log);
"
```

### Manually Run Certificate Check
```bash
node -e "require('./utils/certificateScheduler').checkExpiringCertificates()"
```

## 📚 Reference Documentation

- **EMAIL_INTEGRATION_GUIDE.md** - Detailed integration instructions
- **EXAMPLE_EMAIL_INTEGRATION.js** - Copy-paste ready code
- **ENV_VARIABLES_NEEDED.md** - Environment variable setup
- **EMAIL_SYSTEM_README.md** - Complete system overview

## 🐛 Troubleshooting

### Email not sending?

1. Check `.env` file has correct credentials
2. Check console for error messages
3. Test SMTP configuration (see commands above)
4. For Gmail: ensure 2FA is enabled and app password is used
5. Check firewall/network allows SMTP connections

### Scheduler not running?

1. Check console for startup messages
2. Verify `startAllCertificateSchedulers()` is called in server.js
3. Check for MongoDB connection before starting schedulers

### Profile not found for certificate?

- Your Certificate schema uses `profileName` (string) instead of `profileId`
- Consider adding a `profileId` reference field for better performance
- Current implementation searches by first/last name split

## ✅ Completion Checklist

Once you've completed all steps:

- [ ] Environment variables configured
- [ ] Schedulers enabled in server.js
- [ ] Email functions integrated into routes
- [ ] System tested with real emails
- [ ] All 7 email types working correctly
- [ ] Production settings configured (if deploying)

## 🎉 You're Done!

Your HRMS now has a complete email notification system. All profile and certificate events will trigger appropriate email notifications automatically.

**Questions?** Review the documentation files or check the inline comments in the code.
