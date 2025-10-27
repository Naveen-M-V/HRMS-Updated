# 🔄 RESTART INSTRUCTIONS - After Feature 1 Updates

## ⚠️ IMPORTANT: Backend Must Be Restarted

The backend server needs to be restarted to load the new routes and controllers.

---

## 🛑 Stop Backend Server

If your backend is currently running:

### Option 1: Terminal/Command Prompt
Press `Ctrl + C` in the terminal where backend is running

### Option 2: Task Manager (Windows)
1. Open Task Manager (`Ctrl + Shift + Esc`)
2. Find `node.exe` process
3. End the task

### Option 3: Kill Process (Windows PowerShell)
```powershell
Get-Process -Name node | Stop-Process -Force
```

---

## ✅ Start Backend Server

Navigate to backend directory and start:

```bash
cd backend
npm run dev
```

Expected output:
```
MongoDB connected successfully
Server is running on port 5003
Starting email notification schedulers...
```

---

## 🧪 Verify Backend is Working

### Test 1: Health Check
Open browser and visit:
```
http://localhost:5003/api/health
```

Should return: Server health information

### Test 2: Shift Assignments Endpoint
Use browser or Postman:
```
GET http://localhost:5003/api/rota/shift-assignments/statistics
```

Expected: JSON response (even if empty data)

### Test 3: Check Console
Backend console should show:
```
GET /api/rota/shift-assignments/statistics 200
```
(No 404 errors!)

---

## 🎨 Frontend - No Restart Needed

The frontend should automatically detect backend is back online. If you see issues:

1. **Refresh browser** (`Ctrl + R` or `F5`)
2. **Clear cache and reload** (`Ctrl + Shift + R`)
3. **Check browser console** for any remaining errors

---

## 📋 What Was Fixed

### File: `backend/server.js` (3 fixes)

**Fix 1 - Line 3384**: Added `authenticateSession` middleware to rota routes
- **Before**: `app.use('/api/rota', rotaRoutes);`
- **After**: `app.use('/api/rota', authenticateSession, rotaRoutes);`

**Fix 2 - Line 79**: Updated CORS allowed headers
- **Before**: `['Content-Type', 'Authorization', 'X-Requested-With']`
- **After**: `['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Accept']`
- **Why**: Frontend was sending Cache-Control headers that were being blocked

**Fix 3 - Line 78**: Added PATCH method to CORS
- **Before**: `['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']`
- **After**: `['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']`

### File: `backend/routes/rotaRoutes.js`
- **Route Order Fixed**: Specific paths now come before parameterized paths
- **Why**: Prevents `/shift-assignments/all` from matching `/:employeeId`
- **Result**: All endpoints now resolve correctly

---

## 🐛 Troubleshooting

### Still getting 404 errors?

**Check 1**: Backend is actually restarted
```bash
# Check if process is running
netstat -ano | findstr :5003
```

**Check 2**: Routes file has no syntax errors
```bash
cd backend
node -c routes/rotaRoutes.js
# Should print nothing (no errors)
```

**Check 3**: Controller file loads correctly
```bash
cd backend
node -c controllers/rotaController.js
# Should print nothing (no errors)
```

**Check 4**: Models load correctly
```bash
cd backend
node -c models/ShiftAssignment.js
# Should print nothing (no errors)
```

### Getting authentication errors?

Make sure you're logged in:
1. Go to `/login` page
2. Login with admin credentials
3. Check browser cookies (should have `talentshield.sid`)
4. Try accessing rota page again

### MongoDB connection issues?

Check `.env` file has correct MongoDB URI:
```
MONGODB_URI=mongodb://localhost:27017/talentshield
# or your MongoDB connection string
```

---

## ✅ Success Indicators

After restart, you should see:

### In Backend Console:
```
✓ MongoDB connected successfully
✓ Server is running on port 5003
✓ Starting email notification schedulers...
✓ GET /api/rota/shift-assignments/statistics 200 (no 404!)
```

### In Frontend:
- ✓ No red errors in browser console
- ✓ Statistics cards load with data
- ✓ Shift table displays (even if empty)
- ✓ No "Failed to load resource: 404" errors

### In Browser Network Tab:
```
GET /api/rota/shift-assignments/all?startDate=...     200 OK
GET /api/rota/shift-assignments/statistics?...        200 OK
```

---

## 🚀 Next Steps After Restart

1. ✅ Verify all endpoints return 200 (not 404)
2. ✅ Test creating a shift assignment
3. ✅ Test filtering shifts
4. ✅ Test export CSV
5. ✅ Check statistics update correctly

---

## 📞 Still Having Issues?

If problems persist after restart:

1. **Check logs** in backend terminal for specific errors
2. **Check browser console** for JavaScript errors
3. **Verify authentication** - logout and login again
4. **Clear all browser data** and try fresh
5. **Check MongoDB** is running and accessible

---

**Remember**: Always restart backend after modifying route files! 🔄
