# Database Health Check

This script provides a comprehensive health check for the HRMS database.

## Usage

### Windows
```bash
check-database.bat
```

### Linux/Mac
```bash
chmod +x check-database.sh
./check-database.sh
```

### Direct Node
```bash
cd backend
node scripts/checkDatabase.js
```

## What It Checks

1. **Database Connection**
   - Connection status
   - Database name
   - Connection state

2. **Collections Overview**
   - Lists all collections
   - Document count per collection

3. **User Accounts (Profiles)**
   - Total users
   - Active users
   - Email verified users
   - Pending approval users
   - Recent users list

4. **Employees (EmployeeHub)**
   - Total employees
   - Active employees
   - Admin vs regular employees
   - Terminated employees
   - Recent employees list

5. **Profiles**
   - Total profiles
   - Active profiles

6. **Certificates**
   - Total certificates
   - Active certificates
   - Certificates expiring within 30 days
   - Expired certificates

7. **Notifications**
   - Total notifications
   - Unread notifications

8. **Data Integrity**
   - Users without linked profiles
   - Duplicate emails in Users collection
   - Duplicate emails in Employees collection
   - Orphaned certificates

9. **Summary**
   - Overall health status
   - Quick statistics

## Output Example

```
============================================================
     HRMS DATABASE HEALTH CHECK
============================================================

1. DATABASE CONNECTION
  Connecting to MongoDB...
  URI: mongodb://****:****@localhost:27017/hrms
✓ Connected to MongoDB successfully
  Database Name: hrms
  Connection State: Connected

2. COLLECTIONS OVERVIEW
  Total Collections: 15
    users: 10 documents
    employeeshubs: 25 documents
    certificates: 150 documents
    ...

3. USER ACCOUNTS (Profiles)
  Total Users: 10
  Active Users: 8
  Email Verified: 7
  Pending Approval: 1

  Recent Users:
    ✓ user@example.com - John Doe (VT1234) - Verified: ✓
    ...

4. EMPLOYEES (EmployeeHub)
  Total Employees: 25
  Active Employees: 23
  Admins: 2
  Regular Employees: 21
  Terminated: 2

  Recent Employees:
    ✓ admin@company.com - Admin User (admin) - IT
    ...

...

9. SUMMARY
✓ Database connection: OK
✓ Collections: 15
✓ Total accounts: 35
✓ Active accounts: 31
⚠ Some certificates need attention

============================================================
✓ Database check completed successfully!
============================================================
```

## Exit Codes

- `0`: Success
- `1`: Error occurred

## Environment Variables

The script uses the same environment configuration as the main application:
- `NODE_ENV`: Development or production mode
- `MONGODB_URI`: Database connection string

## Troubleshooting

### Connection Error
If you get a connection error, check:
1. MongoDB is running
2. `.env` file has correct `MONGODB_URI`
3. Network connectivity to database server

### Model Not Found
Some models (like Profile) are defined in server.js. The script will handle this gracefully and use raw collection queries when needed.

### Permission Denied
On Linux/Mac, you may need to make the script executable:
```bash
chmod +x check-database.sh
```

## Integration with CI/CD

You can integrate this script into your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Check Database Health
  run: |
    cd backend
    node scripts/checkDatabase.js
```

## Scheduled Checks

Consider running this script periodically:

### Linux Cron
```bash
# Run every day at 2 AM
0 2 * * * cd /path/to/hrms/backend && node scripts/checkDatabase.js >> /var/log/hrms-db-check.log 2>&1
```

### Windows Task Scheduler
Create a scheduled task to run `check-database.bat` daily.
