# 🔄 RESTART & TEST - Final Instructions

## ✅ ALL CODE FIXES APPLIED

### Files Fixed:
1. ✅ `backend/routes/clockRoutes.js` - Shift linking added to all 4 endpoints
2. ✅ `frontend/src/pages/ClockIns.js` - Demo data removed
3. ✅ `frontend/src/pages/ClockInOut.js` - Demo data removed
4. ✅ `frontend/src/pages/UserDashboard.js` - Clock-in widget added
5. ✅ `frontend/src/pages/CreateUser.js` - API URL fixed

---

## ⚡ MANDATORY: RESTART BOTH SERVERS

### Stop Current Servers:
```bash
# In backend terminal: Press Ctrl + C
# In frontend terminal: Press Ctrl + C
```

### Start Backend:
```bash
cd c:\Users\kanch\OneDrive\Desktop\hrms-updated\hrmsupdated\backend
npm start
```

**Wait for**:
```
✅ MongoDB connected successfully
✅ Server running on port 5003
```

### Start Frontend:
```bash
cd c:\Users\kanch\OneDrive\Desktop\hrms-updated\hrmsupdated\frontend
npm start
```

**Wait for**:
```
Compiled successfully!
You can now view frontend in the browser.
http://localhost:3000
```

---

## 🧪 TEST 1: Shift Status Updates

1. **Login** as admin: `http://localhost:3000/login`

2. **Create Shift**:
   - Go to: `http://localhost:3000/rota-management`
   - Click "+ Assign Shift"
   - Employee: Admin User
   - Date: **TODAY** (Oct 27, 2025)
   - Start: 09:00
   - End: 17:00
   - Location: Work From Office
   - Work Type: Regular
   - Click "Assign Shift"
   - ✅ Verify shift appears with status "📅 Scheduled"

3. **Clock In**:
   - Go to: `http://localhost:3000/user-dashboard`
   - Select Location: Work From Office (must match shift!)
   - Work Type: Regular
   - Click "✅ Clock In"
   - ✅ Should see success message

4. **Check Backend Console**:
   ```
   User clock-in: Updating shift to In Progress: 67...
   Shift status updated successfully
   ```

5. **Verify Status Changed**:
   - Go to: `http://localhost:3000/rota-management`
   - Press F5 to refresh
   - ✅ Status should show: "🟡 In Progress"
   - ✅ Actual Time should show clock-in time

6. **Clock Out**:
   - Go to: `/user-dashboard`
   - Click "🚪 Clock Out"
   - ✅ Should show hours worked

7. **Verify Completed**:
   - Refresh Rota Management
   - ✅ Status: "✅ Completed"

---

## 🧪 TEST 2: User Creation

1. **Go to**: `http://localhost:3000/create-user`

2. **Fill Form**:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@test.com
   - VTID: 1001 (optional)

3. **Click "Create User"**

4. **Check Backend Console** for:
   ```
   Creating new user account...
   Profile created: john.doe@test.com
   User account created and linked
   ```

5. **Expected Result**:
   - ✅ Success message
   - ✅ Email sent notification (if SMTP configured)
   - ✅ User appears in database

---

## 🐛 TROUBLESHOOTING

### Issue: "Shift status still shows Scheduled"

**Check Backend Console** - Should see:
```
User clock-in: Updating shift to In Progress: 67...
```

**If NOT seen**:
- Backend wasn't restarted
- Shift wasn't found (check date/location match)

**Debug**:
```bash
# Check MongoDB
use talentshield
db.shiftassignments.find().pretty()
# Should show your shift

db.timeentries.find().pretty()
# Should show your clock-in
```

### Issue: "User Dashboard shows Compliance"

**Solutions**:
1. Hard refresh: Ctrl + Shift + R
2. Clear browser cache completely
3. Try incognito mode
4. Make sure URL is: `http://localhost:3000/user-dashboard`

### Issue: "User Creation 404"

**Check**:
1. Backend is running
2. You're logged in as admin
3. Check backend console for errors

**Try this in browser console**:
```javascript
fetch('http://localhost:3000/api/users/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@test.com'
  })
}).then(r => r.json()).then(d => console.log(d));
```

### Issue: "Shows Admin instead of user name"

This is **CORRECT** if you only have one user in database (the admin).

**To add more employees**:
1. Use the Create User page
2. Once created, they'll appear in dropdowns with their actual names

**Current employees in DB**:
- Admin User (admin@localhost.com) - This is why you see "Admin"

**After creating "John Doe"**:
- John Doe will appear in employee dropdowns

---

## 📧 EMAIL ISSUES

Email might not send if SMTP isn't configured. This is OK for testing.

**To test without email**:
- User creation will still work
- Password will be logged in backend console
- You can use that password to login

**To enable emails** (optional):
1. Check `backend/.env` has:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   ```

2. For Gmail:
   - Enable 2FA
   - Generate App Password
   - Use that in EMAIL_PASS

---

## ✅ SUCCESS CRITERIA

After restart and testing:

### Rota Management:
- [ ] Can create shifts
- [ ] Status shows "Scheduled" initially
- [ ] After clock-in: Status changes to "In Progress"
- [ ] After clock-out: Status changes to "Completed"
- [ ] Actual Time column shows times

### User Dashboard:
- [ ] Shows at `/user-dashboard`
- [ ] Clock In/Out widget appears at top
- [ ] Can select location and work type
- [ ] Clock in works
- [ ] Clock out works

### Employee Data:
- [ ] No dummy data (John Smith, David Levito, etc.)
- [ ] Shows actual DB employees
- [ ] If only admin exists, shows "Admin User" (correct!)

### User Creation:
- [ ] Form submits successfully
- [ ] User appears in database
- [ ] Can assign shifts to new users

---

## 🚀 QUICK START COMMANDS

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend (wait for backend first)
cd frontend
npm start

# Then test at:
# http://localhost:3000
```

---

**Everything is fixed in the code. Just need to RESTART and TEST!** 🎉
