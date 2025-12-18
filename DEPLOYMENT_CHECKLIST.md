# Unified Leave System - Deployment Checklist

## Pre-Deployment Steps

### 1. Backup Database ✅
```bash
# Create MongoDB backup
mongodump --uri="mongodb://localhost:27017/hrms" --out=./backup-$(date +%Y%m%d)
```

### 2. Run Dry Run Migration ✅
```bash
cd backend
node scripts/migrateLeaveData.js --dry-run
```
Review the output to see what changes will be made.

### 3. Run Actual Migration ✅
```bash
node scripts/migrateLeaveData.js
```
This will:
- Create missing LeaveRecords for approved requests
- Recalculate all leave balances
- Cancel shifts for employees with approved leave
- Add numberOfDays to old requests
- Create backup file with migration summary

### 4. Verify Migration ✅
Check the migration summary in the console output and review the backup JSON file created in `backend/scripts/`.

### 5. Install Dependencies ✅
```bash
npm install node-cron
```

## Deployment Steps

### 1. Update Server Configuration ✅
The following changes have been made to `server.js`:
- ✅ Added `unifiedLeaveRoutes` import
- ✅ Replaced old leave routes with unified system
- ✅ Added absence detection cron job
- ✅ Kept legacy routes for backward compatibility

### 2. Update Rota Routes ✅
The following changes have been made to `rotaRoutes.js`:
- ✅ Added shift validation middleware
- ✅ Prevents shift creation for employees on approved leave

### 3. Restart Server ✅
```bash
# Stop current server
# Start server
npm start
```

### 4. Verify Server Logs ✅
Check that these messages appear in logs:
```
✅ Absence detection cron job initialized
📅 Scheduled document expiry checks to run daily at 9 AM
```

## Post-Deployment Verification

### 1. Test Employee Leave Request Flow ✅
- [ ] Login as employee
- [ ] Navigate to User Dashboard
- [ ] Click "Request Time Off"
- [ ] Submit leave request
- [ ] Verify request appears in admin pending section

### 2. Test Admin Approval Flow ✅
- [ ] Login as admin
- [ ] Navigate to Admin Dashboard
- [ ] Check "Pending Requests" section
- [ ] Approve a leave request
- [ ] Verify:
  - [ ] Leave appears on calendar
  - [ ] Employee receives notification
  - [ ] Shifts on those dates are cancelled
  - [ ] Leave balance is updated

### 3. Test Time Off Creation ✅
- [ ] Login as admin
- [ ] Navigate to calendar
- [ ] Click "+ Time Off" button
- [ ] Select employee, dates, and leave type
- [ ] Submit
- [ ] Verify leave appears on calendar immediately

### 4. Test EmployeeHub Absence Section ✅
- [ ] Login as admin
- [ ] Navigate to EmployeeHub
- [ ] Select an employee
- [ ] Go to "Absence" tab
- [ ] Test each button:
  - [ ] Add Annual Leave
  - [ ] Add Time Off
  - [ ] Add Sickness
  - [ ] Add Lateness
  - [ ] Update Carry Over
- [ ] Verify recent absences display correctly

### 5. Test Shift Validation ✅
- [ ] Approve leave for an employee
- [ ] Try to create a shift for that employee on a leave date
- [ ] Verify shift creation is blocked with error message

### 6. Test Calendar Display ✅
- [ ] Admin calendar shows all approved leaves
- [ ] Employee calendar shows only their leaves
- [ ] Leaves display correctly with employee names
- [ ] Date ranges are accurate

### 7. Test Absence Detection (Next Day) ✅
- [ ] Wait for cron job to run at 12:00 PM
- [ ] Or manually trigger: `node -e "require('./cron/absenceDetectionCron').runAbsenceDetectionNow()"`
- [ ] Verify absences are detected for employees who didn't clock in
- [ ] Verify lateness is recorded for late clock-ins
- [ ] Verify admin receives notifications

## API Endpoint Verification

### Test with curl or Postman:

#### 1. Submit Leave Request
```bash
curl -X POST http://localhost:5004/api/leave/request \
  -H "Content-Type: application/json" \
  -H "Cookie: talentshield.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "leaveType": "Paid",
    "startDate": "2024-01-15",
    "endDate": "2024-01-20",
    "reason": "Family vacation",
    "status": "Pending"
  }'
```

#### 2. Get Pending Requests (Admin)
```bash
curl http://localhost:5004/api/leave/pending-requests \
  -H "Cookie: talentshield.sid=YOUR_ADMIN_SESSION_COOKIE"
```

#### 3. Approve Leave Request
```bash
curl -X PATCH http://localhost:5004/api/leave/approve/LEAVE_REQUEST_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: talentshield.sid=YOUR_ADMIN_SESSION_COOKIE" \
  -d '{
    "adminComment": "Approved - enjoy your time off"
  }'
```

#### 4. Create Time Off
```bash
curl -X POST http://localhost:5004/api/leave/admin/time-off \
  -H "Content-Type: application/json" \
  -H "Cookie: talentshield.sid=YOUR_ADMIN_SESSION_COOKIE" \
  -d '{
    "employeeId": "EMPLOYEE_ID",
    "leaveType": "Paid",
    "startDate": "2024-01-15",
    "endDate": "2024-01-15",
    "reason": "Time off"
  }'
```

#### 5. Get Calendar Leaves
```bash
curl "http://localhost:5004/api/leave/calendar?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Cookie: talentshield.sid=YOUR_SESSION_COOKIE"
```

## Database Verification

### Check Collections:
```javascript
// In MongoDB shell or Compass

// Check LeaveRequests
db.leaverequests.find({ status: "Approved" }).count()

// Check LeaveRecords
db.leaverecords.find({ status: "approved" }).count()

// Check cancelled shifts
db.shiftassignments.find({ 
  status: "Cancelled",
  notes: { $regex: /Auto-cancelled/ }
}).count()

// Check leave balances
db.annualleavebalances.find().pretty()
```

## Frontend Integration Checklist

### 1. Update Employee Dashboard ✅
- [ ] Update leave request form to use `/api/leave/request`
- [ ] Remove approver selection field (automatic routing)
- [ ] Update leave requests list to use `/api/leave/my-requests`

### 2. Update Admin Dashboard ✅
- [ ] Update pending requests section to use `/api/leave/pending-requests`
- [ ] Update approve/reject handlers to use `/api/leave/approve/:id` and `/api/leave/reject/:id`
- [ ] Add "+ Time Off" button with `/api/leave/admin/time-off` endpoint

### 3. Update Calendar Component ✅
- [ ] Update to fetch leaves from `/api/leave/calendar`
- [ ] Add employee filter for employee view
- [ ] Display leaves as calendar events

### 4. Update EmployeeHub Component ✅
- [ ] Add "Absence" section with buttons
- [ ] Connect buttons to respective endpoints:
  - `/api/leave/employee-hub/annual-leave`
  - `/api/leave/employee-hub/sickness`
  - `/api/leave/employee-hub/lateness`
  - `/api/leave/employee-hub/carry-over`
- [ ] Display recent absences from `/api/leave/employee-hub/absences/:id`

## Rollback Plan (If Needed)

### 1. Restore Database Backup
```bash
mongorestore --uri="mongodb://localhost:27017/hrms" --drop ./backup-YYYYMMDD
```

### 2. Rollback Shift Cancellations
```bash
node scripts/migrateLeaveData.js --rollback
```

### 3. Revert Server.js Changes
```bash
git checkout server.js
```

### 4. Restart Server
```bash
npm start
```

## Monitoring

### 1. Check Server Logs Daily
Look for:
- Absence detection cron job execution
- Any errors in leave approval workflow
- Shift validation errors

### 2. Monitor Database Growth
- LeaveRecords should grow with each approval
- ShiftAssignments cancelled count should increase appropriately

### 3. User Feedback
- Collect feedback from employees on leave request process
- Collect feedback from admins on approval workflow
- Monitor for any confusion about new endpoints

## Performance Optimization

### 1. Add Indexes (Already Done)
All necessary indexes are in place in the models.

### 2. Monitor Query Performance
```javascript
// Enable MongoDB profiling
db.setProfilingLevel(1, { slowms: 100 })

// Check slow queries
db.system.profile.find().sort({ ts: -1 }).limit(10).pretty()
```

### 3. Cache Frequently Accessed Data
Consider caching:
- Leave balances
- Pending requests count
- Calendar leaves for current month

## Security Checklist

- [x] All routes protected with `authenticateSession` middleware
- [x] Admin-only routes check user role
- [x] Employees can only access their own leave data
- [x] Input validation on all endpoints
- [x] No sensitive data in error messages

## Documentation

- [x] `UNIFIED_LEAVE_SYSTEM_GUIDE.md` - Complete system documentation
- [x] `INTEGRATION_INSTRUCTIONS.md` - Frontend integration guide
- [x] `DEPLOYMENT_CHECKLIST.md` - This file
- [x] API endpoints documented
- [x] Migration script documented

## Support

### Common Issues and Solutions

#### Issue: "Cannot find module 'unifiedLeaveRoutes'"
**Solution:** Ensure the file exists at `backend/routes/unifiedLeaveRoutes.js`

#### Issue: Cron job not running
**Solution:** 
1. Check `node-cron` is installed
2. Verify `scheduleAbsenceDetection()` is called in server.js
3. Check server logs for initialization message

#### Issue: Shifts not being cancelled
**Solution:**
1. Verify `ShiftAssignment` model is accessible
2. Check date formats match between LeaveRequest and ShiftAssignment
3. Review `cancelShiftsForLeave` function logs

#### Issue: Leave balance not updating
**Solution:**
1. Verify `AnnualLeaveBalance` records exist for employees
2. Check leave year dates cover the leave period
3. Ensure leave type is not 'Unpaid'

## Success Criteria

✅ All tests in verification section pass
✅ No errors in server logs
✅ Employees can submit leave requests
✅ Admins can approve/reject requests
✅ Shifts are automatically cancelled
✅ Leave balances update correctly
✅ Calendar displays leaves accurately
✅ Absence detection runs daily
✅ No data loss from migration

## Sign-Off

- [ ] Database backup completed
- [ ] Migration script executed successfully
- [ ] Server deployed with new code
- [ ] All verification tests passed
- [ ] Frontend updated and tested
- [ ] Documentation reviewed
- [ ] Team trained on new system
- [ ] Monitoring in place

**Deployed By:** _________________
**Date:** _________________
**Verified By:** _________________
**Date:** _________________

---

## Quick Reference

### New API Endpoints
- `POST /api/leave/request` - Submit leave request
- `GET /api/leave/pending-requests` - Get pending (admin)
- `PATCH /api/leave/approve/:id` - Approve
- `PATCH /api/leave/reject/:id` - Reject
- `POST /api/leave/admin/time-off` - Create time off
- `GET /api/leave/calendar` - Get calendar leaves

### Old Endpoints (Deprecated)
- ~~`POST /api/leave-requests`~~ → Use `/api/leave/request`
- ~~`GET /api/leave-requests/pending`~~ → Use `/api/leave/pending-requests`
- ~~`PATCH /api/leave-requests/:id/approve`~~ → Use `/api/leave/approve/:id`

### Migration Commands
```bash
# Dry run
node scripts/migrateLeaveData.js --dry-run

# Actual migration
node scripts/migrateLeaveData.js

# Rollback
node scripts/migrateLeaveData.js --rollback
```

### Useful Queries
```javascript
// Check migration status
db.leaverequests.find({ status: "Approved" }).count()
db.leaverecords.find({ status: "approved" }).count()

// Check cancelled shifts
db.shiftassignments.find({ status: "Cancelled" }).count()

// Check absence detection
db.leaverecords.find({ type: "absent" }).count()
```
