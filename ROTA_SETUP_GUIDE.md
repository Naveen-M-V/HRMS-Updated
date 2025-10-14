# Rota Shift Management - Setup Guide

## Overview
Complete MERN stack implementation for managing employee shift schedules with automatic rota generation and timeline visualization.

---

## Project Structure

```
backend/
├── models/
│   ├── Shift.js          # Shift types (Morning/Evening/Night)
│   ├── Employee.js       # Employee information
│   └── Rota.js           # Shift assignments
├── controllers/
│   └── rotaController.js # Business logic
└── routes/
    └── rotaRoutes.js     # API endpoints

frontend/
├── src/pages/
│   └── RotaShiftManagement.jsx  # Main page
├── src/components/
│   └── ShiftTimeline.js         # Timeline component
└── src/utils/
    └── rotaApi.js               # API service
```

---

## Backend Setup

### 1. Register Routes in server.js

Add this line to your backend `server.js`:

```javascript
app.use('/api/rota', require('./routes/rotaRoutes'));
```

### 2. Test Backend

Start backend server:
```bash
cd backend
npm start
```

Initialize default shifts:
```bash
curl -X POST http://localhost:5003/api/rota/init-shifts
```

---

## Frontend Setup

### 1. Install Mobiscroll

```bash
cd frontend
npm install @mobiscroll/react
```

### 2. Add Route to App.js

```javascript
import RotaShiftManagement from './pages/RotaShiftManagement';

<Route path="/rota-management" element={<RotaShiftManagement />} />
```

### 3. Configure Environment Variables

Ensure frontend `.env` has:
```env
REACT_APP_API_BASE_URL=http://localhost:5003
```

---

## Usage Instructions

### Step 1: Initialize Shifts (One-Time)
1. Navigate to Rota Shift Management page
2. Click "Init Shifts" button
3. Creates default shifts: Morning, Evening, Night

### Step 2: Add Employees
Employees must exist in database. Create test employees:

```javascript
db.employees.insertMany([
  { name: "John Smith", email: "john@company.com", department: "Operations", isActive: true },
  { name: "Jane Doe", email: "jane@company.com", department: "Sales", isActive: true }
]);
```

### Step 3: Generate Rota
1. Select Start Date and End Date
2. Click "Generate Rota"
3. System assigns shifts using round-robin rotation
4. Automatically skips weekends

---

## API Endpoints

### Generate Rota
```
POST /api/rota/generate
Body: { "startDate": "2025-10-20", "endDate": "2025-10-24" }
```

### Get All Rota
```
GET /api/rota?startDate=2025-10-20&endDate=2025-10-24
```

### Get Employee Rota
```
GET /api/rota/:employeeId?startDate=2025-10-20&endDate=2025-10-24
```

### Update Rota
```
PUT /api/rota/:rotaId
Body: { "shift": "shiftId", "status": "Confirmed" }
```

### Delete Rota
```
DELETE /api/rota/:rotaId
```

---

## Customization

### Change Shift Colors

Edit `backend/controllers/rotaController.js`:

```javascript
const defaultShifts = [
  { name: 'Morning', startTime: '09:00', endTime: '17:00', color: '#10b981' },
  { name: 'Evening', startTime: '17:00', endTime: '01:00', color: '#f59e0b' }
];
```

### Include Weekends

Comment out weekend skip in `rotaController.js`:

```javascript
// if (isWeekend(date)) continue;  // Comment this line
```

---

## Troubleshooting

**Issue: "No shifts found"**
Solution: Run init-shifts endpoint

**Issue: Timeline not displaying**
Solution: Check Mobiscroll installation and API response structure

**Issue: "No active employees found"**
Solution: Ensure employees have `isActive: true`

---

## Dependencies

Backend:
- mongoose
- express

Frontend:
- react
- @mobiscroll/react
- axios
- react-toastify

---

## Testing Checklist

- [ ] Backend routes registered
- [ ] MongoDB connection working
- [ ] Default shifts initialized
- [ ] Test employees created
- [ ] Frontend route added
- [ ] Mobiscroll installed
- [ ] Generate rota works
- [ ] Timeline displays correctly

---

You're done! Generate your first rota and enjoy the timeline view.
