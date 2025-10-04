# Email Notification System - Complete Implementation

## 📋 Overview

A complete email notification system has been implemented for your HRMS with support for all profile and certificate events. The system uses **Nodemailer** and works seamlessly with your existing User/Profile/Certificate schema without requiring data migration.

## ✅ What's Included

### 1. Email Service (`utils/emailService.js`)
Enhanced with 7 new email notification functions:

- ✉️ **sendEmail()** - Reusable core function for sending any email
- 👤 **sendProfileCreationEmail()** - Welcome email when profile is created
- 📝 **sendProfileUpdateEmail()** - Summary of updated fields
- 🗑️ **sendProfileDeletionEmail()** - Deletion confirmation
- 📜 **sendCertificateAddedEmail()** - Certificate added notification
- ❌ **sendCertificateDeletedEmail()** - Certificate removed notification  
- ⏰ **sendCertificateExpiryReminderEmail()** - Reminder before expiry
- 🚨 **sendCertificateExpiredEmail()** - Alert after certificate expires

### 2. Certificate Scheduler (`utils/certificateScheduler.js`)
Automated cron jobs for certificate monitoring:

- Daily check for expiring certificates (60, 30, 14, 7, 3, 1 days before)
- Daily check for expired certificates
- Configurable timezone and schedule
- Detailed logging

### 3. Documentation

- **EMAIL_INTEGRATION_GUIDE.md** - Complete integration guide with examples
- **EXAMPLE_EMAIL_INTEGRATION.js** - Copy-paste ready route examples
- **ENV_VARIABLES_NEEDED.md** - Environment setup instructions

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd hrms/backend
npm install node-cron
```

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Talent Shield HRMS <your-email@gmail.com>

# Application URLs
FRONTEND_URL=http://localhost:3000
SUPPORT_EMAIL=support@talentshield.com
```

See `ENV_VARIABLES_NEEDED.md` for detailed setup instructions.

### Step 3: Enable Schedulers in server.js

Add this to your `server.js` after database connection:

```javascript
// Import scheduler
const { startAllCertificateSchedulers } = require('./utils/certificateScheduler');

// After MongoDB connection
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected');
  
  // Start certificate monitoring schedulers
  startAllCertificateSchedulers();
  
}).catch(err => console.error('MongoDB connection error:', err));
```

### Step 4: Integrate into Your Routes

Example for profile creation:

```javascript
const { sendProfileCreationEmail } = require('../utils/emailService');

router.post('/profiles', async (req, res) => {
  try {
    const newProfile = new Profile(req.body);
    await newProfile.save();
    
    // Send welcome email (don't block response)
    sendProfileCreationEmail(newProfile).catch(err => 
      console.error('Email error:', err)
    );
    
    res.status(201).json({ success: true, profile: newProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

See `EMAIL_INTEGRATION_GUIDE.md` for complete examples of all 7 events.

## 📧 Email Templates

All emails feature:
- Professional HTML design with gradients and modern styling
- Responsive layout (mobile-friendly)
- Color-coded by urgency/type
- Profile VTID included
- Automatic timestamps
- Company branding (Talent Shield HRMS)

### Template Preview

| Event | Color Scheme | Subject Example |
|-------|--------------|-----------------|
| Profile Created | Purple gradient | "Welcome to Talent Shield HRMS - Profile Created" |
| Profile Updated | Orange gradient | "Profile Updated - Talent Shield HRMS" |
| Profile Deleted | Red gradient | "Profile Deletion Notification - Talent Shield HRMS" |
| Certificate Added | Green gradient | "Certificate Added: First Aid Training" |
| Certificate Deleted | Red gradient | "Certificate Removed: First Aid Training" |
| Expiry Reminder | Blue/Orange/Red | "REMINDER/WARNING/URGENT: Certificate Expiring in X Days" |
| Certificate Expired | Dark red | "🚨 URGENT: Certificate EXPIRED" |

## 🔄 How It Works

### Profile Events (Manual Triggers)

1. **Profile Created** → Call `sendProfileCreationEmail(profileData, userData?)`
   - Sends VTID and login link
   - Includes credentials if User account exists

2. **Profile Updated** → Call `sendProfileUpdateEmail(profileData, updatedFields)`
   - Lists all changed fields in a table
   - Shows old vs new values

3. **Profile Deleted** → Call `sendProfileDeletionEmail(profileData)`
   - Must be called BEFORE deletion
   - Includes all profile details

### Certificate Events (Mixed)

4. **Certificate Added** → Call `sendCertificateAddedEmail(profileData, certificateData)`
   - Shows certificate details (name, category, job role, expiry)

5. **Certificate Deleted** → Call `sendCertificateDeletedEmail(profileData, certificateData)`
   - Must be called BEFORE deletion

6. **Expiry Reminder** → Automated cron job runs daily
   - Checks all certificates
   - Sends reminders at 60, 30, 14, 7, 3, and 1 day(s) before expiry
   - Color-coded by urgency

7. **Certificate Expired** → Automated cron job runs daily
   - Checks for expired certificates
   - Sends urgent notification

## 📊 Data Flow

```
Controller/Route
    ↓
Send Email Function
    ↓
sendEmail({ to, subject, html })
    ↓
Nodemailer Transporter
    ↓
SMTP Server
    ↓
Recipient Inbox
```

## 🛡️ Error Handling

All email functions return `{ success: boolean, messageId?: string, error?: string }`

Best practices:
```javascript
// DON'T block the response
sendProfileCreationEmail(profile)
  .then(result => console.log('Email sent:', result.messageId))
  .catch(err => console.error('Email failed:', err));

// Or use async/await without blocking
sendProfileCreationEmail(profile).catch(err => 
  console.error('Email error:', err)
);
```

## 🔧 Advanced Configuration

### Customize Reminder Days

Edit `certificateScheduler.js`:

```javascript
const reminderDays = [90, 60, 30, 14, 7, 3, 1]; // Add 90 days reminder
```

### Change Scheduler Times

```javascript
// Run at 8:00 AM instead of 9:00 AM
cron.schedule('0 8 * * *', checkExpiringCertificates);
```

### Track Sent Emails (Recommended)

Add to Certificate schema:

```javascript
expiryRemindersSent: [Number],      // Days when reminders sent
expiredEmailSent: { type: Boolean, default: false },
lastEmailSentAt: Date
```

Uncomment tracking code in `certificateScheduler.js`

## 📝 Schema Compatibility

### Works With Current Schema ✅

- User and Profile linked by **email** (no schema changes needed)
- Certificates use **profileName** string (works as-is)
- Profile has **vtid** and **email** fields (used in all emails)

### Optional Improvements

Consider adding to Certificate schema for better performance:

```javascript
profileId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Profile',
  required: true
}
```

This eliminates the need to search profiles by name.

## 🧪 Testing

### Test Email Configuration

```javascript
const { testEmailConfiguration } = require('./utils/emailService');

testEmailConfiguration().then(console.log);
```

### Test Individual Functions

```javascript
const { sendProfileCreationEmail } = require('./utils/emailService');

const testProfile = {
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  vtid: 1001
};

sendProfileCreationEmail(testProfile).then(console.log);
```

### Manual Scheduler Run

```javascript
const { checkExpiringCertificates } = require('./utils/certificateScheduler');

// Run immediately for testing
checkExpiringCertificates();
```

## 📁 File Structure

```
hrms/backend/
├── utils/
│   ├── emailService.js              ← Enhanced with 7 new functions
│   └── certificateScheduler.js      ← NEW: Automated monitoring
├── routes/
│   └── EXAMPLE_EMAIL_INTEGRATION.js ← NEW: Integration examples
├── EMAIL_INTEGRATION_GUIDE.md       ← NEW: Complete guide
├── ENV_VARIABLES_NEEDED.md          ← NEW: Environment setup
└── EMAIL_SYSTEM_README.md           ← This file
```

## 🔗 Integration Points

| Event | File Location | When to Call |
|-------|---------------|--------------|
| Profile Created | `POST /api/profiles` | After `profile.save()` |
| Profile Updated | `PUT /api/profiles/:id` | After `findByIdAndUpdate()` |
| Profile Deleted | `DELETE /api/profiles/:id` | Before `findByIdAndDelete()` |
| Certificate Added | `POST /api/certificates` | After `certificate.save()` |
| Certificate Deleted | `DELETE /api/certificates/:id` | Before `findByIdAndDelete()` |
| Expiry Reminder | Cron Job (9:00 AM daily) | Automated |
| Certificate Expired | Cron Job (10:00 AM daily) | Automated |

## ⚙️ Environment Support

Tested with:
- Gmail (with app password)
- Outlook/Office 365
- SendGrid
- Mailgun
- Mailtrap (testing)

## 🎯 Next Steps

1. ✅ Configure `.env` with email credentials
2. ✅ Add scheduler initialization to `server.js`
3. ✅ Integrate email calls into your existing routes
4. ✅ Test with real email addresses
5. ⏳ (Optional) Add email tracking fields to Certificate schema
6. ⏳ (Optional) Add profileId reference to Certificate schema

## 📞 Support

For questions or issues with the email system:
- Review `EMAIL_INTEGRATION_GUIDE.md` for detailed examples
- Check `EXAMPLE_EMAIL_INTEGRATION.js` for copy-paste code
- Verify environment variables in `ENV_VARIABLES_NEEDED.md`

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use app-specific passwords for Gmail
- Email sending errors won't block API responses
- All emails include VTID for user identification
- Passwords in emails should only be temporary/auto-generated

---

**Status:** ✅ Ready for Integration  
**Version:** 1.0  
**Last Updated:** October 2025
