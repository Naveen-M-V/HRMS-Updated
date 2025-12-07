# Sample Data Creation Scripts for Report Library

## Overview
These scripts will populate the new models (Expense, PayrollException, LatenessRecord) with sample data for testing the Report Library functionality.

## Prerequisites

1. Connect to MongoDB:
```bash
mongosh "mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging"
```

2. Get employee IDs to use in sample data:
```javascript
// Get first 5 employees
db.employeeshubs.find({}, { _id: 1, firstName: 1, lastName: 1, employeeId: 1 }).limit(5).pretty()

// Save IDs for use below
const emp1 = ObjectId("YOUR_EMPLOYEE_ID_1");
const emp2 = ObjectId("YOUR_EMPLOYEE_ID_2");
const emp3 = ObjectId("YOUR_EMPLOYEE_ID_3");
const emp4 = ObjectId("YOUR_EMPLOYEE_ID_4");
const emp5 = ObjectId("YOUR_EMPLOYEE_ID_5");
```

## 1. Sample Expense Data

```javascript
// Create 10 sample expenses with various statuses and categories

db.expenses.insertMany([
  // Pending expenses
  {
    employee: emp1,
    date: new Date("2024-01-05"),
    amount: 45.50,
    currency: "GBP",
    category: "Travel",
    description: "Taxi to client meeting in London",
    status: "pending",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05")
  },
  {
    employee: emp2,
    date: new Date("2024-01-08"),
    amount: 120.00,
    currency: "GBP",
    category: "Meals",
    description: "Team lunch with prospective client",
    status: "pending",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08")
  },
  {
    employee: emp3,
    date: new Date("2024-01-10"),
    amount: 25.99,
    currency: "GBP",
    category: "Equipment",
    description: "USB-C cable for laptop",
    status: "pending",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10")
  },
  
  // Approved expenses
  {
    employee: emp1,
    date: new Date("2023-12-15"),
    amount: 350.00,
    currency: "GBP",
    category: "Training",
    description: "AWS Certification exam fee",
    status: "approved",
    approvedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    approvedAt: new Date("2023-12-18"),
    createdAt: new Date("2023-12-15"),
    updatedAt: new Date("2023-12-18")
  },
  {
    employee: emp4,
    date: new Date("2023-12-20"),
    amount: 180.00,
    currency: "GBP",
    category: "Accommodation",
    description: "Hotel stay for conference in Manchester",
    receiptUrl: "https://example.com/receipt123.pdf",
    receiptFileName: "receipt123.pdf",
    status: "approved",
    approvedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    approvedAt: new Date("2023-12-22"),
    createdAt: new Date("2023-12-20"),
    updatedAt: new Date("2023-12-22")
  },
  
  // Paid expenses
  {
    employee: emp2,
    date: new Date("2023-11-10"),
    amount: 75.50,
    currency: "GBP",
    category: "Travel",
    description: "Train tickets London to Birmingham",
    status: "paid",
    approvedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    approvedAt: new Date("2023-11-12"),
    paidBy: ObjectId("YOUR_ADMIN_USER_ID"),
    paidAt: new Date("2023-11-30"),
    createdAt: new Date("2023-11-10"),
    updatedAt: new Date("2023-11-30")
  },
  {
    employee: emp5,
    date: new Date("2023-11-15"),
    amount: 45.00,
    currency: "GBP",
    category: "Meals",
    description: "Dinner with client",
    status: "paid",
    approvedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    approvedAt: new Date("2023-11-16"),
    paidBy: ObjectId("YOUR_ADMIN_USER_ID"),
    paidAt: new Date("2023-11-30"),
    createdAt: new Date("2023-11-15"),
    updatedAt: new Date("2023-11-30")
  },
  
  // Rejected expense
  {
    employee: emp3,
    date: new Date("2024-01-03"),
    amount: 200.00,
    currency: "GBP",
    category: "Other",
    description: "Personal laptop purchase",
    status: "rejected",
    rejectedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    rejectedAt: new Date("2024-01-04"),
    rejectionReason: "Personal equipment not covered by company policy",
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-04")
  },
  
  // More travel expenses
  {
    employee: emp4,
    date: new Date("2024-01-12"),
    amount: 65.00,
    currency: "GBP",
    category: "Travel",
    description: "Parking fees at client site",
    status: "pending",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12")
  },
  {
    employee: emp1,
    date: new Date("2024-01-14"),
    amount: 95.00,
    currency: "GBP",
    category: "Meals",
    description: "Client lunch meeting",
    receiptUrl: "https://example.com/receipt456.pdf",
    receiptFileName: "receipt456.pdf",
    status: "approved",
    approvedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    approvedAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-15")
  }
]);

// Verify insertion
db.expenses.countDocuments();
db.expenses.find({}).pretty();
```

## 2. Sample Lateness Data

```javascript
// Create 15 lateness records across different employees and dates

db.latenessrecords.insertMany([
  // Employee 1 - Multiple late arrivals
  {
    employee: emp1,
    date: new Date("2024-01-08"),
    scheduledStart: new Date("2024-01-08T09:00:00Z"),
    actualStart: new Date("2024-01-08T09:15:00Z"),
    minutesLate: 15,
    reason: "Traffic jam on M25",
    excused: false,
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08")
  },
  {
    employee: emp1,
    date: new Date("2024-01-10"),
    scheduledStart: new Date("2024-01-10T09:00:00Z"),
    actualStart: new Date("2024-01-10T09:30:00Z"),
    minutesLate: 30,
    reason: "Train delay",
    excused: true,
    excusedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    excusedAt: new Date("2024-01-10"),
    excuseReason: "National Rail confirmed 45-minute delay",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10")
  },
  {
    employee: emp1,
    date: new Date("2024-01-15"),
    scheduledStart: new Date("2024-01-15T09:00:00Z"),
    actualStart: new Date("2024-01-15T09:08:00Z"),
    minutesLate: 8,
    excused: false,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15")
  },
  
  // Employee 2 - Occasional lateness
  {
    employee: emp2,
    date: new Date("2024-01-05"),
    scheduledStart: new Date("2024-01-05T08:30:00Z"),
    actualStart: new Date("2024-01-05T08:45:00Z"),
    minutesLate: 15,
    reason: "Childcare drop-off delayed",
    excused: false,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05")
  },
  {
    employee: emp2,
    date: new Date("2024-01-12"),
    scheduledStart: new Date("2024-01-12T08:30:00Z"),
    actualStart: new Date("2024-01-12T09:00:00Z"),
    minutesLate: 30,
    reason: "Doctor appointment ran late",
    excused: true,
    excusedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    excusedAt: new Date("2024-01-12"),
    excuseReason: "Medical appointment confirmed",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12")
  },
  
  // Employee 3 - Consistent pattern (Bradford Factor trigger)
  {
    employee: emp3,
    date: new Date("2024-01-03"),
    scheduledStart: new Date("2024-01-03T09:00:00Z"),
    actualStart: new Date("2024-01-03T09:20:00Z"),
    minutesLate: 20,
    excused: false,
    createdAt: new Date("2024-01-03"),
    updatedAt: new Date("2024-01-03")
  },
  {
    employee: emp3,
    date: new Date("2024-01-05"),
    scheduledStart: new Date("2024-01-05T09:00:00Z"),
    actualStart: new Date("2024-01-05T09:25:00Z"),
    minutesLate: 25,
    excused: false,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05")
  },
  {
    employee: emp3,
    date: new Date("2024-01-09"),
    scheduledStart: new Date("2024-01-09T09:00:00Z"),
    actualStart: new Date("2024-01-09T09:35:00Z"),
    minutesLate: 35,
    excused: false,
    createdAt: new Date("2024-01-09"),
    updatedAt: new Date("2024-01-09")
  },
  {
    employee: emp3,
    date: new Date("2024-01-11"),
    scheduledStart: new Date("2024-01-11T09:00:00Z"),
    actualStart: new Date("2024-01-11T09:18:00Z"),
    minutesLate: 18,
    excused: false,
    notes: "Manager discussion scheduled",
    createdAt: new Date("2024-01-11"),
    updatedAt: new Date("2024-01-11")
  },
  
  // Employee 4 - Rare lateness
  {
    employee: emp4,
    date: new Date("2024-01-07"),
    scheduledStart: new Date("2024-01-07T09:00:00Z"),
    actualStart: new Date("2024-01-07T09:10:00Z"),
    minutesLate: 10,
    reason: "Alarm didn't go off",
    excused: false,
    createdAt: new Date("2024-01-07"),
    updatedAt: new Date("2024-01-07")
  },
  
  // Employee 5 - Mixed excused/unexcused
  {
    employee: emp5,
    date: new Date("2024-01-04"),
    scheduledStart: new Date("2024-01-04T08:00:00Z"),
    actualStart: new Date("2024-01-04T08:22:00Z"),
    minutesLate: 22,
    reason: "Car breakdown",
    excused: true,
    excusedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    excusedAt: new Date("2024-01-04"),
    excuseReason: "AA breakdown recovery confirmed",
    createdAt: new Date("2024-01-04"),
    updatedAt: new Date("2024-01-04")
  },
  {
    employee: emp5,
    date: new Date("2024-01-10"),
    scheduledStart: new Date("2024-01-10T08:00:00Z"),
    actualStart: new Date("2024-01-10T08:12:00Z"),
    minutesLate: 12,
    excused: false,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10")
  },
  {
    employee: emp5,
    date: new Date("2024-01-15"),
    scheduledStart: new Date("2024-01-15T08:00:00Z"),
    actualStart: new Date("2024-01-15T08:40:00Z"),
    minutesLate: 40,
    reason: "Snow causing travel disruption",
    excused: true,
    excusedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    excusedAt: new Date("2024-01-15"),
    excuseReason: "Severe weather confirmed by Met Office",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15")
  },
  
  // Recent incidents
  {
    employee: emp2,
    date: new Date("2024-01-16"),
    scheduledStart: new Date("2024-01-16T08:30:00Z"),
    actualStart: new Date("2024-01-16T08:45:00Z"),
    minutesLate: 15,
    reason: "Bus delay",
    excused: false,
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16")
  },
  {
    employee: emp4,
    date: new Date("2024-01-16"),
    scheduledStart: new Date("2024-01-16T09:00:00Z"),
    actualStart: new Date("2024-01-16T09:05:00Z"),
    minutesLate: 5,
    excused: false,
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16")
  }
]);

// Verify insertion
db.latenessrecords.countDocuments();
db.latenessrecords.find({}).pretty();

// Check lateness statistics
db.latenessrecords.aggregate([
  {
    $group: {
      _id: "$employee",
      totalIncidents: { $sum: 1 },
      totalMinutesLate: { $sum: "$minutesLate" },
      excusedCount: { $sum: { $cond: ["$excused", 1, 0] } }
    }
  }
]);
```

## 3. Sample Payroll Exception Data

```javascript
// Create 12 payroll exceptions with various types and severities

db.payrollexceptions.insertMany([
  // Current pay period - unresolved exceptions
  {
    employee: emp1,
    payPeriodStart: new Date("2024-01-01"),
    payPeriodEnd: new Date("2024-01-31"),
    exceptionType: "missing_timesheet",
    description: "Timesheet not submitted for week ending 07/01/2024",
    severity: "high",
    resolved: false,
    affectedAmount: 0,
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08")
  },
  {
    employee: emp2,
    payPeriodStart: new Date("2024-01-01"),
    payPeriodEnd: new Date("2024-01-31"),
    exceptionType: "overtime_approval",
    description: "10 hours overtime not approved by manager",
    severity: "medium",
    resolved: false,
    affectedAmount: 150.00,
    notes: "Awaiting manager approval for overtime worked on 12-13 Jan",
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14")
  },
  {
    employee: emp3,
    payPeriodStart: new Date("2024-01-01"),
    payPeriodEnd: new Date("2024-01-31"),
    exceptionType: "missing_clockout",
    description: "Forgot to clock out on 10/01/2024",
    severity: "low",
    resolved: false,
    affectedAmount: 0,
    createdAt: new Date("2024-01-11"),
    updatedAt: new Date("2024-01-11")
  },
  {
    employee: emp4,
    payPeriodStart: new Date("2024-01-01"),
    payPeriodEnd: new Date("2024-01-31"),
    exceptionType: "unapproved_leave",
    description: "Sick leave on 09/01 not approved",
    severity: "high",
    resolved: false,
    affectedAmount: 120.00,
    notes: "Waiting for sick note documentation",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10")
  },
  {
    employee: emp5,
    payPeriodStart: new Date("2024-01-01"),
    payPeriodEnd: new Date("2024-01-31"),
    exceptionType: "duplicate_entries",
    description: "Duplicate time entries on 05/01/2024",
    severity: "critical",
    resolved: false,
    affectedAmount: 0,
    notes: "Time entry recorded twice - needs correction",
    createdAt: new Date("2024-01-06"),
    updatedAt: new Date("2024-01-06")
  },
  
  // Previous pay period - resolved exceptions
  {
    employee: emp1,
    payPeriodStart: new Date("2023-12-01"),
    payPeriodEnd: new Date("2023-12-31"),
    exceptionType: "missing_timesheet",
    description: "Timesheet not submitted for week ending 17/12/2023",
    severity: "high",
    resolved: true,
    resolvedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    resolvedAt: new Date("2023-12-18"),
    resolution: "Timesheet submitted and approved retrospectively",
    affectedAmount: 0,
    createdAt: new Date("2023-12-18"),
    updatedAt: new Date("2023-12-18")
  },
  {
    employee: emp2,
    payPeriodStart: new Date("2023-12-01"),
    payPeriodEnd: new Date("2023-12-31"),
    exceptionType: "missing_expenses",
    description: "Travel expenses not submitted for client visit",
    severity: "medium",
    resolved: true,
    resolvedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    resolvedAt: new Date("2023-12-22"),
    resolution: "Expense claim submitted with receipts",
    affectedAmount: 75.50,
    createdAt: new Date("2023-12-20"),
    updatedAt: new Date("2023-12-22")
  },
  {
    employee: emp3,
    payPeriodStart: new Date("2023-12-01"),
    payPeriodEnd: new Date("2023-12-31"),
    exceptionType: "negative_balance",
    description: "Annual leave balance negative by 2 days",
    severity: "critical",
    resolved: true,
    resolvedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    resolvedAt: new Date("2023-12-28"),
    resolution: "Leave balance adjusted after carry-over calculation error",
    affectedAmount: 0,
    createdAt: new Date("2023-12-27"),
    updatedAt: new Date("2023-12-28")
  },
  
  // November pay period
  {
    employee: emp4,
    payPeriodStart: new Date("2023-11-01"),
    payPeriodEnd: new Date("2023-11-30"),
    exceptionType: "missing_clockout",
    description: "Multiple days with missing clock-out times",
    severity: "medium",
    resolved: true,
    resolvedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    resolvedAt: new Date("2023-12-05"),
    resolution: "Clock-out times verified with manager and updated",
    affectedAmount: 0,
    createdAt: new Date("2023-12-01"),
    updatedAt: new Date("2023-12-05")
  },
  {
    employee: emp5,
    payPeriodStart: new Date("2023-11-01"),
    payPeriodEnd: new Date("2023-11-30"),
    exceptionType: "overtime_approval",
    description: "Weekend work not pre-approved",
    severity: "high",
    resolved: true,
    resolvedBy: ObjectId("YOUR_ADMIN_USER_ID"),
    resolvedAt: new Date("2023-12-03"),
    resolution: "Manager confirmed emergency work was necessary, approved retrospectively",
    affectedAmount: 300.00,
    createdAt: new Date("2023-11-27"),
    updatedAt: new Date("2023-12-03")
  },
  
  // More recent unresolved
  {
    employee: emp1,
    payPeriodStart: new Date("2024-01-01"),
    payPeriodEnd: new Date("2024-01-31"),
    exceptionType: "other",
    description: "Hourly rate change not reflected in system",
    severity: "critical",
    resolved: false,
    affectedAmount: 0,
    notes: "Pay rise effective 01/01 needs manual adjustment",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15")
  },
  {
    employee: emp3,
    payPeriodStart: new Date("2024-01-01"),
    payPeriodEnd: new Date("2024-01-31"),
    exceptionType: "missing_expenses",
    description: "Parking expenses from 08/01 not submitted",
    severity: "low",
    resolved: false,
    affectedAmount: 25.00,
    createdAt: new Date("2024-01-09"),
    updatedAt: new Date("2024-01-09")
  }
]);

// Verify insertion
db.payrollexceptions.countDocuments();
db.payrollexceptions.find({}).pretty();

// Check unresolved exceptions
db.payrollexceptions.aggregate([
  { $match: { resolved: false } },
  {
    $group: {
      _id: "$severity",
      count: { $sum: 1 },
      totalAffected: { $sum: "$affectedAmount" }
    }
  },
  { $sort: { "_id": 1 } }
]);
```

## 4. Verification Queries

```javascript
// Count documents in each collection
print("Expenses: " + db.expenses.countDocuments());
print("Lateness Records: " + db.latenessrecords.countDocuments());
print("Payroll Exceptions: " + db.payrollexceptions.countDocuments());

// Check date ranges
print("\n--- Expense Date Range ---");
db.expenses.aggregate([
  {
    $group: {
      _id: null,
      minDate: { $min: "$date" },
      maxDate: { $max: "$date" },
      totalAmount: { $sum: "$amount" }
    }
  }
]);

print("\n--- Lateness Date Range ---");
db.latenessrecords.aggregate([
  {
    $group: {
      _id: null,
      minDate: { $min: "$date" },
      maxDate: { $max: "$date" },
      totalMinutes: { $sum: "$minutesLate" },
      avgMinutes: { $avg: "$minutesLate" }
    }
  }
]);

print("\n--- Payroll Exceptions Summary ---");
db.payrollexceptions.aggregate([
  {
    $group: {
      _id: { resolved: "$resolved", severity: "$severity" },
      count: { $sum: 1 }
    }
  },
  { $sort: { "_id.resolved": 1, "_id.severity": 1 } }
]);
```

## 5. Testing Report Generation

After populating data, test each report:

```bash
# In your terminal or Postman

# 1. Test Expenses Report
curl -X POST http://localhost:5004/api/report-library/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2023-11-01",
    "endDate": "2024-01-31",
    "status": "pending"
  }'

# 2. Test Lateness Report
curl -X POST http://localhost:5004/api/report-library/lateness \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "includeExcused": false
  }'

# 3. Test Payroll Exceptions Report
curl -X POST http://localhost:5004/api/report-library/payroll-exceptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payPeriodStart": "2024-01-01",
    "payPeriodEnd": "2024-01-31",
    "resolved": false
  }'
```

## 6. Automated Population Script (Node.js)

Create `backend/scripts/populateSampleReportData.js`:

```javascript
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const LatenessRecord = require('../models/LatenessRecord');
const PayrollException = require('../models/PayrollException');
const EmployeesHub = require('../models/EmployeesHub');

async function populateSampleData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://thaya:pass@65.21.71.57:27017/talentshield_staging');
    
    // Get 5 employee IDs
    const employees = await EmployeesHub.find({}).limit(5).select('_id');
    if (employees.length < 5) {
      console.error('Need at least 5 employees in database');
      process.exit(1);
    }
    
    const [emp1, emp2, emp3, emp4, emp5] = employees.map(e => e._id);
    
    // Clear existing sample data
    await Expense.deleteMany({});
    await LatenessRecord.deleteMany({});
    await PayrollException.deleteMany({});
    
    // Insert expenses (reuse data from above)
    // Insert lateness records (reuse data from above)
    // Insert payroll exceptions (reuse data from above)
    
    console.log('Sample data populated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

populateSampleData();
```

Run with:
```bash
cd backend
node scripts/populateSampleReportData.js
```

---

**Note**: Replace `YOUR_EMPLOYEE_ID_X` and `YOUR_ADMIN_USER_ID` with actual ObjectIds from your database.
