# 📧 Gmail SMTP Setup Guide for HRMS Email Testing

## 🚀 Quick Setup Steps

### 1. **Enable 2-Factor Authentication on Gmail**
- Go to [Google Account Security](https://myaccount.google.com/security)
- Enable 2-Step Verification if not already enabled

### 2. **Generate App Password**
- Go to [Google Account Security](https://myaccount.google.com/security)
- Click on "2-Step Verification"
- Scroll down to "App passwords"
- Select "Mail" and your device
- Copy the 16-character app password (e.g., `abcd efgh ijkl mnop`)

### 3. **Update .env File**
Replace your current email configuration with:

```env
# -----------------------
# Email Configuration (Gmail SMTP for Testing)
# -----------------------
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=HRMS Testing <your-gmail@gmail.com>
```

### 4. **Test the Configuration**
```bash
cd backend
node test-profile-deletion-email.js
```

## 🔧 **Current vs Gmail Configuration**

### **Current Configuration (Vitrux):**
```env
EMAIL_HOST=mail.vitruxshield.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=thaya.govzig@vitruxshield.com
EMAIL_PASS=Welcome@2025
```

### **Gmail Configuration:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
```

## 🐛 **Debugging Email Issues**

### **Common Problems:**
1. **Authentication Failed**: Wrong password or need App Password
2. **Connection Refused**: Wrong host/port combination
3. **TLS/SSL Issues**: Wrong EMAIL_SECURE setting

### **Gmail SMTP Settings:**
- **Host**: `smtp.gmail.com`
- **Port**: `587` (TLS) or `465` (SSL)
- **Security**: 
  - Port 587: `EMAIL_SECURE=false` (uses STARTTLS)
  - Port 465: `EMAIL_SECURE=true` (uses SSL)

### **Test Commands:**
```bash
# Test email configuration
node test-profile-deletion-email.js

# Test all email notifications
node test-all-email-notifications.js

# Check server logs
pm2 logs hrms
```

## 🎯 **Expected Email Content**

When Tyler Durden's profile is deleted, he should receive:

**Subject**: Profile Deletion Notice  
**Type**: Warning notification  
**Content**: 
> Your profile has been deleted from the HRMS system. If you have any questions, please contact your administrator.

## 📋 **Troubleshooting Checklist**

- [ ] 2-Factor Authentication enabled on Gmail
- [ ] App Password generated (16 characters)
- [ ] Correct Gmail SMTP settings in .env
- [ ] Server restarted after .env changes
- [ ] Test script runs without errors
- [ ] Check spam/junk folder
- [ ] Verify recipient email address is correct

## 🔄 **Switch Back to Production**

After testing, switch back to your production email settings:
```env
EMAIL_HOST=mail.vitruxshield.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=thaya.govzig@vitruxshield.com
EMAIL_PASS=Welcome@2025
```
