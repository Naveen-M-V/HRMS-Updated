const LeaveRecord = require('../models/LeaveRecord');
const TimeEntry = require('../models/TimeEntry');
const EmployeesHub = require('../models/EmployeesHub');
const Rota = require('../models/Rota');
const Shift = require('../models/Shift');
const Certificate = require('../models/Certificate');
const Expense = require('../models/Expense');
const PayrollException = require('../models/PayrollException');
const LatenessRecord = require('../models/LatenessRecord');
const ArchiveEmployee = require('../models/ArchiveEmployee');
const AnnualLeaveBalance = require('../models/AnnualLeaveBalance');
const { exportReportToCSV } = require('../utils/csvExporter');
const { exportReportToPDF } = require('../utils/pdfExporter');

/**
 * Get all available report types with metadata
 */
exports.getReportTypes = async (req, res) => {
  try {
    const reportTypes = [
      {
        id: 'absence',
        name: 'Absence Report',
        description: 'Comprehensive absence tracking including all leave types',
        icon: 'UserX',
        category: 'Leave'
      },
      {
        id: 'annual-leave',
        name: 'Annual Leave Report',
        description: 'Annual leave usage, balances, and trends',
        icon: 'Calendar',
        category: 'Leave'
      },
      {
        id: 'lateness',
        name: 'Lateness Report',
        description: 'Employee lateness incidents and patterns',
        icon: 'Clock',
        category: 'Time'
      },
      {
        id: 'overtime',
        name: 'Overtime Report',
        description: 'Overtime hours worked and costs',
        icon: 'TrendingUp',
        category: 'Time'
      },
      {
        id: 'rota',
        name: 'Rota Report',
        description: 'Shift schedules and coverage analysis',
        icon: 'CalendarDays',
        category: 'Time'
      },
      {
        id: 'sickness',
        name: 'Sickness Report',
        description: 'Sickness absence trends and Bradford Factor scores',
        icon: 'Activity',
        category: 'Leave'
      },
      {
        id: 'employee-details',
        name: 'Employee Details Report',
        description: 'Comprehensive employee information export',
        icon: 'Users',
        category: 'People'
      },
      {
        id: 'payroll-exceptions',
        name: 'Payroll Exceptions',
        description: 'Issues requiring resolution before payroll',
        icon: 'AlertTriangle',
        category: 'Payroll'
      },
      {
        id: 'expenses',
        name: 'Expenses Report',
        description: 'Employee expense claims and reimbursements',
        icon: 'Receipt',
        category: 'Finance'
      },
      {
        id: 'length-of-service',
        name: 'Length of Service',
        description: 'Employee tenure and service anniversaries',
        icon: 'Award',
        category: 'People'
      },
      {
        id: 'turnover',
        name: 'Turnover & Retention',
        description: 'Employee turnover rates and retention metrics',
        icon: 'TrendingDown',
        category: 'People'
      },
      {
        id: 'working-status',
        name: 'Working Status',
        description: 'Current employment status breakdown',
        icon: 'BarChart',
        category: 'People'
      },
      {
        id: 'sensitive-info',
        name: 'Sensitive Information',
        description: 'Certificates and documents requiring renewal',
        icon: 'ShieldAlert',
        category: 'Compliance'
      },
      {
        id: 'furloughed',
        name: 'Furloughed Employees',
        description: 'List of employees on furlough',
        icon: 'Pause',
        category: 'People'
      }
    ];

    res.json({ success: true, data: reportTypes });
  } catch (error) {
    console.error('Error fetching report types:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Absence Report
 */
exports.generateAbsenceReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeIds, includeExcused } = req.body;

    const matchStage = {
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: 'approved'
    };

    if (employeeIds && employeeIds.length > 0) {
      matchStage.employee = { $in: employeeIds };
    }

    const absenceData = await LeaveRecord.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'employeeshubs',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $group: {
          _id: {
            employeeId: '$employee',
            leaveType: '$leaveType'
          },
          employee: { $first: '$employeeDetails' },
          totalDays: { $sum: '$daysUsed' },
          instances: { $sum: 1 },
          records: { $push: '$$ROOT' }
        }
      },
      {
        $group: {
          _id: '$_id.employeeId',
          employee: { $first: '$employee' },
          leaveBreakdown: {
            $push: {
              leaveType: '$_id.leaveType',
              totalDays: '$totalDays',
              instances: '$instances'
            }
          },
          totalAbsenceDays: { $sum: '$totalDays' },
          totalInstances: { $sum: '$instances' }
        }
      },
      {
        $project: {
          employeeId: '$employee.employeeId',
          fullName: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] },
          department: '$employee.department',
          jobTitle: '$employee.jobTitle',
          leaveBreakdown: 1,
          totalAbsenceDays: 1,
          totalInstances: 1
        }
      },
      { $sort: { totalAbsenceDays: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        reportType: 'absence',
        dateRange: { startDate, endDate },
        totalRecords: absenceData.length,
        records: absenceData
      }
    });
  } catch (error) {
    console.error('Error generating absence report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Annual Leave Report
 */
exports.generateAnnualLeaveReport = async (req, res) => {
  try {
    const { year, employeeIds } = req.body;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const matchStage = {
      date: { $gte: startDate, $lte: endDate },
      leaveType: 'annual',
      status: 'approved'
    };

    if (employeeIds && employeeIds.length > 0) {
      matchStage.employee = { $in: employeeIds };
    }

    const leaveData = await LeaveRecord.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'employeeshubs',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $group: {
          _id: '$employee',
          employee: { $first: '$employeeDetails' },
          totalUsed: { $sum: '$daysUsed' },
          instances: { $sum: 1 }
        }
      }
    ]);

    // Get balances
    const balances = await AnnualLeaveBalance.find({
      employee: { $in: leaveData.map(l => l._id) },
      year: year
    });

    const balanceMap = {};
    balances.forEach(b => {
      balanceMap[b.employee.toString()] = b;
    });

    const reportData = leaveData.map(record => {
      const balance = balanceMap[record._id.toString()] || {};
      return {
        employeeId: record.employee.employeeId,
        fullName: `${record.employee.firstName} ${record.employee.lastName}`,
        department: record.employee.department,
        entitled: balance.totalEntitled || 0,
        used: record.totalUsed,
        remaining: (balance.totalEntitled || 0) - record.totalUsed,
        instances: record.instances
      };
    });

    res.json({
      success: true,
      data: {
        reportType: 'annual-leave',
        year: year,
        totalRecords: reportData.length,
        records: reportData
      }
    });
  } catch (error) {
    console.error('Error generating annual leave report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Lateness Report
 */
exports.generateLatenessReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeIds, includeExcused } = req.body;

    const matchStage = {
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    if (employeeIds && employeeIds.length > 0) {
      matchStage.employee = { $in: employeeIds };
    }

    if (!includeExcused) {
      matchStage.excused = false;
    }

    const latenessData = await LatenessRecord.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'employeeshubs',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $group: {
          _id: '$employee',
          employee: { $first: '$employeeDetails' },
          totalIncidents: { $sum: 1 },
          excusedIncidents: {
            $sum: { $cond: ['$excused', 1, 0] }
          },
          totalMinutesLate: { $sum: '$minutesLate' },
          records: { $push: '$$ROOT' }
        }
      },
      {
        $project: {
          employeeId: '$employee.employeeId',
          fullName: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] },
          department: '$employee.department',
          jobTitle: '$employee.jobTitle',
          totalIncidents: 1,
          excusedIncidents: 1,
          unexcusedIncidents: { $subtract: ['$totalIncidents', '$excusedIncidents'] },
          totalMinutesLate: 1,
          averageMinutesLate: { $divide: ['$totalMinutesLate', '$totalIncidents'] }
        }
      },
      { $sort: { totalIncidents: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        reportType: 'lateness',
        dateRange: { startDate, endDate },
        totalRecords: latenessData.length,
        records: latenessData
      }
    });
  } catch (error) {
    console.error('Error generating lateness report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Overtime Report
 */
exports.generateOvertimeReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeIds } = req.body;

    const matchStage = {
      clockInTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
      clockOutTime: { $exists: true, $ne: null }
    };

    if (employeeIds && employeeIds.length > 0) {
      matchStage.employee = { $in: employeeIds };
    }

    const overtimeData = await TimeEntry.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          hoursWorked: {
            $divide: [
              { $subtract: ['$clockOutTime', '$clockInTime'] },
              1000 * 60 * 60
            ]
          }
        }
      },
      {
        $addFields: {
          overtimeHours: {
            $cond: {
              if: { $gt: ['$hoursWorked', 8] },
              then: { $subtract: ['$hoursWorked', 8] },
              else: 0
            }
          }
        }
      },
      {
        $match: {
          overtimeHours: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'employeeshubs',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $group: {
          _id: '$employee',
          employee: { $first: '$employeeDetails' },
          totalOvertimeHours: { $sum: '$overtimeHours' },
          overtimeInstances: { $sum: 1 }
        }
      },
      {
        $project: {
          employeeId: '$employee.employeeId',
          fullName: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] },
          department: '$employee.department',
          jobTitle: '$employee.jobTitle',
          hourlyRate: '$employee.hourlyRate',
          totalOvertimeHours: { $round: ['$totalOvertimeHours', 2] },
          overtimeInstances: 1,
          estimatedCost: {
            $round: [
              {
                $multiply: [
                  '$totalOvertimeHours',
                  { $multiply: ['$employee.hourlyRate', 1.5] }
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { totalOvertimeHours: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        reportType: 'overtime',
        dateRange: { startDate, endDate },
        totalRecords: overtimeData.length,
        records: overtimeData
      }
    });
  } catch (error) {
    console.error('Error generating overtime report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Rota Report
 */
exports.generateRotaReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeIds } = req.body;

    const matchStage = {
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    if (employeeIds && employeeIds.length > 0) {
      matchStage.employee = { $in: employeeIds };
    }

    const rotaData = await Rota.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'employeeshubs',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $lookup: {
          from: 'shifts',
          localField: 'shift',
          foreignField: '_id',
          as: 'shiftDetails'
        }
      },
      { $unwind: { path: '$shiftDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          date: 1,
          employeeId: '$employeeDetails.employeeId',
          fullName: { $concat: ['$employeeDetails.firstName', ' ', '$employeeDetails.lastName'] },
          department: '$employeeDetails.department',
          shiftName: '$shiftDetails.name',
          startTime: '$shiftDetails.startTime',
          endTime: '$shiftDetails.endTime',
          location: '$location',
          status: 1
        }
      },
      { $sort: { date: 1, startTime: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        reportType: 'rota',
        dateRange: { startDate, endDate },
        totalRecords: rotaData.length,
        records: rotaData
      }
    });
  } catch (error) {
    console.error('Error generating rota report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Sickness Report
 */
exports.generateSicknessReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeIds } = req.body;

    const matchStage = {
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      leaveType: 'sick',
      status: 'approved'
    };

    if (employeeIds && employeeIds.length > 0) {
      matchStage.employee = { $in: employeeIds };
    }

    const sicknessData = await LeaveRecord.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'employeeshubs',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails'
        }
      },
      { $unwind: '$employeeDetails' },
      {
        $group: {
          _id: '$employee',
          employee: { $first: '$employeeDetails' },
          totalDays: { $sum: '$daysUsed' },
          instances: { $sum: 1 },
          records: { $push: '$$ROOT' }
        }
      },
      {
        $addFields: {
          // Bradford Factor = S² × D (where S = number of spells, D = total days)
          bradfordFactor: {
            $multiply: [
              { $multiply: ['$instances', '$instances'] },
              '$totalDays'
            ]
          }
        }
      },
      {
        $project: {
          employeeId: '$employee.employeeId',
          fullName: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] },
          department: '$employee.department',
          jobTitle: '$employee.jobTitle',
          totalDays: 1,
          instances: 1,
          bradfordFactor: 1,
          riskLevel: {
            $cond: {
              if: { $gte: ['$bradfordFactor', 500] },
              then: 'high',
              else: {
                $cond: {
                  if: { $gte: ['$bradfordFactor', 200] },
                  then: 'medium',
                  else: 'low'
                }
              }
            }
          }
        }
      },
      { $sort: { bradfordFactor: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        reportType: 'sickness',
        dateRange: { startDate, endDate },
        totalRecords: sicknessData.length,
        records: sicknessData
      }
    });
  } catch (error) {
    console.error('Error generating sickness report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Employee Details Report
 */
exports.generateEmployeeDetailsReport = async (req, res) => {
  try {
    const { employeeIds, includeFields } = req.body;

    const matchStage = {};
    if (employeeIds && employeeIds.length > 0) {
      matchStage._id = { $in: employeeIds };
    }

    const employees = await EmployeesHub.find(matchStage)
      .select(includeFields || '')
      .lean();

    res.json({
      success: true,
      data: {
        reportType: 'employee-details',
        totalRecords: employees.length,
        records: employees
      }
    });
  } catch (error) {
    console.error('Error generating employee details report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Payroll Exceptions Report
 */
exports.generatePayrollExceptionsReport = async (req, res) => {
  try {
    const { payPeriodStart, payPeriodEnd, resolved } = req.body;

    const matchStage = {
      payPeriodStart: new Date(payPeriodStart),
      payPeriodEnd: new Date(payPeriodEnd)
    };

    if (resolved !== undefined) {
      matchStage.resolved = resolved;
    }

    const exceptions = await PayrollException.find(matchStage)
      .populate('employee', 'employeeId firstName lastName department jobTitle')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ severity: -1, createdAt: 1 })
      .lean();

    const formatted = exceptions.map(ex => ({
      ...ex,
      employeeName: ex.employee ? `${ex.employee.firstName} ${ex.employee.lastName}` : 'N/A',
      employeeId: ex.employee?.employeeId || 'N/A',
      department: ex.employee?.department || 'N/A',
      resolvedByName: ex.resolvedBy ? `${ex.resolvedBy.firstName} ${ex.resolvedBy.lastName}` : null
    }));

    res.json({
      success: true,
      data: {
        reportType: 'payroll-exceptions',
        payPeriod: { start: payPeriodStart, end: payPeriodEnd },
        totalRecords: formatted.length,
        records: formatted
      }
    });
  } catch (error) {
    console.error('Error generating payroll exceptions report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Expenses Report
 */
exports.generateExpensesReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeIds, status } = req.body;

    const matchStage = {
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    if (employeeIds && employeeIds.length > 0) {
      matchStage.employee = { $in: employeeIds };
    }

    if (status) {
      matchStage.status = status;
    }

    const expenses = await Expense.find(matchStage)
      .populate('employee', 'employeeId firstName lastName department')
      .populate('approvedBy', 'firstName lastName')
      .sort({ date: -1 })
      .lean();

    const formatted = expenses.map(exp => ({
      ...exp,
      employeeName: exp.employee ? `${exp.employee.firstName} ${exp.employee.lastName}` : 'N/A',
      employeeId: exp.employee?.employeeId || 'N/A',
      department: exp.employee?.department || 'N/A',
      approvedByName: exp.approvedBy ? `${exp.approvedBy.firstName} ${exp.approvedBy.lastName}` : null
    }));

    // Calculate totals by status
    const totals = {
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0
    };

    formatted.forEach(exp => {
      if (totals[exp.status] !== undefined) {
        totals[exp.status] += exp.amount;
      }
    });

    res.json({
      success: true,
      data: {
        reportType: 'expenses',
        dateRange: { startDate, endDate },
        totalRecords: formatted.length,
        totals: totals,
        records: formatted
      }
    });
  } catch (error) {
    console.error('Error generating expenses report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Length of Service Report
 */
exports.generateLengthOfServiceReport = async (req, res) => {
  try {
    const { employeeIds } = req.body;

    const matchStage = {};
    if (employeeIds && employeeIds.length > 0) {
      matchStage._id = { $in: employeeIds };
    }

    const employees = await EmployeesHub.find(matchStage)
      .select('employeeId firstName lastName department jobTitle startDate')
      .lean();

    const now = new Date();
    const serviceData = employees.map(emp => {
      const startDate = emp.startDate || emp.createdAt;
      const diffMs = now - new Date(startDate);
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);

      return {
        employeeId: emp.employeeId,
        fullName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department,
        jobTitle: emp.jobTitle,
        startDate: startDate,
        totalDays: diffDays,
        years: years,
        months: months,
        serviceYears: (diffDays / 365).toFixed(2)
      };
    });

    serviceData.sort((a, b) => b.totalDays - a.totalDays);

    res.json({
      success: true,
      data: {
        reportType: 'length-of-service',
        totalRecords: serviceData.length,
        records: serviceData
      }
    });
  } catch (error) {
    console.error('Error generating length of service report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Turnover & Retention Report
 */
exports.generateTurnoverReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get active employees at start
    const startCount = await EmployeesHub.countDocuments({
      createdAt: { $lte: start }
    });

    // Get active employees at end
    const endCount = await EmployeesHub.countDocuments({
      createdAt: { $lte: end }
    });

    // Get terminated employees in period
    const terminated = await ArchiveEmployee.find({
      terminatedDate: { $gte: start, $lte: end }
    }).lean();

    // Get new hires in period
    const newHires = await EmployeesHub.find({
      createdAt: { $gte: start, $lte: end }
    })
    .select('employeeId firstName lastName department jobTitle createdAt')
    .lean();

    // Calculate turnover rate
    const avgHeadcount = (startCount + endCount) / 2;
    const turnoverRate = avgHeadcount > 0 ? ((terminated.length / avgHeadcount) * 100).toFixed(2) : 0;

    // Group by department
    const byDepartment = {};
    terminated.forEach(emp => {
      const dept = emp.department || 'Unknown';
      if (!byDepartment[dept]) {
        byDepartment[dept] = { terminated: 0, employees: [] };
      }
      byDepartment[dept].terminated++;
      byDepartment[dept].employees.push(emp);
    });

    res.json({
      success: true,
      data: {
        reportType: 'turnover',
        dateRange: { startDate, endDate },
        summary: {
          startingHeadcount: startCount,
          endingHeadcount: endCount,
          newHires: newHires.length,
          terminations: terminated.length,
          turnoverRate: `${turnoverRate}%`
        },
        terminatedEmployees: terminated,
        newHires: newHires,
        byDepartment: byDepartment
      }
    });
  } catch (error) {
    console.error('Error generating turnover report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Working Status Report
 */
exports.generateWorkingStatusReport = async (req, res) => {
  try {
    const employees = await EmployeesHub.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          employees: {
            $push: {
              employeeId: '$employeeId',
              fullName: { $concat: ['$firstName', ' ', '$lastName'] },
              department: '$department',
              jobTitle: '$jobTitle'
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = await EmployeesHub.countDocuments();

    const statusData = employees.map(status => ({
      status: status._id || 'Unknown',
      count: status.count,
      percentage: ((status.count / total) * 100).toFixed(2),
      employees: status.employees
    }));

    res.json({
      success: true,
      data: {
        reportType: 'working-status',
        totalEmployees: total,
        records: statusData
      }
    });
  } catch (error) {
    console.error('Error generating working status report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Sensitive Information Report
 */
exports.generateSensitiveInfoReport = async (req, res) => {
  try {
    const { expiryWithinDays } = req.body;
    const daysAhead = expiryWithinDays || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiringSoon = await Certificate.find({
      expiryDate: { $lte: futureDate },
      approvalStatus: 'approved'
    })
    .populate('employee', 'employeeId firstName lastName department')
    .sort({ expiryDate: 1 })
    .lean();

    const formatted = expiringSoon.map(cert => {
      const daysUntilExpiry = Math.ceil((new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return {
        ...cert,
        employeeName: cert.employee ? `${cert.employee.firstName} ${cert.employee.lastName}` : 'N/A',
        employeeId: cert.employee?.employeeId || 'N/A',
        department: cert.employee?.department || 'N/A',
        daysUntilExpiry: daysUntilExpiry,
        status: daysUntilExpiry < 0 ? 'expired' : daysUntilExpiry <= 7 ? 'urgent' : 'warning'
      };
    });

    res.json({
      success: true,
      data: {
        reportType: 'sensitive-info',
        expiryThreshold: `${daysAhead} days`,
        totalRecords: formatted.length,
        records: formatted
      }
    });
  } catch (error) {
    console.error('Error generating sensitive info report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate Furloughed Employees Report
 */
exports.generateFurloughedReport = async (req, res) => {
  try {
    const furloughed = await EmployeesHub.find({
      furloughStatus: 'furloughed'
    })
    .select('employeeId firstName lastName department jobTitle furloughStartDate furloughEndDate')
    .lean();

    const formatted = furloughed.map(emp => ({
      employeeId: emp.employeeId,
      fullName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      jobTitle: emp.jobTitle,
      furloughStartDate: emp.furloughStartDate,
      furloughEndDate: emp.furloughEndDate,
      daysOnFurlough: emp.furloughStartDate 
        ? Math.ceil((new Date() - new Date(emp.furloughStartDate)) / (1000 * 60 * 60 * 24))
        : null
    }));

    res.json({
      success: true,
      data: {
        reportType: 'furloughed',
        totalRecords: formatted.length,
        records: formatted
      }
    });
  } catch (error) {
    console.error('Error generating furloughed report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Export Report as CSV
 */
exports.exportReportCSV = async (req, res) => {
  try {
    const { reportData } = req.body;

    if (!reportData || !reportData.records) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report data is required' 
      });
    }

    // Generate CSV
    const csv = exportReportToCSV(reportData);

    // Set headers for file download
    const filename = `${reportData.reportType}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Export Report as PDF
 */
exports.exportReportPDF = async (req, res) => {
  try {
    const { reportData } = req.body;

    if (!reportData || !reportData.records) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report data is required' 
      });
    }

    // Generate PDF buffer
    const pdfBuffer = await exportReportToPDF(reportData);

    // Set headers for file download
    const filename = `${reportData.reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
