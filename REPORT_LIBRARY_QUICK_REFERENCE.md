# Report Library - Quick Reference Guide

## 🎯 What Was Built

A complete **BrightHR-style Report Library** with:
- ✅ **14 report types** covering Leave, Time, People, Finance, Payroll, and Compliance
- ✅ **3 new database models** (Expense, PayrollException, LatenessRecord)
- ✅ **16 API endpoints** for report generation and export
- ✅ **Full-stack implementation** with React frontend and Node.js/MongoDB backend
- ✅ **Advanced features**: Date filtering, employee selection, category grouping, search

## 📁 Files Created (11 New Files)

### Backend (5 files):
1. `backend/models/Expense.js` - 82 lines
2. `backend/models/PayrollException.js` - 89 lines
3. `backend/models/LatenessRecord.js` - 76 lines
4. `backend/routes/reportLibraryRoutes.js` - 30 lines
5. `backend/controllers/reportLibraryController.js` - 738 lines

### Frontend (3 files):
6. `frontend/src/pages/ReportLibrary.js` - 173 lines
7. `frontend/src/components/Reports/ReportCard.js` - 60 lines
8. `frontend/src/components/Reports/ReportGenerationPanel.js` - 358 lines

### Documentation (3 files):
9. `REPORT_LIBRARY_IMPLEMENTATION.md` - 500+ lines (comprehensive blueprint)
10. `REPORT_LIBRARY_PHASE1_COMPLETE.md` - Implementation summary
11. `REPORT_LIBRARY_DEPLOYMENT.md` - Deployment guide

**Total Lines of Code**: ~2,100 lines

## 🔗 API Endpoints

**Base URL**: `/api/report-library` (all require authentication)

### Core Endpoints:
- `GET /types` - Get all 14 report types with metadata
- `POST /absence` - Absence report (all leave types)
- `POST /annual-leave` - Annual leave usage & balances
- `POST /lateness` - Lateness incidents & patterns
- `POST /overtime` - Overtime hours & costs
- `POST /rota` - Shift schedules & coverage
- `POST /sickness` - Sickness with Bradford Factor
- `POST /employee-details` - Employee data export
- `POST /payroll-exceptions` - Pre-payroll issues
- `POST /expenses` - Expense claims & reimbursements
- `POST /length-of-service` - Employee tenure
- `POST /turnover` - Turnover & retention metrics
- `POST /working-status` - Employment status breakdown
- `POST /sensitive-info` - Expiring certificates
- `POST /furloughed` - Furloughed employees list

### Export Endpoints (Placeholders):
- `GET /export/:reportId/csv` - CSV export (to be implemented)
- `GET /export/:reportId/pdf` - PDF export (to be implemented)

## 📊 Report Parameters

### Common Parameters (Most Reports):
```json
{
  "startDate": "2024-01-01",           // ISO date (YYYY-MM-DD)
  "endDate": "2024-12-31",             // ISO date (YYYY-MM-DD)
  "employeeIds": ["id1", "id2"]        // Optional: filter by employees
}
```

### Report-Specific Parameters:

**Annual Leave**:
```json
{ "year": 2024 }
```

**Payroll Exceptions**:
```json
{
  "payPeriodStart": "2024-01-01",
  "payPeriodEnd": "2024-01-31",
  "resolved": false                    // Optional: filter by resolved status
}
```

**Lateness**:
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "includeExcused": false              // Optional: include excused lateness
}
```

**Sensitive Information**:
```json
{
  "expiryWithinDays": 30               // Optional: threshold (default: 30)
}
```

**Expenses**:
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "status": "pending"                  // Optional: pending/approved/rejected/paid
}
```

## 💾 Database Models

### Expense Schema:
```javascript
{
  employee: ObjectId,          // ref: EmployeeHub
  date: Date,
  amount: Number,              // e.g., 45.50
  currency: String,            // GBP/USD/EUR
  category: String,            // Travel/Meals/Accommodation/Equipment/Training/Other
  description: String,         // max 500 chars
  receiptUrl: String,
  receiptFileName: String,
  status: String,              // pending/approved/rejected/paid
  approvedBy: ObjectId,        // ref: User
  approvedAt: Date,
  rejectedBy: ObjectId,
  rejectedAt: Date,
  rejectionReason: String,
  paidAt: Date,
  paidBy: ObjectId,
  notes: String
}
```

### LatenessRecord Schema:
```javascript
{
  employee: ObjectId,          // ref: EmployeeHub
  date: Date,
  scheduledStart: Date,
  actualStart: Date,
  minutesLate: Number,
  shift: ObjectId,             // ref: Shift (optional)
  rota: ObjectId,              // ref: Rota (optional)
  reason: String,
  excused: Boolean,            // default: false
  excusedBy: ObjectId,         // ref: User
  excusedAt: Date,
  excuseReason: String,
  notes: String
}
```

### PayrollException Schema:
```javascript
{
  employee: ObjectId,          // ref: EmployeeHub
  payPeriodStart: Date,
  payPeriodEnd: Date,
  exceptionType: String,       // missing_timesheet/unapproved_leave/missing_expenses/
                              // overtime_approval/negative_balance/missing_clockout/
                              // duplicate_entries/other
  description: String,
  severity: String,            // low/medium/high/critical
  resolved: Boolean,           // default: false
  resolvedBy: ObjectId,        // ref: User
  resolvedAt: Date,
  resolution: String,
  notes: String,
  affectedAmount: Number       // Financial impact
}
```

## 🎨 Frontend Components

### ReportLibrary Page:
- **Location**: `/report-library`
- **Features**: Search, category filter, responsive grid
- **Layout**: 1-4 columns (responsive)
- **Animations**: Framer Motion card entrance

### ReportCard Component:
- **Props**: `report`, `icon`, `onClick`, `delay`
- **Design**: Gradient header + category badge + description
- **Interaction**: Hover scale (1.05), click scale (0.98)

### ReportGenerationPanel Component:
- **Type**: Modal overlay
- **Inputs**: Date range, employee multi-select, format selector
- **Output**: JSON preview + export button
- **Loading**: Spinner during generation

## 🔍 Search & Filter

### Search:
- Real-time filtering on report name and description
- Case-insensitive matching
- Instant results (no debounce needed)

### Category Filter:
- All Reports (default)
- Leave
- Time
- People
- Finance
- Payroll
- Compliance

## 🚀 Deployment Commands

### Backend:
```bash
ssh pentest@65.21.71.57
cd ~/apps/hrms
git pull origin main
cd backend && npm install
pm2 restart hrms-backend
pm2 logs hrms-backend --lines 50
```

### Frontend:
```bash
cd E:\Websites\HRMSLogin\hrms-updated\frontend
npm run build
# On server:
sudo docker cp build/. ctfd-nginx-1:/usr/share/nginx/html/
```

### Git:
```bash
git add .
git commit -m "feat: Report Library Phase 1 - 14 report types with full UI"
git push origin main
```

## ✅ Testing Checklist

### Backend Tests:
- [ ] `GET /api/report-library/types` returns 14 reports
- [ ] Absence report generates with date range
- [ ] Annual leave report calculates balances correctly
- [ ] Lateness report filters excused incidents
- [ ] Overtime report calculates 1.5x pay rate
- [ ] Sickness report computes Bradford Factor
- [ ] Employee details report exports all fields
- [ ] Payroll exceptions filter by severity
- [ ] Expenses report totals by status
- [ ] Length of service calculates years/months
- [ ] Turnover report calculates rate percentage
- [ ] Working status groups by employment type
- [ ] Sensitive info finds expiring certificates
- [ ] Furloughed report lists active furloughs

### Frontend Tests:
- [ ] Report Library loads all 14 cards
- [ ] Search filters reports in real-time
- [ ] Category filter works correctly
- [ ] Clicking card opens modal
- [ ] Date pickers have default values (last 30 days)
- [ ] Employee list populates with checkboxes
- [ ] "Select All" toggles all employees
- [ ] "Generate Report" button works
- [ ] Loading spinner shows during generation
- [ ] JSON results display in preview
- [ ] "Export JSON" downloads file
- [ ] Modal closes on "Cancel" or X button

### Integration Tests:
- [ ] Reports with no data return empty array
- [ ] Reports respect employee selection filter
- [ ] Date range validation prevents invalid ranges
- [ ] Authentication token passed correctly
- [ ] Errors display in red alert box
- [ ] Success shows record count

## 📈 Performance Metrics

**Expected Response Times**:
- Report types endpoint: ~50ms
- Small report (1-10 records): 100-300ms
- Medium report (10-100 records): 300-800ms
- Large report (100-1000 records): 1-3 seconds
- Very large report (1000+ records): 3-10 seconds

**Optimization Strategies**:
- MongoDB indexes on employee, date, status fields
- Aggregation pipelines use $match before $lookup
- Frontend debounces search (current: none, add if needed)
- Consider Redis caching for frequently run reports

## 🐛 Common Issues & Solutions

### Issue: "Cannot GET /api/report-library/types"
**Fix**: PM2 didn't reload routes
```bash
pm2 restart hrms-backend
```

### Issue: Report returns empty array
**Fix**: No sample data in database
- See `SAMPLE_DATA_CREATION.md` for scripts
- Test with reports using existing models first (Employee Details, Annual Leave)

### Issue: "Authentication required"
**Fix**: Token not being sent
- Check localStorage has 'auth_token'
- Verify axios interceptor adds Authorization header

### Issue: Frontend search not working
**Fix**: filterReports() not called on search change
- Already implemented with useEffect hook

### Issue: Slow report generation
**Fix**: Add indexes or limit date range
```javascript
db.latenessrecords.createIndex({ employee: 1, date: -1 });
db.expenses.createIndex({ date: 1, status: 1 });
```

## 📦 Package Dependencies

### Already Installed:
✅ Frontend: `date-fns`, `framer-motion`, `lucide-react`, `axios`
✅ Backend: `mongoose`, `express`, `jsonwebtoken`

### To Install (CSV/PDF Export):
```bash
cd backend
npm install json2csv pdfkit
```

## 🔮 Future Enhancements

### Phase 2 (CSV/PDF Export):
- Implement `exportReportCSV()` with json2csv
- Implement `exportReportPDF()` with pdfkit
- Add email delivery option

### Phase 3 (Advanced Features):
- Report persistence (save history to database)
- Scheduled reports (cron jobs)
- Custom field selection
- Chart visualizations
- Comparison mode (period over period)

### Phase 4 (Automation):
- Automated lateness detection (compare TimeEntry vs Rota)
- Auto-generate payroll exceptions
- Email notifications for critical exceptions
- Dashboard widgets showing key metrics

### Phase 5 (Optimization):
- Redis caching for large reports
- Bull queue for async generation
- Pagination for very large datasets
- Report templates system

## 📞 Quick Links

- **Implementation Plan**: `REPORT_LIBRARY_IMPLEMENTATION.md`
- **Phase 1 Summary**: `REPORT_LIBRARY_PHASE1_COMPLETE.md`
- **Deployment Guide**: `REPORT_LIBRARY_DEPLOYMENT.md`
- **Sample Data Scripts**: `SAMPLE_DATA_CREATION.md`
- **Backend Models**: `backend/models/`
- **Backend Routes**: `backend/routes/reportLibraryRoutes.js`
- **Backend Controller**: `backend/controllers/reportLibraryController.js`
- **Frontend Page**: `frontend/src/pages/ReportLibrary.js`
- **Frontend Components**: `frontend/src/components/Reports/`

---

## 📊 Report Summary Table

| # | Report Name | Category | Uses Model(s) | Data Required | Status |
|---|-------------|----------|---------------|---------------|--------|
| 1 | Absence Report | Leave | LeaveRecord | Any leave type | ✅ Ready |
| 2 | Annual Leave | Leave | LeaveRecord, AnnualLeaveBalance | type='annual' | ✅ Ready |
| 3 | Lateness | Time | LatenessRecord | Clock-in times | ⚠️ Need data |
| 4 | Overtime | Time | TimeEntry | Clock in/out | ✅ Ready |
| 5 | Rota | Time | Rota, Shift | Shift assignments | ✅ Ready |
| 6 | Sickness | Leave | LeaveRecord | type='sick' | ✅ Ready |
| 7 | Employee Details | People | EmployeesHub | Any employees | ✅ Ready |
| 8 | Payroll Exceptions | Payroll | PayrollException | Pay periods | ⚠️ Need data |
| 9 | Expenses | Finance | Expense | Expense claims | ⚠️ Need data |
| 10 | Length of Service | People | EmployeesHub | startDate field | ⚠️ Need field |
| 11 | Turnover | People | ArchiveEmployee | Terminated employees | ✅ Ready |
| 12 | Working Status | People | EmployeesHub | status field | ✅ Ready |
| 13 | Sensitive Info | Compliance | Certificate | Certificates with expiry | ✅ Ready |
| 14 | Furloughed | People | EmployeesHub | furloughStatus field | ⚠️ Need field |

**Legend**:
- ✅ Ready: Model exists, data likely available
- ⚠️ Need data: New model, needs sample data
- ⚠️ Need field: Model needs schema enhancement

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Status**: Phase 1 Complete
