# HRMS Role Hierarchy Fix - Summary

## ✅ What Was Done

### Understanding Your Design
Your system has **TWO user types by design** (this is good!):
1. **Profiles (User model)** - Interns/trainees who only upload certificates
2. **Employees (EmployeesHub)** - Full-time staff with complete HRMS access (clock-in, rota, shifts, documents, leave, payroll, expenses)

### The Problem
The approval system was broken because EmployeesHub had NO role field to distinguish between:
- Regular employees
- Managers (who can approve)
- Senior managers
- HR personnel
- Admins

### The Solution
Added proper role hierarchy to EmployeesHub while keeping User model separate for profiles.

---

## 📝 Changes Made

### 1. Schema Updates
- ✅ Added `role` field to EmployeesHub (6 levels: employee, manager, senior-manager, hr, admin, super-admin)
- ✅ Fixed LeaveRecord approvedBy/rejectedBy to reference EmployeeHub (not User)
- ✅ Fixed Expense approvedBy/paidBy to reference EmployeeHub (not User)

### 2. Business Logic Fixes
- ✅ Created `hierarchyHelper.js` with smart approval permission checks
- ✅ Updated leave approval controller to use hierarchy
- ✅ Updated expense controller to check manager relationships
- ✅ Removed hardcoded 'manager' role checks that didn't exist

### 3. New Features
- ✅ `/api/approvals/my-pending` - Manager sees pending approvals
- ✅ `/api/approvals/my-team` - Manager sees subordinates
- ✅ `/api/approvals/can-approve` - Check if user can approve request
- ✅ `/api/approvals/my-authority` - Get user's permission level
- ✅ `/api/approvals/team-hierarchy/:id` - View reporting chain

### 4. Migration Script
- ✅ Auto-detects managers (anyone with direct reports)
- ✅ Identifies HR by department
- ✅ Identifies senior managers by title
- ✅ Assigns default 'employee' role to others

---

## 🎯 Role Hierarchy

```
SUPER-ADMIN (Level 6) - Full system access + override
    ↓
ADMIN (Level 5) - Full approval rights + mark as paid
    ↓
HR (Level 4) - Approve all leaves + view all data
    ↓
SENIOR-MANAGER (Level 3) - Approve entire department
    ↓
MANAGER (Level 2) - Approve direct reports
    ↓
EMPLOYEE (Level 1) - Submit requests only
```

### Permission Matrix
- **Employee**: Submit requests, view own data
- **Manager**: Approve direct reports' leave & expenses
- **Senior Manager**: Approve entire department (indirect reports too)
- **HR**: Approve ALL leaves, view all data (but cannot approve expenses)
- **Admin**: Full approval rights, mark expenses as paid
- **Super Admin**: Override everything

---

## 🚀 How to Deploy

### Quick Steps
```bash
# 1. Backup database
mongodump --uri="mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging" --out=/root/backups/hrms-$(date +%Y%m%d)

# 2. Stop backend
pm2 stop hrms-backend

# 3. Pull code (already in your local folder, you'll need to push first)
cd /root/hrms-updated
git pull origin main

# 4. Run migration
cd backend
node scripts/migrateRoleHierarchy.js

# 5. Restart
pm2 restart hrms-backend
```

### What the Migration Does
- Scans all employees in database
- Adds `role` field (default: 'employee')
- If employee has direct reports → role = 'manager'
- If job title contains "Director", "VP", "Head of" → role = 'senior-manager'
- If department is HR → role = 'hr'
- Shows summary with role distribution

---

## 🧪 Testing

### Test 1: Manager Approves Direct Report
1. Login as employee
2. Submit leave request
3. Login as their manager
4. Go to `/api/approvals/my-pending`
5. Should see the request
6. Approve it ✅

### Test 2: Manager Cannot Approve Other Team
1. Login as manager A
2. Try to approve employee from manager B's team
3. Should get 403 Forbidden ✅

### Test 3: HR Approves Any Leave
1. Login as HR user
2. Go to `/api/approvals/my-pending`
3. Should see ALL pending leaves
4. Can approve any of them ✅

### Test 4: HR Cannot Approve Expenses
1. Login as HR user
2. Try to approve expense
3. Should get 403 Forbidden ✅

---

## 📁 Files Changed

### Modified Files
1. `backend/models/EmployeesHub.js` - Added role field
2. `backend/models/LeaveRecord.js` - Fixed references
3. `backend/models/Expense.js` - Fixed references
4. `backend/controllers/leaveApprovalController.js` - Uses hierarchy
5. `backend/controllers/expenseController.js` - Uses hierarchy
6. `backend/server.js` - Registered new routes

### New Files Created
7. `backend/utils/hierarchyHelper.js` - Permission logic
8. `backend/routes/approvalRoutes.js` - New endpoints
9. `backend/scripts/migrateRoleHierarchy.js` - Migration
10. `DEPLOYMENT_GUIDE.md` - Full deployment instructions
11. `HIERARCHY_ARCHITECTURE_ANALYSIS.md` - Detailed analysis

---

## 🔧 Manual Role Assignment (If Needed)

If migration misses someone:

```javascript
mongosh mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging

// Make someone a manager
db.employeehub.updateOne(
  { employeeId: "EMP-1001" },
  { $set: { role: "manager" } }
)

// Make someone HR
db.employeehub.updateOne(
  { employeeId: "EMP-1002" },
  { $set: { role: "hr" } }
)

// Make someone admin
db.employeehub.updateOne(
  { employeeId: "EMP-1003" },
  { $set: { role: "admin" } }
)
```

---

## 🎨 Frontend Integration (Future)

You can now use these endpoints in your frontend:

```javascript
// Check if current user can approve
const response = await fetch('/api/approvals/can-approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'leave',  // or 'expense'
    employeeId: '675cd186f5e7e15f41234567'
  })
});
const { canApprove } = await response.json();

// Show/hide approve button based on permission
if (canApprove) {
  // Show approve button
}

// Get pending approvals for manager dashboard
const pending = await fetch('/api/approvals/my-pending');
const { leaves, expenses } = await pending.json();
```

---

## 🔄 Rollback Plan

If something breaks:
```bash
# Stop backend
pm2 stop hrms-backend

# Restore database
mongorestore --uri="mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging" /root/backups/hrms-20251209/

# Revert code
git reset --hard <previous-commit>

# Restart
pm2 restart hrms-backend
```

---

## ✅ Success Metrics

Deployment successful when:
- ✅ All employees have a role assigned
- ✅ Managers can see their team's pending approvals
- ✅ Managers can approve direct reports only
- ✅ HR can approve all leaves
- ✅ Employees cannot approve others (403 error)
- ✅ No 500 errors in logs

---

## 📊 Expected Results

### Before Fix
- ❌ Only admins could approve anything
- ❌ Managers had no way to approve their team
- ❌ Expense approval completely broken
- ❌ Hierarchy ignored

### After Fix
- ✅ Managers approve direct reports
- ✅ Senior managers approve entire department
- ✅ HR approves all leaves (but not expenses)
- ✅ Admins can mark expenses as paid
- ✅ Proper hierarchy chain enforced
- ✅ Super admin override without breaking flow

---

## 📞 Support

**Check logs:**
```bash
pm2 logs hrms-backend
```

**Check database:**
```bash
mongosh mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging
db.employeehub.find({ role: "manager" })
```

**Verify role distribution:**
```bash
db.employeehub.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])
```

---

## 🎯 Key Takeaways

1. **Two models is good** - Profiles and Employees serve different purposes
2. **Role field is critical** - Enables proper authorization
3. **Hierarchy checking** - Managers can only approve their team
4. **HR special case** - Can view/approve leaves but not expenses
5. **Migration is automatic** - Detects managers based on direct reports

---

**Status:** ✅ Ready to Deploy  
**Risk:** Medium (requires migration, but has rollback)  
**Time:** 30 minutes  
**Next Step:** Run deployment guide
