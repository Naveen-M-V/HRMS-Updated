# 🚀 QUICK START GUIDE - Feature 1: Rota/Shift Management

## Prerequisites
- Node.js installed
- MongoDB running
- Backend and Frontend servers configured

---

## 🏃 Quick Start (Development)

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
```
Backend should start on: `http://localhost:5003`

### 2. Start Frontend
```bash
cd frontend
npm install
npm start
```
Frontend should start on: `http://localhost:3000`

---

## 🧪 Testing the Feature

### Step 1: Access the Page
1. Login as Admin
2. Navigate to **Rota/Shift Management** from sidebar

### Step 2: View Statistics
You should see 4 statistics cards:
- Total Shifts
- Total Hours
- Employees
- Office (location count)

### Step 3: Create Your First Shift
1. Click **"+ Assign Shift"** button
2. Fill in the form:
   - **Employee**: Select from dropdown
   - **Date**: Pick a future date
   - **Start Time**: 09:00 (example)
   - **End Time**: 17:00 (example)
   - **Location**: Office
   - **Work Type**: Regular
   - **Break**: 60 minutes
3. Click **"Assign Shift"**
4. Success toast should appear
5. Shift appears in table below

### Step 4: Test Filtering
1. **Date Range**: Change start/end dates → Table updates
2. **Location**: Select "Office" → Shows only office shifts
3. **Work Type**: Select "Overtime" → Shows only overtime
4. Click **"Export CSV"** → File downloads

### Step 5: Test Conflict Detection
1. Try assigning **same employee** on **same date** with overlapping times
2. Should show error: "Shift conflict detected"

### Step 6: Delete a Shift
1. Click **"Delete"** button on any shift row
2. Confirm the action
3. Shift removed from table

---

## 📝 Sample Data for Testing

### Test Shift 1
```json
{
  "employeeId": "USER_ID",
  "date": "2025-02-01",
  "startTime": "09:00",
  "endTime": "17:00",
  "location": "Office",
  "workType": "Regular",
  "breakDuration": 60
}
```

### Test Shift 2 (Different Location)
```json
{
  "employeeId": "USER_ID",
  "date": "2025-02-02",
  "startTime": "10:00",
  "endTime": "18:00",
  "location": "Home",
  "workType": "Regular",
  "breakDuration": 30
}
```

### Test Shift 3 (Overtime)
```json
{
  "employeeId": "USER_ID",
  "date": "2025-02-03",
  "startTime": "18:00",
  "endTime": "22:00",
  "location": "Client Site",
  "workType": "Overtime",
  "breakDuration": 0
}
```

---

## 🔍 Troubleshooting

### Problem: "No employees in dropdown"
**Solution**: Make sure there are active users in the database. Check:
```bash
# MongoDB Shell
db.users.find({ isActive: true }).count()
```

### Problem: "API call fails"
**Solution**: Check:
1. Backend is running on port 5003
2. Check `frontend/src/utils/apiConfig.js` has correct API URL
3. Check browser console for CORS errors

### Problem: "Statistics not showing"
**Solution**: 
1. Create at least one shift first
2. Make sure date range includes created shifts
3. Check browser network tab for API response

### Problem: "Cannot create shift"
**Solution**:
1. Ensure you're logged in as Admin
2. Check if employee exists in database
3. Verify date is in correct format (YYYY-MM-DD)

---

## 📊 Expected Behavior

### Location Colors
- **Office**: Blue badge
- **Home**: Green badge
- **Field**: Orange badge
- **Client Site**: Purple badge

### Status Colors
- **Scheduled**: Light blue
- **Completed**: Light green
- **Missed**: Light red
- **Swapped**: Light yellow
- **Cancelled**: Gray

### Filters
- All filters work independently
- Changing any filter triggers API call
- Statistics update with filters
- Table updates with filters

---

## ✅ Feature Checklist

Test all these features:
- [ ] Statistics cards display correctly
- [ ] Can open "Assign Shift" modal
- [ ] Can select employee from dropdown
- [ ] Can pick date, times, location, work type
- [ ] Can submit form successfully
- [ ] Shift appears in table
- [ ] Can filter by date range
- [ ] Can filter by location
- [ ] Can filter by work type
- [ ] Location badges show correct colors
- [ ] Can export CSV
- [ ] Can delete shift
- [ ] Conflict detection works
- [ ] Loading states show
- [ ] Toast notifications appear
- [ ] Mobile responsive

---

## 🔗 API Endpoints Reference

### Get All Shift Assignments
```
GET /api/rota/shift-assignments/all?startDate=2025-01-01&endDate=2025-01-31
```

### Assign New Shift
```
POST /api/rota/shift-assignments
Content-Type: application/json
Cookie: talentshield.sid=...

{
  "employeeId": "67...",
  "date": "2025-02-01",
  "startTime": "09:00",
  "endTime": "17:00",
  "location": "Office",
  "workType": "Regular",
  "breakDuration": 60
}
```

### Get Statistics
```
GET /api/rota/shift-assignments/statistics?startDate=2025-01-01&endDate=2025-01-31
```

### Delete Shift
```
DELETE /api/rota/shift-assignments/:shiftId
```

---

## 🎯 Next Steps

After testing Feature 1, proceed to:
- **Feature 2**: Leave Management System
- **Feature 3**: Enhanced Clock-In with Location/Work Type
- **Feature 4**: Enhanced Dashboard Widgets
- **Feature 5**: History Page Enhancements

---

**Happy Testing!** 🎉
