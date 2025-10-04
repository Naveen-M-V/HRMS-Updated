# Environment Variables for Email System

Add these variables to your `.env` file:

```env
# ====================================
# EMAIL CONFIGURATION (Required)
# ====================================

# SMTP Server Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# Email Account Credentials
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Sender Information
EMAIL_FROM=Talent Shield HRMS <your-email@gmail.com>

# ====================================
# APPLICATION URLS (Required)
# ====================================

# Frontend URL for login links in emails
FRONTEND_URL=http://localhost:3000

# Support email address shown in notification emails
SUPPORT_EMAIL=support@talentshield.com
```

## Gmail Setup Instructions

If using Gmail, you need to generate an **App Password**:

1. Enable 2-Factor Authentication on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate a new app password for "Mail"
4. Use that password in `EMAIL_PASS` (not your regular Gmail password)

## Alternative Email Providers

### Outlook/Office 365
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASS=your-mailgun-password
```

## Testing with Mailtrap (Development)

For testing without sending real emails:

```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASS=your-mailtrap-password
EMAIL_FROM=HRMS Test <test@example.com>
```

Sign up at https://mailtrap.io for free testing credentials.
