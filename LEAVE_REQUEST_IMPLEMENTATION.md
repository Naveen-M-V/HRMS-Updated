# Leave Request & Approval Feature - Implementation Summary

## Overview
Complete Leave Request & Approval system for HRMS with employee dashboard integration and admin approval workflow.

## Backend Implementation

### 1. LeaveRequest Model (`/backend/models/LeaveRequest.js`)
- **Fields:**
  - `employeeId` (ObjectId, required) - Employee requesting leave
  - `approverId` (ObjectId, required) - Manager/Admin approving leave
  - `leaveType` (String) - Sick, Casual, Paid, Unpaid, Maternity, Paternity, Bereavement, Other
  - `startDate` (Date, required) - Leave start date
  - `endDate` (Date, required) - Leave end date
  - `numberOfDays` (Number) - Auto-calculated from date range
  - `reason` (String, required) - Reason for leave (min 10 chars)
  - `status` (String) - Draft, Pending, Approved, Rejected
  - `adminComment` (String) - Optional approval notes
  - `rejectionReason` (String) - Reason if rejected
  - `approvedAt` (Date) - Approval timestamp
  - `rejectedAt` (Date) - Rejection timestamp
  - `createdAt` (Date) - Creation timestamp
  - `updatedAt` (Date) - Last update timestamp

### 2. API Routes (`/backend/routes/leaveRoutes.js`)
Added new endpoints:
- `POST /api/leave/requests` - Create leave request
- `GET /api/leave/requests/pending` - Get pending requests for approver
- `GET /api/leave/requests/employee/:employeeId` - Get employee's requests
- `POST /api/leave/requests/:id/approve` - Approve request
- `POST /api/leave/requests/:id/reject` - Reject request

### 3. Controller Logic (`/backend/controllers/leaveRequestController.js`)
- Comprehensive validation for all fields
- Overlapping leave detection
- Leave balance updates on approval
- Notification creation for employees
- Proper error handling and response formatting

## Frontend Implementation

### 1. Components Created

#### LeaveRequestForm.js
- Form for submitting new leave requests
- Fields: Manager selection, Leave Type, Date Range, Reason
- Save as Draft or Send Request options
- Real-time field validation
- Character counter for reason field
- Days calculation display

#### LeaveBalanceCards.js
- Displays remaining and used leave days
- Progress bar for leave usage
- Gradient card design matching HRMS theme
- Real-time balance updates

#### UpcomingLeavesCard.js
- Shows next 3 approved leaves
- Color-coded by leave type
- Date range and duration display
- Empty state handling

#### EmployeeLeaveSection.js
- Complete leave management dashboard
- Integrates all leave components
- My Requests list with filtering
- Status indicators and icons
- Responsive grid layout

### 2. Integration Points

#### Employee Dashboard
Add to employee dashboard:
```jsx
import EmployeeLeaveSection from './components/EmployeeLeaveSection';

// In dashboard JSX:
<EmployeeLeaveSection />
```

#### Existing ManagerApprovalDashboard
The existing `/manager-approvals` page already handles leave approvals.
Update it to use new LeaveRequest API endpoints:
- Change API calls from `/api/leave/requests/pending` to match new endpoints
- Update field mappings (leaveType, numberOfDays, etc.)

## API Endpoints Summary

### Employee Endpoints
- `POST /api/leave/requests` - Submit new request
- `GET /api/leave/requests/employee/:employeeId` - View own requests
- `PATCH /api/leave/requests/:id` - Update draft request
- `DELETE /api/leave/requests/:id` - Delete draft request

### Manager/Admin Endpoints
- `GET /api/leave/requests/pending` - View pending approvals
- `PATCH /api/leave/requests/:id/approve` - Approve request
- `PATCH /api/leave/requests/:id/reject` - Reject request

## Database Schema

```javascript
LeaveRequest {
  employeeId: ObjectId (ref: EmployeeHub),
  approverId: ObjectId (ref: EmployeeHub),
  leaveType: String (enum),
  startDate: Date,
  endDate: Date,
  numberOfDays: Number,
  reason: String,
  status: String (enum: ['Draft', 'Pending', 'Approved', 'Rejected']),
  adminComment: String,
  rejectionReason: String,
  approvedAt: Date,
  rejectedAt: Date,
  timestamps: true
}
```

## Features Implemented

✅ Employee can request leave with multiple types
✅ Draft save functionality
✅ Date range validation
✅ Overlapping leave detection
✅ Manager/Admin approval workflow
✅ Rejection with reason
✅ Leave balance updates on approval
✅ Upcoming leaves display
✅ Leave balance cards
✅ Request history with filtering
✅ Toast notifications
✅ Professional UI matching HRMS theme
✅ Responsive design
✅ No browser alerts (all toast notifications)

## Status Workflow

```
Draft → (Submit) → Pending → Approved/Rejected
         ↓
      (Delete)
```

## Leave Types Supported
- Sick
- Casual
- Paid
- Unpaid
- Maternity
- Paternity
- Bereavement
- Other

## Integration Checklist

- [x] Backend model created
- [x] API routes added to leaveRoutes.js
- [x] Controller logic implemented
- [x] Frontend components created
- [x] Form validation implemented
- [x] Leave balance integration
- [x] Notification system ready
- [ ] Add to Employee Dashboard (needs routing)
- [ ] Update ManagerApprovalDashboard API calls
- [ ] Add route in App.js if needed
- [ ] Test end-to-end workflow

## Next Steps

1. **Update Employee Dashboard** - Add EmployeeLeaveSection component
2. **Update ManagerApprovalDashboard** - Map new API response fields
3. **Add Routes** - Ensure `/leave-management` or similar route exists
4. **Test Workflow** - Full leave request submission and approval cycle
5. **Notifications** - Verify email notifications are sent
6. **Leave Balance** - Confirm balance updates correctly on approval

## Notes

- All dates use ISO format for consistency
- Leave balance is updated only on approval (not pending)
- Unpaid leave doesn't affect leave balance
- Employees can only view/edit their own requests
- Managers/Admins can only approve requests assigned to them
- All timestamps are stored in UTC
