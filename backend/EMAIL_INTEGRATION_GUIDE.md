# Email Notification System Integration Guide

This guide explains how to integrate email notifications into your HRMS controllers.

## Environment Variables Setup

Add these variables to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=HRMS System <your-email@gmail.com>

# Application URLs
FRONTEND_URL=http://localhost:3000
SUPPORT_EMAIL=support@talentshield.com
```

## Available Email Functions

All functions are available in `utils/emailService.js`:

```javascript
const {
  sendEmail,                          // Generic send function
  sendProfileCreationEmail,           // 1. Profile created
  sendProfileUpdateEmail,             // 2. Profile updated
  sendProfileDeletionEmail,           // 3. Profile deleted
  sendCertificateAddedEmail,          // 4. Certificate added
  sendCertificateDeletedEmail,        // 5. Certificate deleted
  sendCertificateExpiryReminderEmail, // 6. Certificate expiring soon
  sendCertificateExpiredEmail         // 7. Certificate expired
} = require('../utils/emailService');
```

---

## Integration Examples

### 1. Profile Creation Email

**When to call:** After successfully creating a new profile in the database

**Location:** Profile creation endpoint (e.g., `POST /api/profiles`)

**Example:**

```javascript
// In your profile creation route/controller
router.post('/profiles', async (req, res) => {
  try {
    // Create profile
    const newProfile = new Profile(req.body);
    await newProfile.save();
    
    // Check if a User account was also created for this profile
    const user = await User.findOne({ email: newProfile.email });
    
    // Send welcome email
    let userData = null;
    if (user && user.temporaryPassword) {
      // If user exists with temp password, include credentials
      userData = {
        email: user.email,
        password: user.temporaryPassword // Make sure to store this before hashing!
      };
    }
    
    // Send email notification (async, don't wait for it)
    sendProfileCreationEmail(newProfile, userData).catch(err => 
      console.error('Failed to send profile creation email:', err)
    );
    
    res.status(201).json({ success: true, profile: newProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Important:** If you create a User account alongside the Profile, pass the **plain text password** before hashing it, so it can be included in the email.

---

### 2. Profile Update Email

**When to call:** After successfully updating a profile

**Location:** Profile update endpoint (e.g., `PUT /api/profiles/:id`)

**Example:**

```javascript
router.put('/profiles/:id', async (req, res) => {
  try {
    const profileId = req.params.id;
    const updates = req.body;
    
    // Update the profile
    const updatedProfile = await Profile.findByIdAndUpdate(
      profileId,
      updates,
      { new: true }
    );
    
    if (!updatedProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Send update notification with only the changed fields
    sendProfileUpdateEmail(updatedProfile, updates).catch(err =>
      console.error('Failed to send profile update email:', err)
    );
    
    res.json({ success: true, profile: updatedProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 3. Profile Deletion Email

**When to call:** Before deleting a profile (so you have the data to send)

**Location:** Profile deletion endpoint (e.g., `DELETE /api/profiles/:id`)

**Example:**

```javascript
router.delete('/profiles/:id', async (req, res) => {
  try {
    const profileId = req.params.id;
    
    // Get profile data before deleting
    const profile = await Profile.findById(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Store profile data for email
    const profileData = {
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      vtid: profile.vtid
    };
    
    // Delete the profile
    await Profile.findByIdAndDelete(profileId);
    
    // Send deletion notification
    sendProfileDeletionEmail(profileData).catch(err =>
      console.error('Failed to send profile deletion email:', err)
    );
    
    res.json({ success: true, message: 'Profile deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 4. Certificate Added Email

**When to call:** After successfully adding a certificate to a profile

**Location:** Certificate creation endpoint (e.g., `POST /api/certificates`)

**Example:**

```javascript
router.post('/certificates', async (req, res) => {
  try {
    // Create certificate
    const newCertificate = new Certificate(req.body);
    await newCertificate.save();
    
    // Get the profile information (certificates store profileName, not profileId in your schema)
    // If you have profileId reference, use: const profile = await Profile.findById(newCertificate.profileId);
    const profile = await Profile.findOne({ 
      firstName: newCertificate.profileName.split(' ')[0],
      lastName: newCertificate.profileName.split(' ').slice(1).join(' ')
    });
    
    if (profile) {
      const certificateData = {
        certificate: newCertificate.certificate,
        category: newCertificate.category,
        jobRole: newCertificate.jobRole,
        expiryDate: newCertificate.expiryDate
      };
      
      // Send notification
      sendCertificateAddedEmail(profile, certificateData).catch(err =>
        console.error('Failed to send certificate added email:', err)
      );
    }
    
    res.status(201).json({ success: true, certificate: newCertificate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Note:** Your Certificate schema doesn't have a profileId reference. You may want to add one for easier lookups:

```javascript
// In Certificate schema
profileId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Profile',
  required: true
}
```

---

### 5. Certificate Deleted Email

**When to call:** Before deleting a certificate (so you have the data)

**Location:** Certificate deletion endpoint (e.g., `DELETE /api/certificates/:id`)

**Example:**

```javascript
router.delete('/certificates/:id', async (req, res) => {
  try {
    const certificateId = req.params.id;
    
    // Get certificate before deleting
    const certificate = await Certificate.findById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    // Get profile information
    const profile = await Profile.findOne({
      firstName: certificate.profileName.split(' ')[0],
      lastName: certificate.profileName.split(' ').slice(1).join(' ')
    });
    
    // Store certificate data
    const certificateData = {
      certificate: certificate.certificate,
      category: certificate.category,
      jobRole: certificate.jobRole,
      expiryDate: certificate.expiryDate
    };
    
    // Delete the certificate
    await Certificate.findByIdAndDelete(certificateId);
    
    if (profile) {
      // Send deletion notification
      sendCertificateDeletedEmail(profile, certificateData).catch(err =>
        console.error('Failed to send certificate deleted email:', err)
      );
    }
    
    res.json({ success: true, message: 'Certificate deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 6. Certificate Expiry Reminder (Scheduled Job)

**When to call:** Run as a scheduled task (cron job) - daily at a specific time

**Location:** Scheduled task file (create `utils/scheduledTasks.js` or similar)

**Example with node-cron:**

```javascript
// utils/scheduledTasks.js
const cron = require('node-cron');
const Profile = require('../models/Profile'); // Adjust path
const Certificate = require('../models/Certificate'); // Adjust path
const { sendCertificateExpiryReminderEmail } = require('./emailService');

// Helper function to parse DD/MM/YYYY date format
function parseDate(dateString) {
  const [day, month, year] = dateString.split('/');
  return new Date(year, month - 1, day);
}

// Calculate days until expiry
function getDaysUntilExpiry(expiryDateString) {
  const expiryDate = parseDate(expiryDateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Check for expiring certificates and send reminders
async function checkExpiringCertificates() {
  try {
    console.log('Running certificate expiry check...');
    
    const allCertificates = await Certificate.find({});
    
    for (const cert of allCertificates) {
      const daysUntilExpiry = getDaysUntilExpiry(cert.expiryDate);
      
      // Send reminders at 60, 30, 14, 7, 3, and 1 day(s) before expiry
      const reminderDays = [60, 30, 14, 7, 3, 1];
      
      if (reminderDays.includes(daysUntilExpiry) && daysUntilExpiry > 0) {
        // Find the profile
        const profile = await Profile.findOne({
          firstName: cert.profileName.split(' ')[0],
          lastName: cert.profileName.split(' ').slice(1).join(' ')
        });
        
        if (profile) {
          const certificateData = {
            certificate: cert.certificate,
            category: cert.category,
            jobRole: cert.jobRole,
            expiryDate: cert.expiryDate
          };
          
          console.log(`Sending expiry reminder for ${cert.certificate} to ${profile.email} (${daysUntilExpiry} days)`);
          
          await sendCertificateExpiryReminderEmail(profile, certificateData, daysUntilExpiry);
        }
      }
    }
    
    console.log('Certificate expiry check completed.');
  } catch (error) {
    console.error('Error checking expiring certificates:', error);
  }
}

// Run daily at 9:00 AM
function startCertificateExpiryScheduler() {
  cron.schedule('0 9 * * *', checkExpiringCertificates);
  console.log('Certificate expiry scheduler started (runs daily at 9:00 AM)');
}

module.exports = { startCertificateExpiryScheduler, checkExpiringCertificates };
```

**Add to server.js:**

```javascript
// In server.js
const { startCertificateExpiryScheduler } = require('./utils/scheduledTasks');

// After database connection
startCertificateExpiryScheduler();
```

**Install node-cron if not already installed:**

```bash
npm install node-cron
```

---

### 7. Certificate Expired Email (Scheduled Job)

**When to call:** Run as a scheduled task (cron job) - daily

**Location:** Same scheduled task file as above

**Example:**

```javascript
// Add to utils/scheduledTasks.js
const { sendCertificateExpiredEmail } = require('./emailService');

// Check for expired certificates and send notifications
async function checkExpiredCertificates() {
  try {
    console.log('Running expired certificate check...');
    
    const allCertificates = await Certificate.find({});
    
    for (const cert of allCertificates) {
      const daysUntilExpiry = getDaysUntilExpiry(cert.expiryDate);
      
      // If expired (negative days or zero)
      if (daysUntilExpiry <= 0) {
        // Find the profile
        const profile = await Profile.findOne({
          firstName: cert.profileName.split(' ')[0],
          lastName: cert.profileName.split(' ').slice(1).join(' ')
        });
        
        if (profile) {
          const certificateData = {
            certificate: cert.certificate,
            category: cert.category,
            jobRole: cert.jobRole,
            expiryDate: cert.expiryDate
          };
          
          // Send expired notification (maybe only once, track in DB?)
          console.log(`Certificate ${cert.certificate} is EXPIRED for ${profile.email}`);
          
          // Option 1: Send every time (daily reminder)
          await sendCertificateExpiredEmail(profile, certificateData);
          
          // Option 2: Track if already sent (recommended - add field to Certificate schema)
          // if (!cert.expiredEmailSent) {
          //   await sendCertificateExpiredEmail(profile, certificateData);
          //   cert.expiredEmailSent = true;
          //   await cert.save();
          // }
        }
      }
    }
    
    console.log('Expired certificate check completed.');
  } catch (error) {
    console.error('Error checking expired certificates:', error);
  }
}

// Run daily at 10:00 AM
function startExpiredCertificateScheduler() {
  cron.schedule('0 10 * * *', checkExpiredCertificates);
  console.log('Expired certificate scheduler started (runs daily at 10:00 AM)');
}

module.exports = { 
  startCertificateExpiryScheduler, 
  checkExpiringCertificates,
  startExpiredCertificateScheduler,
  checkExpiredCertificates
};
```

**Update server.js:**

```javascript
const { 
  startCertificateExpiryScheduler,
  startExpiredCertificateScheduler 
} = require('./utils/scheduledTasks');

startCertificateExpiryScheduler();
startExpiredCertificateScheduler();
```

---

## Recommended: Track Email Notifications

To avoid sending duplicate expired certificate emails, add tracking fields to your Certificate schema:

```javascript
// In Certificate schema
const certificateSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Email tracking
  expiryRemindersSent: [Number], // Array of days when reminders were sent [60, 30, 14, 7, 3, 1]
  expiredEmailSent: { type: Boolean, default: false },
  lastEmailSentAt: Date
});
```

Then update the scheduled task logic:

```javascript
// Only send if not already sent for this day threshold
if (reminderDays.includes(daysUntilExpiry) && 
    !cert.expiryRemindersSent?.includes(daysUntilExpiry)) {
  await sendCertificateExpiryReminderEmail(profile, certificateData, daysUntilExpiry);
  
  // Track that we sent it
  cert.expiryRemindersSent = cert.expiryRemindersSent || [];
  cert.expiryRemindersSent.push(daysUntilExpiry);
  cert.lastEmailSentAt = new Date();
  await cert.save();
}
```

---

## Generic sendEmail Function

For custom emails not covered by the templates:

```javascript
const { sendEmail } = require('../utils/emailService');

await sendEmail({
  to: 'user@example.com',
  subject: 'Custom Notification',
  html: '<h1>Hello</h1><p>Your custom message here</p>'
});
```

---

## Error Handling Best Practices

1. **Don't block requests:** Use `.catch()` to handle email errors without failing the main operation
2. **Log failures:** Always log email sending failures for monitoring
3. **Retry logic:** Consider implementing retry logic for critical emails
4. **Testing:** Use a test email service (like Mailtrap) during development

---

## Testing Email Configuration

Run this test to verify your email setup:

```javascript
const { testEmailConfiguration } = require('./utils/emailService');

testEmailConfiguration().then(result => {
  console.log('Email test result:', result);
});
```

---

## Summary of Integration Points

| Event | Endpoint | Function | When to Call |
|-------|----------|----------|--------------|
| Profile Created | `POST /api/profiles` | `sendProfileCreationEmail()` | After profile saved |
| Profile Updated | `PUT /api/profiles/:id` | `sendProfileUpdateEmail()` | After profile updated |
| Profile Deleted | `DELETE /api/profiles/:id` | `sendProfileDeletionEmail()` | Before profile deleted |
| Certificate Added | `POST /api/certificates` | `sendCertificateAddedEmail()` | After certificate saved |
| Certificate Deleted | `DELETE /api/certificates/:id` | `sendCertificateDeletedEmail()` | Before certificate deleted |
| Certificate Expiring | Cron Job (Daily) | `sendCertificateExpiryReminderEmail()` | Daily check |
| Certificate Expired | Cron Job (Daily) | `sendCertificateExpiredEmail()` | Daily check |

---

## Next Steps

1. ✅ Email service functions created
2. ⏳ Add email function calls to your route handlers
3. ⏳ Set up environment variables
4. ⏳ Create and configure scheduled tasks
5. ⏳ Test with real email addresses
6. ⏳ (Optional) Add email tracking fields to schemas
