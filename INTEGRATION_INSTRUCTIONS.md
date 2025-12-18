# Unified Leave Management System - Integration Instructions

## Quick Start

Follow these steps to integrate the unified leave management system into your application.

## Step 1: Update server.js

Add the unified leave routes and cron job to your server.js file.

**Location:** `e:\Websites\HRMSLeave\HRMS-Updated\backend\server.js`

**Add these imports** (around line 2815, after existing route imports):
```javascript
const unifiedLeaveRoutes = require('./routes/unifiedLeaveRoutes');
const { scheduleAbsenceDetection } = require('./cron/absenceDetectionCron');
```

**Replace the existing leave routes** (around line 3435-3436):
```javascript
// OLD - REMOVE THESE:
// app.use('/api/leave', authenticateSession, leaveRoutes);
// app.use('/api/leave-requests', authenticateSession, leaveRequestRoutes);

// NEW - ADD THIS:
app.use('/api/leave', authenticateSession, unifiedLeaveRoutes);
```

**Add cron job initialization** (after MongoDB connection, around line 3800):
```javascript
// Start absence detection cron job
scheduleAbsenceDetection();
console.log('✅ Absence detection cron job initialized');
```

## Step 2: Update Rota Controller (Shift Validation)

Add shift validation to prevent creating shifts for employees on approved leave.

**Location:** `e:\Websites\HRMSLeave\HRMS-Updated\backend\controllers\rotaController.js`

**Add import at the top:**
```javascript
const { validateShiftAssignment, validateBulkShiftAssignments } = require('../middleware/shiftValidation');
```

**Update shift creation routes** (in rotaRoutes.js):
```javascript
// Single shift creation
router.post('/shifts', validateShiftAssignment, rotaController.createShift);

// Bulk shift creation (if exists)
router.post('/shifts/bulk', validateBulkShiftAssignments, rotaController.createBulkShifts);
```

## Step 3: Install Required Dependencies

Ensure you have the `node-cron` package installed:

```bash
npm install node-cron
```

## Step 4: Frontend Integration

### Employee Dashboard - Request Leave Button

**Component:** `UserDashboard.js` or `LeaveRequestForm.js`

```javascript
const submitLeaveRequest = async (formData) => {
  try {
    const response = await fetch('/api/leave/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        status: 'Pending' // or 'Draft'
      })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Leave request submitted successfully!');
      // Refresh leave requests list
    }
  } catch (error) {
    console.error('Error submitting leave request:', error);
  }
};
```

### Admin Dashboard - Pending Requests Section

**Component:** `AdminCalendar.js` or `PendingRequests.js`

```javascript
const fetchPendingRequests = async () => {
  try {
    const response = await fetch('/api/leave/pending-requests', {
      credentials: 'include'
    });
    const data = await response.json();
    setPendingRequests(data.data);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
  }
};

const approveLeaveRequest = async (leaveId, comment) => {
  try {
    const response = await fetch(`/api/leave/approve/${leaveId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ adminComment: comment })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Leave request approved!');
      fetchPendingRequests(); // Refresh list
    }
  } catch (error) {
    console.error('Error approving leave:', error);
  }
};

const rejectLeaveRequest = async (leaveId, reason) => {
  try {
    const response = await fetch(`/api/leave/reject/${leaveId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rejectionReason: reason })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Leave request rejected');
      fetchPendingRequests();
    }
  } catch (error) {
    console.error('Error rejecting leave:', error);
  }
};
```

### Admin Calendar - "+ Time Off" Button

**Component:** `AdminCalendar.js`

```javascript
const addTimeOff = async (employeeId, startDate, endDate, leaveType, reason) => {
  try {
    const response = await fetch('/api/leave/admin/time-off', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        employeeId,
        leaveType,
        startDate,
        endDate,
        reason
      })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Time off added successfully!');
      fetchCalendarLeaves(); // Refresh calendar
    }
  } catch (error) {
    console.error('Error adding time off:', error);
  }
};
```

### Calendar - Display Approved Leaves

**Component:** `Calendar.js` (both Admin and Employee)

```javascript
const fetchCalendarLeaves = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
    
    // For employee calendar, add employeeId
    if (userRole === 'employee') {
      params.append('employeeId', currentUserId);
    }
    
    const response = await fetch(`/api/leave/calendar?${params}`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    // Convert to calendar events
    const leaveEvents = data.data.map(leave => ({
      id: leave._id,
      title: `${leave.employeeId.firstName} ${leave.employeeId.lastName} - ${leave.leaveType}`,
      start: new Date(leave.startDate),
      end: new Date(leave.endDate),
      allDay: true,
      backgroundColor: '#ff6b6b',
      borderColor: '#ff6b6b',
      extendedProps: {
        type: 'leave',
        leaveType: leave.leaveType,
        employee: leave.employeeId
      }
    }));
    
    setCalendarEvents([...shiftEvents, ...leaveEvents]);
  } catch (error) {
    console.error('Error fetching calendar leaves:', error);
  }
};
```

### EmployeeHub - Absence Section

**Component:** `EmployeeHubAbsence.js`

```javascript
// Add Annual Leave Button
const addAnnualLeave = async (employeeId, startDate, endDate, reason) => {
  try {
    const response = await fetch('/api/leave/employee-hub/annual-leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ employeeId, startDate, endDate, reason })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Annual leave added successfully!');
      fetchRecentAbsences(employeeId);
    }
  } catch (error) {
    console.error('Error adding annual leave:', error);
  }
};

// Add Sickness Button
const addSickness = async (employeeId, startDate, endDate, reason) => {
  try {
    const response = await fetch('/api/leave/employee-hub/sickness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ employeeId, startDate, endDate, reason })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Sickness record added successfully!');
      fetchRecentAbsences(employeeId);
    }
  } catch (error) {
    console.error('Error adding sickness:', error);
  }
};

// Add Lateness Button
const addLateness = async (employeeId, date, lateMinutes, reason) => {
  try {
    const response = await fetch('/api/leave/employee-hub/lateness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ employeeId, date, lateMinutes, reason })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Lateness recorded successfully!');
    }
  } catch (error) {
    console.error('Error recording lateness:', error);
  }
};

// Update Carry Over Button
const updateCarryOver = async (employeeId, carryOverDays, reason) => {
  try {
    const response = await fetch('/api/leave/employee-hub/carry-over', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ employeeId, carryOverDays, reason })
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Carry over days updated successfully!');
    }
  } catch (error) {
    console.error('Error updating carry over:', error);
  }
};

// Fetch Recent Absences
const fetchRecentAbsences = async (employeeId) => {
  try {
    const response = await fetch(`/api/leave/employee-hub/absences/${employeeId}?limit=10`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    setRecentAbsences(data.data);
  } catch (error) {
    console.error('Error fetching absences:', error);
  }
};
```

## Step 5: Testing

### Test Employee Leave Request Flow
1. Login as employee
2. Navigate to User Dashboard
3. Click "Request Time Off" button
4. Fill in leave details and submit
5. Verify request appears in admin pending section

### Test Admin Approval Flow
1. Login as admin
2. Navigate to Admin Dashboard calendar
3. Check "Pending Requests" section
4. Approve a leave request
5. Verify:
   - Leave appears on calendar
   - Employee receives notification
   - Shifts on those dates are cancelled
   - Leave balance is updated

### Test Time Off Creation
1. Login as admin
2. Navigate to calendar
3. Click "+ Time Off" button
4. Select employee, dates, and leave type
5. Submit
6. Verify leave appears on calendar immediately

### Test EmployeeHub Absence Section
1. Login as admin
2. Navigate to EmployeeHub
3. Select an employee
4. Go to "Absence" tab
5. Test each button:
   - Add Annual Leave
   - Add Time Off
   - Add Sickness
   - Add Lateness
   - Update Carry Over
6. Verify recent absences display correctly

### Test Absence Detection
1. Create a shift for an employee
2. Don't clock in
3. Wait 3 hours (or manually trigger detection)
4. Verify employee is marked as absent
5. Verify admin receives notification

### Test Shift Validation
1. Approve leave for an employee
2. Try to create a shift for that employee on a leave date
3. Verify shift creation is blocked with error message

## Step 6: Verify Database

Check that the following collections are working correctly:
- `leaverequests` - Employee leave requests
- `leaverecords` - Historical leave records
- `annualleavebalances` - Leave balances
- `shiftassignments` - Shifts (should have cancelled status for approved leaves)
- `timeentries` - Clock in/out records
- `notifications` - Leave-related notifications

## Step 7: Monitor Cron Job

Check server logs to verify the absence detection cron job is running:
```
✅ Absence detection cron job scheduled (12:00 PM daily)
```

To manually trigger absence detection for testing:
```javascript
const { runAbsenceDetectionNow } = require('./cron/absenceDetectionCron');
await runAbsenceDetectionNow();
```

## Troubleshooting

### Issue: Routes not found (404)
**Solution:** Verify `unifiedLeaveRoutes` is properly imported and mounted in server.js

### Issue: Shifts not being cancelled
**Solution:** Check that `ShiftAssignment` model is accessible and dates match correctly

### Issue: Cron job not running
**Solution:** 
1. Verify `node-cron` is installed
2. Check server logs for cron initialization message
3. Ensure `scheduleAbsenceDetection()` is called after MongoDB connection

### Issue: Notifications not appearing
**Solution:** 
1. Check Notification model exists
2. Verify admin users exist in database
3. Check notification fetching endpoint in frontend

### Issue: Leave balance not updating
**Solution:** 
1. Verify `AnnualLeaveBalance` records exist for employees
2. Check leave year dates cover the leave period
3. Ensure leave type is not 'Unpaid'

## API Endpoint Reference

See `UNIFIED_LEAVE_SYSTEM_GUIDE.md` for complete API documentation.

## Migration from Old System

### Old Endpoints (Deprecated)
- `/api/leave-requests/*` - Use `/api/leave/*` instead
- `/api/leave/requests/*` - Use `/api/leave/*` instead

### Backward Compatibility
The old `LeaveRequest` and `LeaveRecord` models are still used, so existing data remains intact. No data migration is required.

### Removing Old Files (Optional)
After verifying the new system works, you can optionally remove:
- `backend/controllers/leaveApprovalController.js`
- Update `backend/routes/leaveRoutes.js` to remove deprecated routes

## Support

For issues or questions, refer to:
- `UNIFIED_LEAVE_SYSTEM_GUIDE.md` - Complete system documentation
- API endpoint examples in this file
- Console logs for debugging

## Summary of Changes

✅ **Created:**
- `unifiedLeaveController.js` - Single controller for all leave operations
- `absenceDetectionService.js` - Automated absence tracking
- `unifiedLeaveRoutes.js` - Unified API endpoints
- `shiftValidation.js` - Middleware to prevent invalid shift creation
- `absenceDetectionCron.js` - Daily absence detection job

✅ **Features Implemented:**
- Employee leave request submission (goes to all admins)
- Admin approval/rejection workflow
- Admin time off creation from calendar
- EmployeeHub absence section (annual leave, sickness, lateness, carry over)
- Automatic shift cancellation on leave approval
- Shift creation validation (blocks if employee on leave)
- Automated absence detection (3-hour rule)
- Automated lateness tracking
- Automated overtime calculation
- Calendar integration (admin and employee views)
- Leave overlap detection
- Notifications and email alerts

✅ **Fixed Issues:**
- Dual model confusion (unified workflow)
- Controller duplication (single controller)
- Missing absence tracking (fully automated)
- Broken shift-leave integration (automatic cancellation + validation)
- Incomplete EmployeeHub features (all buttons implemented)
- Notification routing (all admins receive requests)
