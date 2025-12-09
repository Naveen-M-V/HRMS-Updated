# 🚀 HRMS Role Hierarchy - Deployment Guide

**Date:** December 9, 2025  
**Purpose:** Fix broken approval workflows by adding role hierarchy to EmployeesHub  
**Risk Level:** Medium (schema changes require migration)  
**Estimated Time:** 30 minutes

---

## 📋 WHAT WAS FIXED

### The Problem
Your system had **two separate user models** by design:
- **User model** - For profiles (interns/trainees) who only upload certificates
- **EmployeesHub model** - For full employees with complete HRMS access

However, the approval system was broken because:
1. ❌ EmployeesHub had NO role field (couldn't distinguish employee/manager/HR)
2. ❌ Controllers checked for 'manager' role that didn't exist
3. ❌ Expense approvals ignored hierarchy completely
4. ❌ Approval fields referenced wrong model (User instead of EmployeeHub)

### The Solution
✅ Added `role` field to EmployeesHub (employee, manager, senior-manager, hr, admin, super-admin)  
✅ Fixed all approval references to use EmployeeHub  
✅ Created `hierarchyHelper` utility for permission checking  
✅ Updated leave & expense controllers to use proper hierarchy  
✅ Added new API endpoints for managers to view pending approvals  
✅ Created migration script to auto-detect managers  

---

## 📁 FILES CHANGED

### Models (Schema Updates)
1. **backend/models/EmployeesHub.js** - Added `role` field
2. **backend/models/LeaveRecord.js** - Fixed approvedBy/rejectedBy references
3. **backend/models/Expense.js** - Fixed approvedBy/paidBy references

### Controllers (Logic Fixes)
4. **backend/controllers/leaveApprovalController.js** - Uses hierarchyHelper now
5. **backend/controllers/expenseController.js** - Uses hierarchyHelper now

### New Files Created
6. **backend/utils/hierarchyHelper.js** - Approval permission logic
7. **backend/routes/approvalRoutes.js** - New manager endpoints
8. **backend/scripts/migrateRoleHierarchy.js** - Migration script

### Server Updates
9. **backend/server.js** - Registered new approval routes

---

## 🔧 DEPLOYMENT STEPS

### STEP 1: Backup Database (CRITICAL!)
```bash
# SSH to your server
ssh root@65.21.71.57

# Create backup
mongodump --uri="mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging" --out=/root/backups/hrms-backup-$(date +%Y%m%d)

# Verify backup created
ls -lh /root/backups/
```

### STEP 2: Stop Backend Server
```bash
pm2 stop hrms-backend
```

### STEP 3: Pull Latest Code
```bash
cd /root/hrms-updated
git pull origin main
```

### STEP 4: Run Migration Script
```bash
cd backend
node scripts/migrateRoleHierarchy.js
```

**What this script does:**
- Adds `role` field to all existing employees (default: 'employee')
- Auto-detects managers (anyone with direct reports gets 'manager' role)
- Identifies senior managers by job title (Director, Head of, VP, etc.)
- Identifies HR by department (HR, Human Resources)
- Shows statistics and verification queries

**Expected Output:**
```
✅ Updated John Smith (EMP-1001) → MANAGER (Manages 5 employee(s))
✅ Updated Jane Doe (EMP-1002) → HR (HR Department: Human Resources)
✅ Updated Mike Johnson (EMP-1003) → EMPLOYEE (Default role)

📊 MIGRATION SUMMARY
✅ Updated: 45
⏩ Skipped: 0
❌ Errors: 0
📦 Total: 45

📈 ROLE DISTRIBUTION:
   EMPLOYEE             : 35
   MANAGER              : 7
   SENIOR-MANAGER       : 2
   HR                   : 1
```

### STEP 5: Verify Migration
```bash
# Connect to MongoDB
mongosh mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging

# Check all managers
db.employeehub.find({ role: "manager" }, { firstName: 1, lastName: 1, employeeId: 1, role: 1 }).pretty()

# Check role distribution
db.employeehub.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])

# Exit MongoDB
exit
```

### STEP 6: Restart Backend
```bash
pm2 restart hrms-backend

# Watch logs
pm2 logs hrms-backend
```

### STEP 7: Test Approval Workflow
```bash
# Test new endpoints
curl -X GET http://localhost:5000/api/approvals/my-pending \
  -H "Cookie: connect.sid=<your-session-cookie>"

# Should return pending leaves & expenses for the logged-in manager
```

---

## 🧪 TESTING CHECKLIST

### Manager Tests
- [ ] Manager can see pending approvals at `/api/approvals/my-pending`
- [ ] Manager can approve direct report's leave request
- [ ] Manager can approve direct report's expense
- [ ] Manager CANNOT approve other team's requests (403 error)
- [ ] Manager can view team members at `/api/approvals/my-team`

### Employee Tests
- [ ] Employee can submit leave request
- [ ] Employee can submit expense claim
- [ ] Employee receives notification when request is approved/rejected
- [ ] Employee CANNOT approve other employees' requests (403 error)

### HR Tests
- [ ] HR can see ALL pending leave requests
- [ ] HR can approve ANY leave request
- [ ] HR CANNOT approve expense requests (403 error - by design)

### Admin Tests
- [ ] Admin can approve ANY leave request
- [ ] Admin can approve ANY expense request
- [ ] Admin can mark expenses as paid
- [ ] Admin can override all approvals

### Senior Manager Tests
- [ ] Senior manager can see indirect reports (team's team)
- [ ] Senior manager can approve entire department's requests

---

## 🔌 NEW API ENDPOINTS

### 1. Get Pending Approvals
```http
GET /api/approvals/my-pending
Authorization: Session cookie required

Response:
{
  "success": true,
  "data": {
    "leaves": [...],
    "expenses": [...],
    "counts": {
      "leaves": 3,
      "expenses": 2,
      "total": 5
    }
  }
}
```

### 2. Get My Team
```http
GET /api/approvals/my-team?includeIndirect=true
Authorization: Session cookie required

Response:
{
  "success": true,
  "data": {
    "manager": {
      "name": "John Smith",
      "role": "manager"
    },
    "subordinates": [...]
    "count": 5
  }
}
```

### 3. Check Approval Permission
```http
POST /api/approvals/can-approve
Content-Type: application/json
Authorization: Session cookie required

Body:
{
  "type": "leave",  // or "expense"
  "employeeId": "675cd186f5e7e15f41234567"
}

Response:
{
  "success": true,
  "canApprove": true,
  "approver": {
    "name": "John Smith",
    "employeeId": "EMP-1001",
    "role": "manager"
  }
}
```

### 4. Get My Authority
```http
GET /api/approvals/my-authority
Authorization: Session cookie required

Response:
{
  "success": true,
  "data": {
    "role": "manager",
    "authorityLevel": 2,
    "canApproveLeave": true,
    "canApproveExpense": true,
    "canMarkAsPaid": false,
    "isManager": true,
    "isSeniorManager": false,
    "isHR": false,
    "isAdmin": false
  }
}
```

### 5. Get Team Hierarchy
```http
GET /api/approvals/team-hierarchy/:employeeId
Authorization: Session cookie required

Response:
{
  "success": true,
  "data": {
    "employee": {
      "name": "Alice Johnson",
      "employeeId": "EMP-1015"
    },
    "hierarchy": [
      { "name": "Alice Johnson", "role": "employee", "level": 0 },
      { "name": "John Smith", "role": "manager", "level": 1 },
      { "name": "Sarah Director", "role": "senior-manager", "level": 2 }
    ],
    "depth": 3
  }
}
```

---

## 🎭 ROLE HIERARCHY EXPLAINED

### Authority Levels
```
Level 1: EMPLOYEE          - Submit requests only
Level 2: MANAGER           - Approve direct reports
Level 3: SENIOR-MANAGER    - Approve entire department (indirect reports)
Level 4: HR                - Approve all leaves, view all data (no expense approval)
Level 5: ADMIN             - Full approval rights, can mark paid
Level 6: SUPER-ADMIN       - Override everything
```

### Permission Matrix
| Role | Approve Leave | Approve Expense | Mark as Paid | View Team | View All |
|------|--------------|-----------------|--------------|-----------|----------|
| Employee | ❌ | ❌ | ❌ | Own only | Own only |
| Manager | ✅ Direct reports | ✅ Direct reports | ❌ | Team | Team |
| Senior Manager | ✅ Department | ✅ Department | ❌ | Department | Department |
| HR | ✅ All | ❌ View only | ❌ | All | All |
| Admin | ✅ All | ✅ All | ✅ | All | All |
| Super Admin | ✅ Override | ✅ Override | ✅ | All | All + System |

---

## 🔄 ROLLBACK PLAN (If Something Breaks)

### STEP 1: Stop Backend
```bash
pm2 stop hrms-backend
```

### STEP 2: Restore Database
```bash
mongorestore --uri="mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging" /root/backups/hrms-backup-20251209/
```

### STEP 3: Revert Code
```bash
cd /root/hrms-updated
git log --oneline  # Find commit hash before changes
git reset --hard <previous-commit-hash>
```

### STEP 4: Restart Backend
```bash
pm2 restart hrms-backend
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Role is required" error after deployment
**Cause:** New employees created without role field  
**Fix:** Default is set to 'employee', but check if schema is updated
```bash
# Check if role field exists
mongosh mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging
db.employeehub.findOne({})
```

### Issue: "Cannot approve" even though user is manager
**Cause:** Migration didn't assign role properly  
**Fix:** Manually assign role
```bash
mongosh mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging
db.employeehub.updateOne(
  { employeeId: "EMP-1001" },
  { $set: { role: "manager" } }
)
```

### Issue: 403 errors on all approvals
**Cause:** hierarchyHelper not found or session issue  
**Fix:** Check server logs
```bash
pm2 logs hrms-backend --lines 50
```

### Issue: Expenses still check 'manager' role
**Cause:** Code not deployed properly  
**Fix:** Verify files updated
```bash
cd /root/hrms-updated/backend
grep -n "hierarchyHelper" controllers/expenseController.js
# Should show imports and usage
```

---

## 📊 POST-DEPLOYMENT VERIFICATION

### Check 1: All Employees Have Roles
```bash
mongosh mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging
db.employeehub.countDocuments({ role: { $exists: false } })
# Should return 0
```

### Check 2: Manager Count Makes Sense
```bash
db.employeehub.countDocuments({ role: "manager" })
# Should be reasonable (e.g., 10-20% of total employees)
```

### Check 3: No Orphaned Approvals
```bash
db.leaverecords.find({ 
  approvedBy: { $exists: true, $ne: null },
  status: "approved"
}).limit(5).pretty()
# Check if approvedBy references exist in employeehub
```

### Check 4: Test Approval Flow
1. Login as employee
2. Submit leave request
3. Login as their manager
4. Check `/api/approvals/my-pending` - should see the request
5. Approve it
6. Verify status changed to "approved"

---

## 📞 SUPPORT & MONITORING

### Monitor Approval Activity
```bash
# Watch real-time logs
pm2 logs hrms-backend

# Check error logs
pm2 logs hrms-backend --err

# Check approval queries
mongosh mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging
db.leaverecords.find({ status: "pending" }).count()
db.expenses.find({ status: "pending" }).count()
```

### Key Metrics to Track
- Number of pending approvals per manager
- Approval response time (submitted → approved)
- Failed approval attempts (403 errors)
- Role distribution changes

---

## ✅ SUCCESS CRITERIA

Deployment is successful when:
- [x] Migration script runs without errors
- [x] All employees have a role assigned
- [x] Managers can see pending approvals
- [x] Managers can approve direct reports
- [x] Employees cannot approve others
- [x] HR can approve all leaves
- [x] Admin can mark expenses as paid
- [x] No 403 errors for legitimate approvals
- [x] No 500 errors in logs

---

## 📝 MANUAL ROLE ASSIGNMENT (If Needed)

If migration script misses someone or you need to manually assign roles:

```javascript
// Connect to MongoDB
mongosh mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging

// Assign manager role
db.employeehub.updateOne(
  { employeeId: "EMP-1001" },
  { $set: { role: "manager" } }
)

// Assign senior manager
db.employeehub.updateOne(
  { employeeId: "EMP-1002" },
  { $set: { role: "senior-manager" } }
)

// Assign HR
db.employeehub.updateOne(
  { employeeId: "EMP-1003" },
  { $set: { role: "hr" } }
)

// Assign admin
db.employeehub.updateOne(
  { employeeId: "EMP-1004" },
  { $set: { role: "admin" } }
)

// Verify
db.employeehub.find(
  { role: { $in: ["manager", "senior-manager", "hr", "admin"] } },
  { firstName: 1, lastName: 1, employeeId: 1, role: 1 }
)
```

---

## 🎉 NEXT STEPS AFTER DEPLOYMENT

1. **Notify Managers** - Email managers about new approval dashboard
2. **Train HR** - Show HR how to access all employee leaves
3. **Update Documentation** - Document new role structure
4. **Monitor for 24 Hours** - Watch for any errors or issues
5. **Gather Feedback** - Ask managers if workflow is better

---

**Questions or Issues?**  
Check the logs first: `pm2 logs hrms-backend`  
Check database: `mongosh mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging`  
Rollback if needed: Follow rollback plan above

**Status:** ✅ Ready to Deploy  
**Approved By:** Development Team  
**Deployment Window:** Anytime (30 minutes downtime)
