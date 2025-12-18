# Unified Leave Management System - Implementation Guide

## Overview
This document describes the unified leave management system that consolidates all leave-related functionality into a single, coherent workflow.

## Architecture

### Models
1. **LeaveRequest** - Employee-initiated leave requests (Draft/Pending/Approved/Rejected)
2. **LeaveRecord** - Historical leave records for reporting (annual/sick/unpaid/absent)
3. **AnnualLeaveBalance** - Tracks leave entitlements and usage per employee
4. **ShiftAssignment** - Employee shift schedules
5. **TimeEntry** - Clock in/out records

### Controllers
- **unifiedLeaveController.js** - Single controller handling all leave operations

### Services
- **absenceDetectionService.js** - Automated absence, lateness, and overtime detection

### Routes
- **unifiedLeaveRoutes.js** - All leave endpoints in one place

## Key Features

### 1. Employee Leave Request Flow
**Endpoint:** `POST /api/leave/request`

**Flow:**
1. Employee submits leave request from User Dashboard
2. Request goes to **all admins and super-admins** (no need to select approver)
3. Admins see request in "Pending Requests" section of calendar
4. Admin approves/rejects from admin dashboard

**Request Body:**
```json
{
  "leaveType": "Paid|Sick|Casual|Unpaid|Maternity|Paternity|Bereavement|Other",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "reason": "Vacation with family",
  "status": "Pending|Draft"
}
```

### 2. Admin Approval Workflow
**Endpoints:**
- `GET /api/leave/pending-requests` - Get all pending requests
- `PATCH /api/leave/approve/:id` - Approve a request
- `PATCH /api/leave/reject/:id` - Reject a request

**What Happens on Approval:**
1. LeaveRequest status updated to "Approved"
2. LeaveRecord created for reporting
3. AnnualLeaveBalance updated (if not unpaid leave)
4. **All shifts on leave dates automatically cancelled**
5. Employee notified via notification and email
6. Team members in same department notified

### 3. Admin Time Off Creation
**Endpoint:** `POST /api/leave/admin/time-off`

**Use Case:** Admin adds time off directly from calendar "+ Time Off" button

**Request Body:**
```json
{
  "employeeId": "employee_id_here",
  "leaveType": "Paid",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "reason": "Admin-added time off"
}
```

**What Happens:**
1. Creates pre-approved LeaveRequest
2. Creates LeaveRecord
3. Updates balance
4. Cancels shifts
5. Notifies employee

### 4. EmployeeHub Absence Section
**Endpoints:**
- `POST /api/leave/employee-hub/annual-leave` - Add annual leave
- `POST /api/leave/employee-hub/sickness` - Add sickness record
- `POST /api/leave/employee-hub/lateness` - Record lateness
- `PATCH /api/leave/employee-hub/carry-over` - Update carry over days
- `GET /api/leave/employee-hub/absences/:employeeId` - Get recent absences

**Buttons in UI:**
- "Add Annual Leave" → Calls annual-leave endpoint
- "Add Time Off" → Same as admin time-off endpoint
- "Update Carry Over" → Calls carry-over endpoint
- "Sickness" → Calls sickness endpoint
- "Lateness" → Calls lateness endpoint

### 5. Calendar Integration
**Endpoints:**
- `GET /api/leave/calendar` - Get approved leaves for calendar display
- `GET /api/leave/overlaps` - Detect team leave overlaps

**Calendar Display:**
- **Admin Calendar:** Shows all approved leaves + shifts
- **Employee Calendar:** Shows only their approved leaves + their shifts

**Query Parameters:**
```
?startDate=2024-01-01&endDate=2024-01-31&employeeId=optional
```

### 6. Absence Tracking (Automated)

#### Absence Detection Logic
**Runs:** Daily at 12:00 PM via cron job

**Rules:**
1. **Absence:** If employee doesn't clock in within 3 hours of shift start → Marked as absent
2. **Lateness:** If employee clocks in within 3 hours but late → Lateness recorded
3. **Overtime:** If employee clocks out after shift end time (+15 min grace) → Overtime recorded

**What Happens:**
- Absence creates LeaveRecord with type='absent'
- Shift status changed to 'Missed'
- Admins notified
- Lateness/overtime added to TimeEntry notes

#### Manual Absence Recording
Admins can manually add sickness/lateness via EmployeeHub Absence section.

### 7. Shift-Leave Synchronization

#### Automatic Shift Cancellation
When leave is approved, all shifts with status 'Scheduled' or 'Pending' on those dates are automatically cancelled.

#### Shift Creation Prevention
**Middleware:** `shiftValidation.js`

**Usage in Rota Controller:**
```javascript
const { validateShiftAssignment } = require('../middleware/shiftValidation');

router.post('/shifts', validateShiftAssignment, rotaController.createShift);
```

**What It Does:**
- Checks if employee has approved leave on shift date
- Prevents shift creation if leave exists
- Returns error with reason

## API Endpoints Summary

### Employee Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/leave/request` | Create leave request |
| GET | `/api/leave/my-requests` | Get own leave requests |
| GET | `/api/leave/calendar` | Get calendar leaves |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leave/pending-requests` | Get pending requests |
| PATCH | `/api/leave/approve/:id` | Approve request |
| PATCH | `/api/leave/reject/:id` | Reject request |
| POST | `/api/leave/admin/time-off` | Create time off |
| GET | `/api/leave/overlaps` | Detect overlaps |

### EmployeeHub Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/leave/employee-hub/annual-leave` | Add annual leave |
| POST | `/api/leave/employee-hub/sickness` | Add sickness |
| POST | `/api/leave/employee-hub/lateness` | Record lateness |
| PATCH | `/api/leave/employee-hub/carry-over` | Update carry over |
| GET | `/api/leave/employee-hub/absences/:id` | Get absences |

## Integration Steps

### 1. Update server.js
```javascript
const unifiedLeaveRoutes = require('./routes/unifiedLeaveRoutes');
const { scheduleAbsenceDetection } = require('./cron/absenceDetectionCron');

// Add route
app.use('/api/leave', authenticateSession, unifiedLeaveRoutes);

// Start cron job
scheduleAbsenceDetection();
```

### 2. Update Rota Controller
Add shift validation middleware:
```javascript
const { validateShiftAssignment, validateBulkShiftAssignments } = require('../middleware/shiftValidation');

// Single shift creation
router.post('/shifts', validateShiftAssignment, createShift);

// Bulk shift creation
router.post('/shifts/bulk', validateBulkShiftAssignments, createBulkShifts);
```

### 3. Frontend Integration

#### Employee Dashboard - Request Leave
```javascript
// POST /api/leave/request
const response = await fetch('/api/leave/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    leaveType: 'Paid',
    startDate: '2024-01-15',
    endDate: '2024-01-20',
    reason: 'Family vacation',
    status: 'Pending'
  })
});
```

#### Admin Dashboard - Pending Requests
```javascript
// GET /api/leave/pending-requests
const response = await fetch('/api/leave/pending-requests');
const { data } = await response.json();
// Display in calendar pending section
```

#### Admin Dashboard - Approve Leave
```javascript
// PATCH /api/leave/approve/:id
const response = await fetch(`/api/leave/approve/${leaveId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    adminComment: 'Approved - enjoy your time off'
  })
});
```

#### Calendar - Add Time Off Button
```javascript
// POST /api/leave/admin/time-off
const response = await fetch('/api/leave/admin/time-off', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: selectedEmployee,
    leaveType: 'Paid',
    startDate: selectedDate,
    endDate: selectedDate,
    reason: 'Time off'
  })
});
```

#### Calendar - Display Leaves
```javascript
// GET /api/leave/calendar?startDate=2024-01-01&endDate=2024-01-31
const response = await fetch(`/api/leave/calendar?startDate=${start}&endDate=${end}`);
const { data } = await response.json();
// Map to calendar events
const events = data.map(leave => ({
  title: `${leave.employeeId.firstName} - ${leave.leaveType}`,
  start: leave.startDate,
  end: leave.endDate,
  color: '#ff6b6b'
}));
```

#### EmployeeHub - Absence Section
```javascript
// Add Annual Leave
await fetch('/api/leave/employee-hub/annual-leave', {
  method: 'POST',
  body: JSON.stringify({ employeeId, startDate, endDate, reason })
});

// Add Sickness
await fetch('/api/leave/employee-hub/sickness', {
  method: 'POST',
  body: JSON.stringify({ employeeId, startDate, endDate, reason })
});

// Add Lateness
await fetch('/api/leave/employee-hub/lateness', {
  method: 'POST',
  body: JSON.stringify({ employeeId, date, lateMinutes, reason })
});

// Get Recent Absences
const response = await fetch(`/api/leave/employee-hub/absences/${employeeId}?limit=10`);
```

## Notifications

### Notification Types
1. **leave_request** - New leave request submitted (to admins)
2. **leave_approved** - Leave request approved (to employee)
3. **leave_rejected** - Leave request rejected (to employee)
4. **team_leave** - Team member on leave (to team members)
5. **absence** - Employee absence detected (to admins)
6. **lateness** - Significant lateness detected (to admins)

### Email Notifications
- Employee receives email on approval/rejection
- Uses existing email service functions

## Database Queries

### Check if Employee Has Leave on Date
```javascript
const hasLeave = await LeaveRecord.findOne({
  user: employeeId,
  status: 'approved',
  startDate: { $lte: date },
  endDate: { $gte: date }
});
```

### Get All Pending Requests
```javascript
const pending = await LeaveRequest.find({ status: 'Pending' })
  .populate('employeeId', 'firstName lastName email department')
  .sort({ createdAt: -1 });
```

### Get Calendar Leaves for Date Range
```javascript
const leaves = await LeaveRequest.find({
  status: 'Approved',
  $or: [
    { startDate: { $gte: startDate, $lte: endDate } },
    { endDate: { $gte: startDate, $lte: endDate } },
    { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
  ]
});
```

## Testing Checklist

- [ ] Employee can submit leave request
- [ ] Request appears in admin pending section
- [ ] Admin can approve request
- [ ] Shifts are cancelled on approval
- [ ] Leave balance is updated
- [ ] Employee receives notification
- [ ] Admin can reject request with reason
- [ ] Admin can add time off from calendar
- [ ] Calendar displays approved leaves
- [ ] Employee calendar shows only their leaves
- [ ] EmployeeHub absence buttons work
- [ ] Absence detection runs daily
- [ ] Lateness is recorded correctly
- [ ] Overtime is calculated
- [ ] Shift creation is blocked for employees on leave
- [ ] Team members are notified of leave

## Migration Notes

### Deprecating Old Controllers
- **leaveApprovalController.js** - No longer used
- **leaveRequestController.js** - Replaced by unifiedLeaveController.js

### Deprecating Old Routes
- Old routes in `leaveRoutes.js` that use leaveApprovalController
- Old routes in `leaveRequestRoutes.js`

### Data Migration
No data migration needed - existing LeaveRequest and LeaveRecord data remains compatible.

## Troubleshooting

### Issue: Shifts not being cancelled
**Solution:** Check that `cancelShiftsForLeave` function is being called in approval flow.

### Issue: Absence not detected
**Solution:** 
1. Verify cron job is running
2. Check TimeEntry records exist
3. Verify shift start times are correct

### Issue: Employee can't submit leave
**Solution:** Check authentication middleware and user session.

### Issue: Notifications not sent
**Solution:** Verify Notification model and admin user records exist.

## Performance Considerations

1. **Indexes:** All models have appropriate indexes for date range queries
2. **Batch Operations:** Shift cancellation uses `updateMany` for efficiency
3. **Cron Timing:** Absence detection runs once daily to minimize load
4. **Query Optimization:** Uses lean queries where possible

## Security

1. **Authentication:** All routes require `authenticateSession` middleware
2. **Authorization:** Admin-only routes check user role
3. **Validation:** All inputs validated before processing
4. **Ownership:** Employees can only access their own data

## Future Enhancements

1. Add leave request withdrawal functionality
2. Implement leave request editing (before approval)
3. Add leave type-specific rules (e.g., sick leave documentation)
4. Implement leave request delegation
5. Add bulk time off creation for holidays
6. Implement leave forecasting and analytics
