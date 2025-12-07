# Report Library - Deployment Guide

## Quick Start

### 1. Backend Deployment

```bash
# SSH into server
ssh pentest@65.21.71.57

# Navigate to app directory
cd ~/apps/hrms

# Pull latest code
git pull origin main

# Install any new dependencies (if needed)
cd backend
npm install

# Restart backend with PM2
pm2 restart hrms-backend

# Check logs
pm2 logs hrms-backend --lines 50
```

### 2. Frontend Deployment

```bash
# On local machine, navigate to frontend directory
cd E:\Websites\HRMSLogin\hrms-updated\frontend

# Build production bundle
npm run build

# Copy build to server
# (On server, in ~/apps/hrms/frontend directory)
# Then copy to nginx container
sudo docker cp build/. ctfd-nginx-1:/usr/share/nginx/html/

# Verify deployment
# Visit: http://65.21.71.57
# Check browser console for errors
# Test Report Library: Login → Click "Report Library" in sidebar
```

## Testing Checklist

### Backend API Tests
```bash
# Test report types endpoint
curl -X GET http://localhost:5004/api/report-library/types \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test absence report
curl -X POST http://localhost:5004/api/report-library/absence \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }'

# Test employee details report
curl -X POST http://localhost:5004/api/report-library/employee-details \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Frontend Tests
1. ✅ Login as admin user
2. ✅ Click "Report Library" in sidebar
3. ✅ Verify all 14 report cards display
4. ✅ Test search functionality (type "absence")
5. ✅ Test category filter (select "Leave")
6. ✅ Click a report card
7. ✅ Verify modal opens with date pickers
8. ✅ Select date range
9. ✅ Select employees (or leave empty for all)
10. ✅ Click "Generate Report"
11. ✅ Verify JSON results display
12. ✅ Click "Export JSON"
13. ✅ Verify file downloads

## New Files Created

### Backend:
- `backend/models/Expense.js` (NEW)
- `backend/models/PayrollException.js` (NEW)
- `backend/models/LatenessRecord.js` (NEW)
- `backend/routes/reportLibraryRoutes.js` (NEW)
- `backend/controllers/reportLibraryController.js` (NEW)

### Frontend:
- `frontend/src/pages/ReportLibrary.js` (NEW)
- `frontend/src/components/Reports/ReportCard.js` (NEW)
- `frontend/src/components/Reports/ReportGenerationPanel.js` (NEW)

### Modified Files:
- `backend/server.js` - Added report library routes
- `frontend/src/App.js` - Added ReportLibrary import and route
- `frontend/src/components/ModernSidebar.js` - Added Report Library menu item

## Git Commands

```bash
# Add all new files
git add backend/models/Expense.js
git add backend/models/PayrollException.js
git add backend/models/LatenessRecord.js
git add backend/routes/reportLibraryRoutes.js
git add backend/controllers/reportLibraryController.js
git add frontend/src/pages/ReportLibrary.js
git add frontend/src/components/Reports/

# Add modified files
git add backend/server.js
git add frontend/src/App.js
git add frontend/src/components/ModernSidebar.js

# Add documentation
git add REPORT_LIBRARY_PHASE1_COMPLETE.md
git add REPORT_LIBRARY_DEPLOYMENT.md

# Commit
git commit -m "feat: Implement Report Library Phase 1 - Complete backend API and frontend UI for 14 report types"

# Push
git push origin main
```

## Rollback Plan

If issues occur:

```bash
# On server
cd ~/apps/hrms
git log --oneline  # Find previous commit hash
git checkout <previous-commit-hash>
pm2 restart hrms-backend

# Frontend rollback
# Restore previous build from backup or rebuild from previous commit
```

## Database Migrations Required

⚠️ **IMPORTANT**: New models won't have data yet!

### Create Sample Data:

```javascript
// Connect to MongoDB
mongosh "mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging"

// Verify new collections exist (they'll be auto-created on first insert)
show collections
// Should see: expenses, payrollexceptions, latenessrecords

// Example: Create test expense
db.expenses.insertOne({
  employee: ObjectId("..."), // Use actual employee ID
  date: new Date("2024-01-15"),
  amount: 50.00,
  currency: "GBP",
  category: "Travel",
  description: "Taxi to client meeting",
  status: "pending",
  createdAt: new Date(),
  updatedAt: new Date()
});

// Example: Create test lateness record
db.latenessrecords.insertOne({
  employee: ObjectId("..."), // Use actual employee ID
  date: new Date("2024-01-15"),
  scheduledStart: new Date("2024-01-15T09:00:00Z"),
  actualStart: new Date("2024-01-15T09:15:00Z"),
  minutesLate: 15,
  excused: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Example: Create test payroll exception
db.payrollexceptions.insertOne({
  employee: ObjectId("..."), // Use actual employee ID
  payPeriodStart: new Date("2024-01-01"),
  payPeriodEnd: new Date("2024-01-31"),
  exceptionType: "missing_timesheet",
  description: "Timesheet not submitted for week ending 15/01",
  severity: "high",
  resolved: false,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## Monitoring

### Check PM2 Status:
```bash
pm2 status
pm2 logs hrms-backend --lines 100
```

### Check nginx Logs:
```bash
sudo docker logs ctfd-nginx-1 --tail 100
```

### Check MongoDB:
```bash
mongosh "mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging"
db.expenses.countDocuments()
db.latenessrecords.countDocuments()
db.payrollexceptions.countDocuments()
```

## Troubleshooting

### Issue: "Cannot GET /api/report-library/types"
**Solution**: PM2 restart didn't pick up new routes
```bash
pm2 stop hrms-backend
pm2 start hrms-backend
```

### Issue: Frontend shows blank page
**Solution**: Check browser console, likely import error
```bash
cd frontend
npm start  # Test locally first
# Fix any import errors, then rebuild
```

### Issue: Report returns empty array
**Solution**: No data in database for that report
- Create sample data using MongoDB shell
- Or test with reports that use existing models (Employee Details, Annual Leave, Absence)

### Issue: CORS errors
**Solution**: Check backend CORS configuration
```javascript
// In backend/server.js, verify:
const allowedOrigins = isDevelopment
  ? [...baseOrigins, 'http://localhost:3001']
  : baseOrigins;
```

### Issue: Authentication fails
**Solution**: Token not being sent
- Check localStorage has 'auth_token'
- Verify axios interceptor is adding Authorization header
- Check backend authenticateSession middleware logs

## Performance Notes

- Reports with large datasets may take 5-10 seconds
- Consider implementing caching for frequently run reports
- MongoDB indexes exist on key fields (employee, date)
- Aggregation pipelines optimized with $match before $lookup

## Security Notes

- All routes require authentication (JWT token)
- No sensitive data in error responses
- Employee filtering prevents data leakage
- Consider adding role-based access control in Phase 2

## Next Steps After Deployment

1. Create sample data for new models
2. Test all 14 report types
3. Implement CSV export (install `json2csv`)
4. Implement PDF export (install `pdfkit`)
5. Add missing fields to EmployeesHub (startDate, furloughStatus)
6. Create automated lateness detection cron job
7. Add report history/persistence

---

**Deployment Date**: 2024-01-15
**Deployed By**: Development Team
**Version**: 1.0.0 - Phase 1
**Status**: Ready for Testing
