# 🚀 Quick Start - Run HRMS on Localhost

## Prerequisites Check
- ✅ Node.js installed (v16+)
- ✅ MongoDB running (local or cloud)
- ✅ Backend `.env` file configured
- ✅ Frontend `.env` file configured

---

## 🏃 Start the Application

### Option 1: Manual Start (Recommended)

**Step 1: Start Backend**
```bash
cd e:/Websites/HRMS/hrms/backend
npm start
```
✅ Backend will run on: http://localhost:5003

**Step 2: Start Frontend** (in a new terminal)
```bash
cd e:/Websites/HRMS/hrms/frontend
npm start
```
✅ Frontend will run on: http://localhost:3000

---

### Option 2: Using the Start Script

**Windows (PowerShell):**
```powershell
cd e:/Websites/HRMS/hrms
.\start-local.bat
```

**Mac/Linux:**
```bash
cd /e/Websites/HRMS/hrms
./start-local.sh
```

---

## 🎯 Access the Application

Once both servers are running:

1. **Open Browser:** http://localhost:3000
2. **Login with your credentials**
3. **Navigate to Rota Shift Management:**
   - Sidebar → Training Compliance → Rota Shift Management
   - Or direct: http://localhost:3000/rota-management

---

## 📋 First Time Setup for Rota Feature

### Step 1: Install Mobiscroll (if not already installed)
```bash
cd e:/Websites/HRMS/hrms/frontend
npm install @mobiscroll/react
```

### Step 2: Initialize Shifts
1. Go to Rota Shift Management page
2. Click "Init Shifts" button
3. This creates default shifts: Morning, Evening, Night

### Step 3: Generate Rota
1. Select Start Date (e.g., next Monday)
2. Select End Date (e.g., next Friday)
3. Click "Generate Rota"
4. View the timeline with colored shift assignments!

---

## 🔍 Verify Rota Changes

### Backend Changes Made:
- ✅ Models: `Shift.js`, `Employee.js`, `Rota.js`
- ✅ Controller: `rotaController.js`
- ✅ Routes: `rotaRoutes.js`
- ✅ Server.js: Routes registered (lines 2521, 3382)

### Frontend Changes Made:
- ✅ Page: `RotaShiftManagement.jsx`
- ✅ Component: `ShiftTimeline.js`
- ✅ API Service: `rotaApi.js`
- ✅ App.js: Route added (line 315)
- ✅ Sidebar: Menu item added

### Test the API:
```bash
# Initialize shifts
curl -X POST http://localhost:5003/api/rota/init-shifts

# Generate rota
curl -X POST http://localhost:5003/api/rota/generate \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-10-27","endDate":"2025-10-31"}'

# Get all rotas
curl http://localhost:5003/api/rota?startDate=2025-10-27&endDate=2025-10-31
```

---

## 🛠️ Troubleshooting

### Backend won't start?
- ✅ Check MongoDB connection in `.env`
- ✅ Verify PORT 5003 is not in use
- ✅ Run: `npm install` in backend folder

### Frontend won't start?
- ✅ Check PORT 3000 is not in use
- ✅ Verify `.env` has correct API URL
- ✅ Run: `npm install` in frontend folder

### Rota page not showing?
- ✅ Hard refresh browser (Ctrl+Shift+R)
- ✅ Check browser console for errors
- ✅ Verify @mobiscroll/react is installed

### No employees showing?
- ✅ Create employees through HRMS interface
- ✅ Or use existing employees in your database
- ✅ Ensure employees have `isActive: true`

---

## 📊 Environment Variables to Check

### Backend `.env`:
```env
PORT=5003
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env`:
```env
REACT_APP_API_URL=http://localhost:5003
REACT_APP_API_BASE_URL=http://localhost:5003
```

---

## 🎨 What You'll See in Rota Feature

1. **Timeline View** - Visual calendar with colored shift blocks
2. **Employee List** - All active employees on the left
3. **Shift Colors:**
   - 🔵 Blue = Morning Shift (9:00-17:00)
   - 🟠 Orange = Evening Shift (17:00-01:00)
   - 🟣 Purple = Night Shift (01:00-09:00)
4. **Date Range Controls** - Pick dates and generate rotas
5. **Statistics** - Total shifts, employees, and coverage

---

## 📚 Additional Documentation

- **Full Rota Guide:** [ROTA_README.md](file:///e:/Websites/HRMS/hrms/ROTA_README.md)
- **Setup Guide:** [ROTA_SETUP_GUIDE.md](file:///e:/Websites/HRMS/hrms/ROTA_SETUP_GUIDE.md)
- **Integration Status:** [INTEGRATION_COMPLETE.md](file:///e:/Websites/HRMS/hrms/INTEGRATION_COMPLETE.md)
- **Main README:** [README.md](file:///e:/Websites/HRMS/hrms/README.md)

---

**✨ You're ready to go! Start both servers and explore your new Rota Shift feature!**
