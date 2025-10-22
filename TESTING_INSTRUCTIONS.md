# HRMS Clock System - Testing Instructions

## 🚀 Quick Start Guide

### 1. Start the Backend Server
```bash
cd backend
npm start
```
The server will start on `http://localhost:5003`

### 2. Seed the Database (Optional - for real data)
```bash
cd backend
npm run seed
```
This creates dummy users and time entries for testing.

### 3. Start the Frontend
```bash
cd frontend
npm start
```
The frontend will start on `http://localhost:3000`

## 👥 Test Accounts

### Admin Account
- **Email**: `admin@localhost.com`
- **Password**: `admin123`
- **Access**: Full admin dashboard with all clock management features

### Employee Accounts (after seeding)
- **john.smith@localhost.com** / `password123` (VTID: 1003)
- **david.levito@localhost.com** / `password123` (VTID: 1025)
- **khan.saleem@localhost.com** / `password123` (VTID: 1032)
- **arthur.williams@localhost.com** / `password123` (VTID: 1087)
- **sarah.johnson@localhost.com** / `password123` (VTID: 1045)
- **michael.brown@localhost.com** / `password123` (VTID: 1056)
- **emma.davis@localhost.com** / `password123` (VTID: 1067)
- **james.wilson@localhost.com** / `password123` (VTID: 1078)

## 🧪 Testing Features

### Admin Dashboard Testing

#### 1. Clock In/Out Overview (`/clock-overview`)
- ✅ View real-time employee statistics
- ✅ See employee status cards (Clocked In, Clocked Out, On Break, Absent)
- ✅ Auto-refresh every 30 seconds
- ✅ Employee list with current status
- ✅ Works with both real data and dummy data fallback

#### 2. Clock-ins Management (`/clock-ins`)
- ✅ View detailed employee table
- ✅ **Test Clock In/Out buttons** - Click to change employee status
- ✅ Filter employees by search term
- ✅ Status badges with color coding
- ✅ Pagination controls
- ✅ Real-time status updates

#### 3. Time History (`/time-history`)
- ✅ View historical time entries
- ✅ Date range filtering
- ✅ Employee search
- ✅ **Export to CSV** functionality
- ✅ **Add manual time entries** with breaks
- ✅ Sample data display

### Employee Dashboard Testing

#### 1. User Dashboard Clock-ins Tab
- ✅ Navigate to user dashboard
- ✅ Click on "Clock-ins" tab
- ✅ **Test Clock In/Out functionality**
- ✅ **Select work type**: Regular, Overtime, Weekend Overtime, Client-side Overtime
- ✅ **Select location**: Work From Office, Work From Home, Field, Client Side
- ✅ **Add breaks** when clocked in
- ✅ View current status

#### 2. Calendar View
- ✅ Switch to "Calendar View" tab
- ✅ Navigate between months
- ✅ View time entries on calendar
- ✅ Color-coded status indicators
- ✅ Today highlighting

## 🎯 Key Testing Scenarios

### Scenario 1: Admin Managing Employees
1. Login as admin (`admin@localhost.com` / `admin123`)
2. Go to Clock In/Out → Clock-ins
3. **Click Clock In button** for an employee with "Clocked Out" status
4. Verify status changes to "Clocked In" with green badge
5. **Click Clock Out button** for the same employee
6. Verify status changes to "Clocked Out" with blue badge
7. Check that statistics update in the overview page

### Scenario 2: Employee Self-Service
1. Login as employee (`john.smith@localhost.com` / `password123`)
2. Click on "Clock-ins" tab in dashboard
3. Select work type (e.g., "Regular")
4. Select location (e.g., "Work From Office")
5. **Click "Clock In" button**
6. Verify status shows "Clocked In"
7. **Click "Add Break" button**
8. Verify status shows "On Break"
9. **Click "Clock Out" button**
10. Verify status shows "Clocked Out"

### Scenario 3: Calendar and History
1. As employee, switch to "Calendar View" tab
2. Navigate to different months
3. Verify time entries appear on calendar
4. As admin, go to Time History
5. **Click "Export to CSV"** button
6. **Click "+ Add a shift"** button
7. Fill out manual time entry form
8. Verify entry appears in history

## 🔧 Demo Mode Features

The system includes **demo mode functionality** that works even without backend connection:

- **Dummy data fallback**: If API calls fail, sample data is displayed
- **Simulated actions**: Clock in/out buttons work with local state updates
- **Toast notifications**: Success/error messages for all actions
- **Visual feedback**: Loading states and status changes

## 🐛 Troubleshooting

### Backend Not Connected
- System automatically falls back to dummy data
- All buttons still work in demo mode
- Toast message indicates "demo mode" or "sample data"

### Database Issues
- Run `npm run seed` to populate with test data
- Check MongoDB connection in `.env` file
- Verify MongoDB is running locally

### Frontend Issues
- Check console for API errors
- Verify backend is running on port 5003
- Clear browser cache if needed

## ✅ Expected Behavior

### Admin Pages Should:
- Display employee lists with real-time status
- Allow clicking Clock In/Out buttons to change status
- Show statistics that update automatically
- Export functionality works
- Manual time entry works
- All filters and search work

### Employee Pages Should:
- Show personal clock in/out interface
- Allow selecting work type and location
- Clock in/out buttons work and update status
- Break functionality works
- Calendar shows personal time entries
- Status updates in real-time

### Both Should:
- Work with or without backend connection
- Show appropriate loading states
- Display success/error messages
- Have responsive design
- Auto-refresh data periodically

## 🎨 UI/UX Features

- **Color-coded status badges**: Green (Clocked In), Blue (Clocked Out), Orange (On Break), Red (Absent)
- **Responsive design**: Works on desktop and mobile
- **Loading animations**: Smooth loading states
- **Toast notifications**: User feedback for all actions
- **Modern styling**: Clean, professional interface
- **Intuitive navigation**: Easy to find and use features

## 📊 Data Flow

1. **Admin actions** → Update employee status → Refresh all views
2. **Employee actions** → Update own status → Refresh personal views
3. **API calls** → Real database updates → Live data sync
4. **Demo mode** → Local state updates → Simulated functionality

This testing setup ensures the system works perfectly for demonstration and development purposes!
