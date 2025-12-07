# Quick Reference Guide - New Features

## Admin Dashboard - Attendance Calendar

**Access:** Admin Dashboard → Attendance Calendar tab

**Features:**
- View all employee clock-in/out data in monthly calendar
- Color indicators:
  - 🟢 Green = On time
  - 🔴 Red = Late arrival
  - 🔵 Blue = Overtime worked
  - 🟡 Yellow = Currently on break
- Filter by specific employee or view all
- Click any day to see detailed attendance records
- Navigate between months with Previous/Next buttons

**Usage:**
1. Log in as admin
2. Navigate to Admin Dashboard
3. Click "Attendance Calendar" tab
4. Select month and employee filter
5. Click on any day with entries to view details

---

## Annual Leave Balance Editing

**Access:** Annual Leave Balance page → Actions column (admin only)

**Features:**
- Edit employee annual leave entitlement
- Add carry-over days from previous year
- Provide reason for adjustment (audit trail)
- Changes saved to database with admin ID and timestamp

**Usage:**
1. Navigate to Annual Leave Balance page
2. Find employee in the list
3. Click Edit icon (pencil) in Actions column
4. Enter new entitlement days
5. Enter carry-over days (if applicable)
6. Enter reason for adjustment (required)
7. Click "Save Changes"

**Notes:**
- Only admins can edit leave balances
- All changes are logged in adjustments array
- System calculates remaining days automatically

---

## Expense Approval Workflow

**Access:** View Expense page (click on any expense)

**Complete Workflow:**
1. **Pending** → Employee submits expense claim
2. **Approved** → Admin/Manager approves (or Declines)
3. **Paid** → Finance marks as paid
4. **Revert to Pending** → Admin can reset to pending if needed

**Actions Available:**
- **Approve** - Approve the expense claim
- **Decline** - Reject with reason
- **Mark as Paid** - Confirm payment made
- **Revert to Pending** - Reset back to pending status

**Usage:**
1. Navigate to Expenses or Approvals
2. Click on expense to view details
3. Review expense information
4. Click appropriate action button
5. Provide reason if declining
6. Confirm action

---

## Organizational Chart Persistence

**Access:** Organizational Chart page

**Features:**
- Drag-and-drop to reorganize
- Manager relationships saved to database
- Visual and data persistence
- Changes reflect across entire system

**Usage:**
1. Navigate to Organizational Chart
2. Drag employees to reorganize structure
3. Drop under new manager to change reporting line
4. Click "Save" button
5. Confirmation message appears
6. Manager relationships updated in database

**Notes:**
- Changes are saved to both localStorage (visual) and database (data)
- Manager relationships used in reports and approvals
- Only admins can modify organizational chart

---

## Employee ID System

**Format:** EMP-XXXX (e.g., EMP-1001, EMP-1002)

**Features:**
- Auto-generated on employee creation
- Sequential numbering
- Always 4 digits (padded with zeros)
- Unique across all employees

**Where Displayed:**
- Employee lists and directories
- Reports (CSV, PDF exports)
- Time entry records
- Leave records
- Expense claims
- Organizational chart

**Note:** MongoDB _id is never shown to users, always use employeeId

---

## VTID System (Profiles)

**Format:** VT1234 (e.g., VT1001, VT2345)

**Features:**
- Auto-generated on profile creation
- Random 4-digit number
- Unique across all profiles
- For interns, trainees, contract workers

**Where Displayed:**
- Profile lists
- Certificate management
- Notifications
- Profile-specific views

**Differentiation:**
- **Employees** = EMP-XXXX (EmployeesHub)
- **Profiles** = VT1234 (User collection)

---

## Role-Based Access

### Super-admin
- All system access
- Manage users and admins
- System settings
- Override all workflows

### Admin
- Employee management
- Approve requests
- Generate reports
- Edit leave balances
- View attendance calendar
- Manage certificates

### User (Employee)
- Clock in/out
- Submit leave requests
- Submit expense claims
- View own data
- View assigned shifts

### User (Profile)
- Certificate management only
- No time tracking
- No leave/expense features

---

## Quick Actions

### For Admins

**View Attendance:**
Admin Dashboard → Attendance Calendar → Select month/employee

**Edit Leave Balance:**
Annual Leave Balance → Find employee → Click Edit icon → Update → Save

**Approve Expense:**
Expenses/Approvals → Click expense → Review → Approve/Decline

**Update Org Chart:**
Organizational Chart → Drag-and-drop → Save

**Generate Reports:**
Reports page → Select report type → Set date range → Export

---

## Keyboard Shortcuts

Currently no keyboard shortcuts implemented.
Consider adding in future update for power users.

---

## Mobile Access

All new features are responsive and work on mobile devices:
- Attendance calendar adjusts to smaller screens
- Edit modals are mobile-friendly
- Touch-friendly buttons and controls
- Scrollable tables on mobile

---

## Troubleshooting

**Attendance calendar not loading:**
- Check if you're logged in as admin
- Verify backend is running (pm2 status)
- Check browser console for errors

**Can't edit leave balance:**
- Verify you have admin role
- Check if Actions column is visible
- Ensure backend endpoint is accessible

**Expense approval not working:**
- Verify your role permissions
- Check expense status (can't approve already paid)
- Ensure backend is restarted after updates

**Employee ID not showing:**
- Run migration script: `node scripts/assignEmployeeIds.js`
- Verify EmployeesHub model has pre-save hook
- Check if employeeId field exists in database

---

## API Endpoints Reference

### New Endpoints Added:

**Organizational Chart:**
- `POST /api/employees/org-chart/save` - Save manager relationships

**Expenses:**
- `POST /api/expenses/:id/revert` - Revert expense to pending

**Leave Balance:**
- `PUT /api/leave/admin/balance/:userId` - Update employee leave balance

**Time Entries:**
- `GET /api/clock/time-entries` - Get all time entries (admin)
- `GET /api/clock/time-entries/:employeeId` - Get entries for specific employee

---

## Data Backup Recommendations

Before making significant changes:

1. **Backup MongoDB:**
   ```bash
   mongodump --uri="mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging" --out=backup-$(date +%Y%m%d)
   ```

2. **Backup Code:**
   ```bash
   git add .
   git commit -m "Backup before changes"
   git push
   ```

3. **Test in Development:**
   - Test all new features locally first
   - Verify data integrity
   - Check for errors in logs

---

## Performance Notes

**Attendance Calendar:**
- Loads one month of data at a time
- Employee filter reduces data load
- Responsive even with many employees

**Leave Balance:**
- Instant updates with database persistence
- Audit trail stored in adjustments array
- No performance impact on large datasets

**Organizational Chart:**
- Saves only relationships (not entire tree)
- Efficient bulk update with Promise.all
- Fast load and save operations

---

## Security Considerations

- All admin endpoints validate role before execution
- VTID and employeeId are non-sensitive identifiers
- MongoDB _id never exposed to clients
- Audit trail records admin actions
- Role-based access strictly enforced

---

## Future Enhancements

Potential features to consider:

1. **Attendance Calendar:**
   - Export to CSV/PDF
   - Department-wise summary
   - Absence pattern detection

2. **Leave Balance:**
   - Bulk update for multiple employees
   - Import from CSV
   - Year-end rollover automation

3. **Expense Workflow:**
   - Multi-level approval chains
   - Budget tracking
   - Recurring expense templates

4. **Reports:**
   - Scheduled email reports
   - Custom report builder
   - Dashboard widgets

---

**Last Updated:** December 8, 2025
**Version:** 1.0
