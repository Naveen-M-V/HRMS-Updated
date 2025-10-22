# 🛠️ Local Development Setup Guide

## Problem: MongoDB & Email Connection Errors

Your backend is trying to connect to:
- **Production MongoDB:** `65.21.71.57:27017` ❌ (Timeout)
- **Production Email Server:** ❌ (Connection failed)

**Solution:** Set up local development environment

---

## 🚀 Quick Setup (3 Options)

### **Option 1: Use MongoDB Atlas (Easiest - No Installation)**

1. **Create Free MongoDB Atlas Account:**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up (free forever)
   - Create a free cluster (takes 3-5 minutes)

2. **Get Connection String:**
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Should look like: `mongodb+srv://username:password@cluster.mongodb.net/`

3. **Update your `.env` file:**
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/hrms_local
   
   # Disable email (or leave empty)
   EMAIL_HOST=
   EMAIL_PORT=
   EMAIL_USER=
   EMAIL_PASS=
   
   # Keep these as-is
   PORT=5003
   NODE_ENV=development
   JWT_SECRET=local-dev-secret-key-12345
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:5003
   ```

4. **Restart backend:**
   ```bash
   npm start
   ```

---

### **Option 2: Install MongoDB Locally**

1. **Download MongoDB Community Server:**
   - Windows: https://www.mongodb.com/try/download/community
   - Choose: Windows x64, MSI package
   - Install with default settings

2. **Start MongoDB:**
   ```bash
   # MongoDB will auto-start as a service
   # Or manually start:
   net start MongoDB
   ```

3. **Update your `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/hrms_local
   
   # Disable email
   EMAIL_HOST=
   EMAIL_PORT=
   EMAIL_USER=
   EMAIL_PASS=
   
   PORT=5003
   NODE_ENV=development
   JWT_SECRET=local-dev-secret-key-12345
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:5003
   ```

4. **Restart backend:**
   ```bash
   npm start
   ```

---

### **Option 3: Use Existing Database with Modified Config**

If you have VPN/access to production database but want to test locally:

1. **Connect to VPN** (if required)

2. **Update only email settings in `.env`:**
   ```env
   # Keep your existing MONGODB_URI
   MONGODB_URI=mongodb://65.21.71.57:27017/hrms
   
   # Disable email to avoid SMTP errors
   EMAIL_HOST=
   EMAIL_PORT=
   EMAIL_USER=
   EMAIL_PASS=
   EMAIL_FROM=HRMS System <noreply@localhost>
   ```

3. **Restart backend:**
   ```bash
   npm start
   ```

---

## 🔧 Quick Fix Configuration

**Copy this to your `.env` file NOW (quick test):**

```env
# Server
PORT=5003
NODE_ENV=development

# Database - Choose ONE:
# Option A: MongoDB Atlas (replace with your connection string)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrms_local

# Option B: Local MongoDB (if installed)
# MONGODB_URI=mongodb://localhost:27017/hrms_local

# Security
JWT_SECRET=local-dev-secret-key-12345
JWT_EXPIRES_IN=24h
SESSION_SECRET=local-session-secret-67890

# Email - DISABLED (no email errors)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=HRMS Local <noreply@localhost>

# Admin
SUPER_ADMIN_EMAIL=admin@localhost.com

# Frontend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5003
CORS_ORIGINS=http://localhost:3000

# Disable certificate monitoring on startup
ENABLE_CERTIFICATE_MONITORING=false
```

---

## 🎯 Step-by-Step: MongoDB Atlas (Recommended)

### 1. Create Atlas Account
```
1. Visit: https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/email
3. Create Organization: "Personal"
4. Create Project: "HRMS Local"
```

### 2. Create Free Cluster
```
1. Click "Build a Database"
2. Choose: FREE (M0)
3. Select: AWS, Region closest to you
4. Cluster Name: "hrms-local"
5. Click "Create Deployment"
```

### 3. Configure Database Access
```
1. Security → Database Access → Add New Database User
   - Username: hrms_user
   - Password: Generate secure password (save it!)
   - Role: Atlas Admin
   - Click "Add User"
```

### 4. Configure Network Access
```
1. Security → Network Access → Add IP Address
2. Click "Allow Access from Anywhere" (for development)
3. Click "Confirm"
```

### 5. Get Connection String
```
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace <password> with your actual password
5. Add database name: /hrms_local at the end
```

**Example:**
```
mongodb+srv://hrms_user:YourPassword123@hrms-local.abc123.mongodb.net/hrms_local
```

### 6. Update .env & Restart
```bash
# Update MONGODB_URI in .env file
# Then restart:
npm start
```

---

## ✅ Verify It's Working

**Successful startup looks like:**
```
✅ Loaded environment: development from .env
✅ All required environment variables are present
Server running on port 5003
✅ Connected to MongoDB successfully
Certificate monitoring scheduled...
```

**No more errors about:**
- ❌ `ETIMEDOUT 65.21.71.57:27017`
- ❌ `Greeting never received` (email)

---

## 🧪 Test Your Setup

**1. Check MongoDB Connection:**
```bash
# In browser or curl:
curl http://localhost:5003/api/health
```

**2. Test Rota Feature:**
```bash
# Initialize shifts:
curl -X POST http://localhost:5003/api/rota/init-shifts

# Should return:
# {"message":"Default shifts initialized","shifts":[...]}
```

**3. Check if server is responding:**
```bash
curl http://localhost:5003/api/profiles
```

---

## 📋 Checklist

- [ ] MongoDB setup complete (Atlas or Local)
- [ ] `.env` file updated with new MONGODB_URI
- [ ] Email settings disabled/empty in `.env`
- [ ] Backend restarts without errors
- [ ] Can access http://localhost:5003
- [ ] Rota init-shifts works
- [ ] Frontend can connect to backend

---

## 🐛 Still Having Issues?

### Error: "ETIMEDOUT"
- **Cause:** Can't connect to database
- **Fix:** Double-check MONGODB_URI, ensure MongoDB is running

### Error: "Authentication failed"
- **Cause:** Wrong database username/password
- **Fix:** Verify credentials in Atlas or connection string

### Error: "Connection refused"
- **Cause:** MongoDB not running (if local)
- **Fix:** Start MongoDB service: `net start MongoDB`

### Error: "Greeting never received" (Email)
- **Cause:** Email server not accessible
- **Fix:** Set EMAIL_HOST= (empty) to disable emails

---

## 📁 Reference Files

- **Local Config Template:** [.env.local](file:///e:/Websites/HRMS/hrms/backend/.env.local)
- **Your Active Config:** `.env` (edit this file)
- **Main README:** [README.md](file:///e:/Websites/HRMS/hrms/README.md)

---

## 🎉 Next Steps After Setup

1. ✅ Backend running without errors
2. Start Frontend: `cd ../frontend && npm start`
3. Open: http://localhost:3000
4. Test Rota Feature: Sidebar → Rota Shift Management
5. Click "Init Shifts" to set up default shifts
6. Generate your first rota!

---

**Need help? Check console output for specific error messages.**
