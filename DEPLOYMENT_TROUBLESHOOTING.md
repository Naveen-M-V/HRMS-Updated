# Document Management Module - Deployment Troubleshooting

## 🚨 **Current Issues & Solutions**

### 1. **Build Error: framer-motion not found**
```bash
# Fix: Install framer-motion in production
cd frontend
npm install framer-motion --save
```

### 2. **500 Internal Server Error on folder creation**
This is likely due to authentication middleware issues. Here's how to debug:

#### **Step 1: Test API Health**
```bash
curl https://hrms.athryan.com/api/documentManagement/health
```

#### **Step 2: Check Authentication**
Add this to your browser console:
```javascript
// Test if user is authenticated
fetch('/api/documentManagement/health')
  .then(res => res.json())
  .then(data => console.log('API Health:', data))
  .catch(err => console.error('API Error:', err));
```

#### **Step 3: Check Backend Logs**
Look for these specific errors in your backend logs:
- `User not authenticated`
- `Folder creation failed`
- Database connection errors

## 🔧 **Debugging Steps**

### **Backend Issues**

#### **Check if routes are registered:**
1. Verify `server.js` has:
   ```javascript
   const documentManagementRoutes = require('./routes/documentManagement');
   app.use('/api/documentManagement', authenticateSession, documentManagementRoutes);
   ```

#### **Check database models:**
1. Ensure `Folder.js` and `DocumentManagement.js` exist in `backend/models/`
2. Check MongoDB connection is working

#### **Check authentication middleware:**
The issue is likely that `req.user._id` is undefined. The updated code now handles:
```javascript
const userId = req.user?._id || req.user?.id || req.session?.user?.id;
```

### **Frontend Issues**

#### **Install missing dependencies:**
```bash
cd frontend
npm install framer-motion --save
npm run build
```

#### **Check API calls:**
The frontend should be making requests to:
```javascript
// Correct API endpoint
POST /api/documentManagement/folders
GET /api/documentManagement/folders
```

## 📋 **Deployment Checklist**

### **Before Deployment:**
- [ ] Install framer-motion: `npm install framer-motion --save`
- [ ] Test build locally: `npm run build`
- [ ] Verify backend routes are working
- [ ] Check database connection

### **After Deployment:**
- [ ] Test health endpoint: `/api/documentManagement/health`
- [ ] Test folder creation
- [ ] Test document upload
- [ ] Check browser console for errors

## 🛠 **Common Fixes**

### **Issue: "User not authenticated"**
**Cause**: Authentication middleware not properly setting `req.user`
**Fix**: 
1. Check if `authenticateSession` middleware is working
2. Verify user session is being maintained
3. Check if JWT tokens are being sent correctly

### **Issue: "Cannot find module"**
**Cause**: Missing dependencies
**Fix**: 
```bash
cd frontend
npm install
cd ../backend
npm install
```

### **Issue: Database connection errors**
**Cause**: MongoDB not connected or wrong credentials
**Fix**:
1. Check `MONGODB_URI` environment variable
2. Verify MongoDB server is running
3. Check network connectivity

## 🔍 **Debug API Endpoints**

### **Test these endpoints:**

```bash
# Health check
GET /api/documentManagement/health

# Get folders (should work without auth)
GET /api/documentManagement/folders

# Create folder (requires auth)
POST /api/documentManagement/folders
{
  "name": "Test Folder",
  "description": "Test description"
}
```

## 📝 **Error Messages & Meanings**

| Error | Cause | Solution |
|-------|--------|----------|
| `framer-motion not found` | Missing dependency | `npm install framer-motion --save` |
| `User not authenticated` | Auth middleware issue | Check session/JWT setup |
| `Internal Server Error` | Backend code issue | Check server logs |
| `Cannot POST /api/documentManagement/folders` | Route not registered | Check server.js routes |

## 🚀 **Quick Fix Commands**

```bash
# 1. Install missing frontend dependency
cd frontend
npm install framer-motion --save

# 2. Rebuild frontend
npm run build

# 3. Restart backend (if needed)
cd ../backend
npm restart

# 4. Test API
curl -X GET https://hrms.athryan.com/api/documentManagement/health
```

## 📞 **Support**

If issues persist:
1. Check browser console (F12) for JavaScript errors
2. Check backend logs for server errors
3. Verify all environment variables are set
4. Test with Postman/Insomnia for API debugging
