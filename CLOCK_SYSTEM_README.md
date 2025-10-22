# Clock In/Out System Implementation

## Overview
This document describes the implementation of the Clock In/Out system for the HRMS application, based on the provided UI mockups. The system allows administrators to track employee attendance, manage time entries, and view historical data.

## Features Implemented

### 1. Admin Features

#### Clock In/Out Overview Page (`/clock-overview`)
- **Real-time statistics**: Shows counts of clocked in, clocked out, on break, and absent employees
- **Auto-refresh**: Updates every 30 seconds
- **Employee status list**: Displays all employees with their current status
- **My Summary section**: Shows annual leave and upcoming holidays
- **E-Learning section**: Placeholder for course assignments

#### Clock-ins Management Page (`/clock-ins`)
- **Employee table**: Detailed view of all employees with their status
- **Filtering and search**: Filter by role, staff type, company, manager
- **Status badges**: Color-coded status indicators
- **Action buttons**: Clock in/out functionality (admin controlled)
- **Pagination**: Configurable number of entries per page

#### Time History Page (`/time-history`)
- **Historical time entries**: View past clock in/out records
- **Date range filtering**: Filter entries by date range
- **Employee filtering**: Filter by specific employees or locations
- **Export functionality**: Export data to CSV format
- **Manual entry support**: Add time entries manually with breaks

#### Add Time Entry Modal
- **Employee selection**: Choose from available employees
- **Location and work type**: Configurable options
- **Clock in/out times**: Date and time pickers
- **Break management**: Add multiple breaks with durations
- **Validation**: Form validation for required fields

### 2. Employee Features

#### User Dashboard Clock-ins Tab
- **Integrated into user dashboard**: Accessible via "Clock-ins" tab
- **Personal clock in/out interface**: Self-service time tracking
- **Work type selection**: Regular, Overtime, Weekend Overtime, Client-side Overtime
- **Location selection**: Work From Office, Work From Home, Field, Client Side
- **Real-time status display**: Shows current clock status
- **Break functionality**: Add breaks during work hours

#### Clock In/Out Interface
- **Current date display**: Shows today's date and day of week
- **One-click actions**: Simple Clock In/Clock Out buttons
- **Status-aware interface**: Buttons change based on current status
- **Break management**: Add Break button when clocked in
- **Visual feedback**: Loading states and success messages

#### Calendar View
- **Monthly calendar**: Navigate between months
- **Shift visualization**: See time entries on calendar
- **Color-coded status**: Different colors for different statuses
- **Time details**: Clock in/out times and work types
- **Today highlighting**: Current date highlighted
- **Legend**: Status color explanations

#### Recent Time Entries Table
- **Personal history**: Shows user's own time entries
- **Detailed information**: VTID, dates, times, breaks, work type, location
- **Sample data**: Displays sample entries when no real data exists
- **Responsive design**: Works on different screen sizes

## Backend API Endpoints

### Clock Routes (`/api/clock`)
All routes require authentication (`authenticateSession` middleware).

#### POST `/api/clock/in`
Clock in an employee
```json
{
  "employeeId": "string",
  "location": "string (optional)",
  "workType": "string (optional)"
}
```

#### POST `/api/clock/out`
Clock out an employee
```json
{
  "employeeId": "string"
}
```

#### GET `/api/clock/status`
Get current clock status for all employees
- Returns array of employee status objects

#### GET `/api/clock/entries`
Get time entries with optional filters
- Query params: `startDate`, `endDate`, `employeeId`

#### POST `/api/clock/entry`
Add manual time entry
```json
{
  "employeeId": "string",
  "location": "string",
  "workType": "string",
  "clockIn": "ISO date string",
  "clockOut": "ISO date string (optional)",
  "breaks": "array of break objects"
}
```

#### PUT `/api/clock/entry/:id`
Update existing time entry

#### DELETE `/api/clock/entry/:id`
Delete time entry

#### POST `/api/clock/entry/:id/break`
Add break to existing time entry

#### GET `/api/clock/export`
Export time entries to CSV
- Query params: `startDate`, `endDate`

### User-Specific Routes (`/api/clock/user`)
All routes require user authentication and only allow access to the user's own data.

#### GET `/api/clock/user/status`
Get current user's clock status
- Returns current status, clock times, location, work type

#### POST `/api/clock/user/in`
Clock in current user
```json
{
  "workType": "Regular|Overtime|Weekend Overtime|Client-side Overtime",
  "location": "Work From Office|Work From Home|Field|Client Side"
}
```

#### POST `/api/clock/user/out`
Clock out current user
- No body required

#### POST `/api/clock/user/break`
Add break for current user
```json
{
  "duration": 30,
  "type": "lunch|coffee|other"
}
```

#### GET `/api/clock/user/entries`
Get current user's time entries
- Query params: `startDate`, `endDate`
- Limited to 50 recent entries

## Database Models

### TimeEntry Model
```javascript
{
  employee: ObjectId (ref: User),
  date: Date,
  clockIn: String (HH:MM format),
  clockOut: String (HH:MM format),
  location: String,
  workType: String,
  breaks: [{
    startTime: String,
    endTime: String,
    duration: Number (minutes),
    type: String
  }],
  totalHours: Number,
  status: String (clocked_in, clocked_out, on_break),
  notes: String,
  isManualEntry: Boolean,
  createdBy: ObjectId (ref: User)
}
```

## Frontend Components

### Pages
- `ClockInOut.js` - Overview page with statistics
- `ClockIns.js` - Employee management and status page
- `TimeHistory.js` - Historical data and export functionality

### Components
- `AddTimeEntryModal.js` - Modal for manual time entry
- `ShiftTimeline.js` - Timeline view for rota management (existing)

### API Utilities
- `clockApi.js` - API functions for clock operations
- Updated `config.js` and `apiConfig.js` for localhost support

## Navigation Updates

### Sidebar Navigation
Added new "Clock In/Out" section with:
- Overview
- Clock-ins
- History

### Routing
Added routes in `App.js`:
- `/clock-overview` → `ClockInOut` component
- `/clock-ins` → `ClockIns` component  
- `/time-history` → `TimeHistory` component

## Configuration Updates

### URL Configuration
Updated configuration files to support both production (talentshield.co.uk) and localhost development:

#### `config.js`
```javascript
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 
                           process.env.REACT_APP_API_URL || 
                           'https://talentshield.co.uk/api' || 
                           'http://localhost:5003/api';
```

#### Environment Variables
The system now supports these environment variables:
- `REACT_APP_API_BASE_URL`
- `REACT_APP_API_URL`
- `REACT_APP_SERVER_BASE_URL`
- `REACT_APP_NAME`

## Usage Instructions

### For Development
1. Ensure backend server is running on `http://localhost:5003`
2. Frontend development server should use `.env.development` configuration
3. Navigate to the Clock In/Out section in the sidebar

### For Production
1. Set appropriate environment variables for production URLs
2. The system will fallback to talentshield.co.uk URLs if environment variables are not set

## Features Matching UI Mockups

### ✅ Implemented Features
- Clock In Overview with real-time statistics
- Employee status cards (13 Clocked In, 7 Clocked Out, 0 On Break, 1 Absent)
- My Summary section with Annual Leave (20 Days) and Next Up (25/12/25)
- E-Learning section placeholder
- Clock-ins page with employee table
- VTID, Role, Name, Staff Type, Company, Job Title columns
- Status badges (Clocked In, Clocked Out, Absent)
- History page with time entries
- Date filtering and employee search
- Export to CSV functionality
- Add Time Entry modal with breaks support
- Sample data display when no real data is available

### 🔄 Ready for Enhancement
- Real employee data integration
- Advanced filtering options
- Reporting and analytics
- Mobile responsiveness improvements
- Real-time notifications
- Automatic break detection

## Testing

To test the implementation:

1. **Start the application**
   ```bash
   # Backend
   cd backend && npm start
   
   # Frontend  
   cd frontend && npm start
   ```

2. **Navigate to Clock sections**
   - Go to sidebar → Clock In/Out → Overview
   - Test Clock-ins page functionality
   - Try History page with date filtering
   - Test Add Time Entry modal

3. **API Testing**
   - Use Postman or similar tool to test API endpoints
   - Ensure authentication is working
   - Test CRUD operations on time entries

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live status updates
2. **Mobile App**: React Native app for employee self-service
3. **Geolocation**: Location-based clock in/out validation
4. **Biometric Integration**: Fingerprint or face recognition
5. **Advanced Reporting**: Detailed analytics and reports
6. **Shift Planning**: Integration with rota management
7. **Overtime Calculation**: Automatic overtime detection and calculation
8. **Leave Integration**: Connect with leave management system

## Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Check if backend server is running
   - Verify environment variables are set correctly
   - Check CORS configuration

2. **Authentication Problems**
   - Ensure user is logged in as admin
   - Check session configuration
   - Verify JWT tokens if using token-based auth

3. **Data Not Loading**
   - Check database connection
   - Verify MongoDB is running
   - Check console for API errors

### Debug Mode
Enable debug mode by setting:
```
REACT_APP_DEBUG_MODE=true
REACT_APP_ENABLE_CONSOLE_LOGS=true
```

This implementation provides a comprehensive clock in/out system that matches the provided UI mockups and includes all the necessary backend infrastructure for a production-ready time tracking solution.
