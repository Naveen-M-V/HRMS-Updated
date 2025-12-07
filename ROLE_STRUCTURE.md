# HRMS Role Structure Documentation

## Overview
This document defines the official role structure for the HRMS system, clarifying the differences between user roles and their permissions.

## User Roles

### 1. Super-admin
**Database Value:** `super-admin`

**Permissions:**
- Full system access
- Can manage all users (create, edit, delete)
- Can access all admin functions
- Can manage system settings and configurations
- Can access all reports and analytics
- Can override all approval workflows
- Can manage organizational structure
- Can view and edit all employee data
- Can manage all certificates and compliance

**Use Cases:**
- System owner
- IT administrator
- Top-level management

### 2. Admin
**Database Value:** `admin`

**Permissions:**
- Can manage employees (add, edit, view)
- Can approve/decline leave requests
- Can approve/decline expense claims
- Can view all time entries and attendance
- Can generate reports
- Can manage annual leave balances
- Can view organizational chart
- Can manage rotas and shifts
- Can view compliance dashboard
- Can manage certificates (approve/decline)
- Can access admin dashboard with attendance calendar

**Restrictions:**
- Cannot delete users
- Cannot modify system settings
- Cannot access super-admin functions
- Cannot override certain approval workflows

**Use Cases:**
- HR managers
- Department heads
- Office managers
- Team leads with administrative duties

### 3. User
**Database Value:** `user`

**Permissions:**
- Can clock in/out
- Can view own time entries
- Can submit leave requests
- Can submit expense claims
- Can view own profile
- Can view own certificates
- Can view assigned shifts
- Can view team members (if applicable)
- Can receive notifications

**Restrictions:**
- Cannot access admin functions
- Cannot approve/decline requests
- Cannot view other employees' data
- Cannot generate reports
- Cannot manage organizational structure

**Use Cases:**
- Regular employees
- Standard staff members

## User Types Within "User" Role

Users can be further categorized by their employment type:

### Employee (EmployeeHub)
- Full-time or part-time employees
- Have `employeeId` (format: EMP-XXXX)
- Stored in `EmployeesHub` collection
- Can be assigned to shifts, departments, teams
- Have manager relationships in organizational chart

### Certificate Profile
- Interns, trainees, contract workers
- Have `VTID` (format: VT1234)
- Stored in `User` collection with profile flag
- Have profile-specific fields: `profileType`, `startDate`, `endDate`
- Can have certificates assigned
- Limited to certificate management features

## ID System

### Employee ID (employeeId)
- **Format:** `EMP-XXXX` (e.g., EMP-1001, EMP-1002)
- **Used By:** Employees in EmployeesHub collection
- **Auto-generated:** Yes, on employee creation
- **Purpose:** Unique identifier for full employees
- **Visible In:** Reports, exports, employee lists, organizational chart

### VTID (Verification Trainee ID)
- **Format:** `VT1234` (e.g., VT1001, VT2345)
- **Used By:** Certificate profiles (interns, trainees, contractors)
- **Auto-generated:** Yes, on profile creation
- **Purpose:** Unique identifier for profile-based users
- **Visible In:** Certificate management, profile views, notifications

### User ID (_id)
- **Format:** MongoDB ObjectId (24 hex characters)
- **Used By:** All users in User collection (for authentication)
- **Auto-generated:** Yes, by MongoDB
- **Purpose:** Database primary key, authentication reference
- **Visible In:** Internal system references, API calls (not shown to users)

## Role Hierarchy

```
Super-admin
    ↓
Admin (Manager/HR)
    ↓
User (Employee/Profile)
```

## Permission Matrix

| Feature | Super-admin | Admin | User |
|---------|-------------|-------|------|
| System Settings | ✅ | ❌ | ❌ |
| Manage All Users | ✅ | ❌ | ❌ |
| Add/Edit Employees | ✅ | ✅ | ❌ |
| Delete Users | ✅ | ❌ | ❌ |
| View All Employees | ✅ | ✅ | Limited |
| Approve Leave | ✅ | ✅ | ❌ |
| Approve Expenses | ✅ | ✅ | ❌ |
| Submit Leave | ✅ | ✅ | ✅ |
| Submit Expenses | ✅ | ✅ | ✅ |
| Clock In/Out | ✅ | ✅ | ✅ |
| View Own Time Entries | ✅ | ✅ | ✅ |
| View All Time Entries | ✅ | ✅ | ❌ |
| Generate Reports | ✅ | ✅ | ❌ |
| Manage Rotas | ✅ | ✅ | ❌ |
| Edit Leave Balances | ✅ | ✅ | ❌ |
| Org Chart Edit | ✅ | ✅ | View Only |
| Attendance Calendar | ✅ | ✅ | Own Only |
| Compliance Dashboard | ✅ | ✅ | ❌ |
| Certificate Approval | ✅ | ✅ | ❌ |
| Certificate Upload | ✅ | ✅ | ✅ |

## Implementation Notes

### Backend Role Checks
```javascript
// Check for admin or super-admin
if (user.role !== 'admin' && user.role !== 'super-admin') {
  return res.status(403).json({ message: 'Admin access required' });
}

// Check for super-admin only
if (user.role !== 'super-admin') {
  return res.status(403).json({ message: 'Super-admin access required' });
}

// Check for any authenticated user
if (!user) {
  return res.status(401).json({ message: 'Authentication required' });
}
```

### Frontend Role Checks
```javascript
// Show admin features
{(userRole === 'admin' || userRole === 'super-admin') && (
  <AdminFeatureComponent />
)}

// Show super-admin features only
{userRole === 'super-admin' && (
  <SuperAdminFeatureComponent />
)}
```

### Consistent Terminology
- Use `role` field in User model (values: 'super-admin', 'admin', 'user')
- Use `employeeId` for employees (not 'id', '_id', or 'userId')
- Use `VTID` for certificate profiles (not 'profileId' or 'userId')
- Use `_id` only for internal database references

## Migration Considerations

If role definitions need to change:

1. Update User model schema
2. Update all role check middleware
3. Update frontend role checks
4. Create migration script to update existing users
5. Update this documentation
6. Test all permission-based features

## Related Files

- **Backend:**
  - `backend/models/User.js` - User model with role field
  - `backend/models/EmployeesHub.js` - Employee model with employeeId
  - `backend/routes/auth.js` - Authentication and role verification
  - All controller files with role-based access control

- **Frontend:**
  - `frontend/src/context/AuthContext.js` - User context and role state
  - All admin-specific pages and components
  - Components with conditional rendering based on role

## Frequently Asked Questions

**Q: Can a user have multiple roles?**
A: No, each user has exactly one role. Use the highest applicable role.

**Q: Can an admin approve their own requests?**
A: No, approval workflows should check that approver is different from requester.

**Q: What's the difference between Employee and Profile?**
A: Employees are full-time/part-time staff with employeeId. Profiles are temporary workers (interns, trainees) with VTID, primarily for certificate management.

**Q: Can profiles clock in/out?**
A: Profiles are not intended for time tracking. They should not have time entry records.

**Q: How do I promote a user to admin?**
A: Update the user's `role` field in the database to 'admin'. Only super-admins should be able to do this.

## Last Updated
December 8, 2025
