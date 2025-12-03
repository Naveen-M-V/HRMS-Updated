const express = require('express');
const router = express.Router();
const AnnualLeaveBalance = require('../models/AnnualLeaveBalance');
const LeaveRecord = require('../models/LeaveRecord');
const EmployeesHub = require('../models/EmployeesHub');

/**
 * Leave Management Routes
 * Handles annual leave balances and leave records
 */

// @route   GET /api/leave/balances
// @desc    Get leave balances with optional filters
// @access  Private
router.get('/balances', async (req, res) => {
  try {
    const { userId, yearStart, current } = req.query;
    
    let query = {};
    
    // If userId provided, filter by user
    if (userId) {
      query.user = userId;
    }
    
    // If yearStart provided, filter by that year
    if (yearStart) {
      query.leaveYearStart = new Date(yearStart);
    }
    
    // If current=true, get current year balances only
    if (current === 'true') {
      const now = new Date();
      query.leaveYearStart = { $lte: now };
      query.leaveYearEnd = { $gte: now };
    }
    
    const balances = await AnnualLeaveBalance.find(query)
      .populate('user', 'firstName lastName email vtid department')
      .sort({ leaveYearStart: -1 });
    
    res.json({
      success: true,
      data: balances
    });
    
  } catch (error) {
    console.error('Get leave balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leave balances'
    });
  }
});

// @route   GET /api/leave/balances/current/:userId
// @desc    Get current leave balance for a specific user
// @access  Private
router.get('/balances/current/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const balance = await AnnualLeaveBalance.getCurrentBalance(userId);
    
    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'No leave balance found for current year'
      });
    }
    
    res.json({
      success: true,
      data: balance
    });
    
  } catch (error) {
    console.error('Get current balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching current balance'
    });
  }
});

// @route   POST /api/leave/balances
// @desc    Create or update leave balance
// @access  Private (Admin)
router.post('/balances', async (req, res) => {
  try {
    const { 
      userId, 
      leaveYearStart, 
      leaveYearEnd, 
      entitlementDays, 
      carryOverDays,
      notes
    } = req.body;
    
    if (!userId || !leaveYearStart || !leaveYearEnd || entitlementDays === undefined) {
      return res.status(400).json({
        success: false,
        message: 'userId, leaveYearStart, leaveYearEnd, and entitlementDays are required'
      });
    }
    
    // Check if employee exists in EmployeesHub
    const employee = await EmployeesHub.findById(userId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found. Leave balances are only for EmployeesHub employees.'
      });
    }
    
    // Upsert balance (update if exists, create if not)
    const balance = await AnnualLeaveBalance.findOneAndUpdate(
      { 
        user: userId, 
        leaveYearStart: new Date(leaveYearStart) 
      },
      {
        user: userId,
        leaveYearStart: new Date(leaveYearStart),
        leaveYearEnd: new Date(leaveYearEnd),
        entitlementDays,
        carryOverDays: carryOverDays || 0,
        notes
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    ).populate('user', 'firstName lastName email vtid');
    
    // Recalculate used days
    await AnnualLeaveBalance.recalculateUsedDays(
      userId,
      leaveYearStart,
      leaveYearEnd
    );
    
    // Fetch updated balance
    const updatedBalance = await AnnualLeaveBalance.findById(balance._id)
      .populate('user', 'firstName lastName email vtid');
    
    res.json({
      success: true,
      message: 'Leave balance saved successfully',
      data: updatedBalance
    });
    
  } catch (error) {
    console.error('Create/update balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving leave balance'
    });
  }
});

// @route   POST /api/leave/balances/upload
// @desc    Upload multiple leave balances from CSV
// @access  Private (Admin)
router.post('/balances/upload', async (req, res) => {
  try {
    const { balances, importBatchId } = req.body;
    
    if (!Array.isArray(balances) || balances.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'balances array is required'
      });
    }
    
    const results = {
      success: [],
      failed: [],
      total: balances.length
    };
    
    const batchId = importBatchId || `BATCH_${Date.now()}`;
    
    for (const item of balances) {
      try {
        const { identifier, leaveYearStart, leaveYearEnd, entitlementDays, carryOverDays } = item;
        
        // Find employee by email in EmployeesHub
        let employee;
        
        if (identifier.includes('@')) {
          employee = await EmployeesHub.findOne({ email: identifier.toLowerCase() });
        } else {
          results.failed.push({
            identifier,
            reason: 'Invalid identifier format (use email)'
          });
          continue;
        }
        
        if (!employee) {
          results.failed.push({
            identifier,
            reason: 'Employee not found in EmployeesHub'
          });
          continue;
        }
        
        // Create or update balance
        await AnnualLeaveBalance.findOneAndUpdate(
          { 
            user: employee._id, 
            leaveYearStart: new Date(leaveYearStart) 
          },
          {
            user: employee._id,
            leaveYearStart: new Date(leaveYearStart),
            leaveYearEnd: new Date(leaveYearEnd),
            entitlementDays: entitlementDays || 20,
            carryOverDays: carryOverDays || 0,
            importBatchId: batchId
          },
          { 
            new: true, 
            upsert: true,
            runValidators: true
          }
        );
        
        results.success.push(identifier);
        
      } catch (error) {
        results.failed.push({
          identifier: item.identifier,
          reason: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${results.total} records: ${results.success.length} succeeded, ${results.failed.length} failed`,
      data: results
    });
    
  } catch (error) {
    console.error('Upload balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading leave balances'
    });
  }
});

// @route   PUT /api/leave/balances/:id
// @desc    Update leave balance (adjustments, etc.)
// @access  Private (Admin)
router.put('/balances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { entitlementDays, carryOverDays, adjustment, notes } = req.body;
    
    const balance = await AnnualLeaveBalance.findById(id);
    
    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'Leave balance not found'
      });
    }
    
    // Update fields
    if (entitlementDays !== undefined) balance.entitlementDays = entitlementDays;
    if (carryOverDays !== undefined) balance.carryOverDays = carryOverDays;
    if (notes !== undefined) balance.notes = notes;
    
    // Add adjustment if provided
    if (adjustment && adjustment.days !== undefined && adjustment.reason) {
      balance.adjustments.push({
        days: adjustment.days,
        reason: adjustment.reason,
        adjustedBy: req.user.id,
        at: new Date()
      });
    }
    
    await balance.save();
    
    // Recalculate used days
    await AnnualLeaveBalance.recalculateUsedDays(
      balance.user,
      balance.leaveYearStart,
      balance.leaveYearEnd
    );
    
    const updatedBalance = await AnnualLeaveBalance.findById(id)
      .populate('user', 'firstName lastName email vtid');
    
    res.json({
      success: true,
      message: 'Leave balance updated successfully',
      data: updatedBalance
    });
    
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating leave balance'
    });
  }
});

// @route   GET /api/leave/balances/export
// @desc    Export leave balances to CSV
// @access  Private (Admin)
router.get('/balances/export', async (req, res) => {
  try {
    const balances = await AnnualLeaveBalance.find({})
      .populate('user', 'firstName lastName email vtid department')
      .sort({ leaveYearStart: -1 });
    
    // Generate CSV
    let csv = 'Employee Name,Email,VTID,Department,Leave Year Start,Leave Year End,Entitlement Days,Carry Over Days,Adjustments,Used Days,Remaining Days\n';
    
    balances.forEach(balance => {
      const employeeName = balance.user ? 
        `${balance.user.firstName} ${balance.user.lastName}` : 'Unknown';
      const email = balance.user?.email || '';
      const vtid = balance.user?.vtid || '';
      const department = balance.user?.department || '';
      const yearStart = balance.leaveYearStart.toLocaleDateString();
      const yearEnd = balance.leaveYearEnd.toLocaleDateString();
      const entitlement = balance.entitlementDays;
      const carryOver = balance.carryOverDays;
      const adjustments = balance.adjustments.reduce((sum, adj) => sum + adj.days, 0);
      const used = balance.usedDays;
      const remaining = balance.remainingDays;
      
      csv += `"${employeeName}",${email},${vtid},"${department}",${yearStart},${yearEnd},${entitlement},${carryOver},${adjustments},${used},${remaining}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leave-balances.csv"');
    res.send(csv);
    
  } catch (error) {
    console.error('Export balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting leave balances'
    });
  }
});

// @route   GET /api/leave/records
// @desc    Get leave records with optional filters
// @access  Private
router.get('/records', async (req, res) => {
  try {
    const { userId, startDate, endDate, type, status } = req.query;
    
    let query = {};
    
    if (userId) query.user = userId;
    if (type) query.type = type;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.$or = [
        { startDate: { $gte: startDate ? new Date(startDate) : new Date(0), $lte: endDate ? new Date(endDate) : new Date() } },
        { endDate: { $gte: startDate ? new Date(startDate) : new Date(0), $lte: endDate ? new Date(endDate) : new Date() } }
      ];
    }
    
    const records = await LeaveRecord.find(query)
      .populate('user', 'firstName lastName email vtid department')
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ startDate: -1 });
    
    res.json({
      success: true,
      data: records
    });
    
  } catch (error) {
    console.error('Get leave records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leave records'
    });
  }
});

// @route   POST /api/leave/records
// @desc    Create leave record
// @access  Private
router.post('/records', async (req, res) => {
  try {
    console.log('=== CREATE LEAVE RECORD REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Authenticated user:', req.user);
    
    const { userId, type, startDate, endDate, days, reason, status } = req.body;
    
    if (!userId || !startDate || !endDate || days === undefined) {
      console.error('Missing required fields:', { userId: !!userId, startDate: !!startDate, endDate: !!endDate, days });
      return res.status(400).json({
        success: false,
        message: 'userId, startDate, endDate, and days are required'
      });
    }
    
    // Check if employee exists in EmployeesHub
    const employee = await EmployeesHub.findById(userId);
    
    if (!employee) {
      console.error('Employee not found in EmployeesHub:', userId);
      return res.status(404).json({
        success: false,
        message: 'Employee not found. Leave records are only for EmployeesHub employees.'
      });
    }
    
    console.log('Creating leave record for:', employee.email || employee.firstName);
    
    const record = new LeaveRecord({
      user: userId,
      type: type || 'annual',
      status: status || 'approved',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      days,
      reason,
      createdBy: req.user?.id || null,
      approvedBy: status === 'approved' ? (req.user?.id || null) : null,
      approvedAt: status === 'approved' ? new Date() : null
    });
    
    await record.save();
    
    const populatedRecord = await LeaveRecord.findById(record._id)
      .populate('user', 'firstName lastName email vtid')
      .populate('createdBy', 'firstName lastName');
    
    res.json({
      success: true,
      message: 'Leave record created successfully',
      data: populatedRecord
    });
    
  } catch (error) {
    console.error('=== CREATE LEAVE RECORD ERROR ===');
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error creating leave record',
      error: error.message
    });
  }
});

// @route   PUT /api/leave/records/:id
// @desc    Update leave record
// @access  Private (Admin)
router.put('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, days, reason, startDate, endDate } = req.body;
    
    const record = await LeaveRecord.findById(id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Leave record not found'
      });
    }
    
    if (status !== undefined) {
      record.status = status;
      if (status === 'approved') {
        record.approvedBy = req.user.id;
        record.approvedAt = new Date();
      } else if (status === 'rejected') {
        record.rejectedBy = req.user.id;
        record.rejectedAt = new Date();
      }
    }
    
    if (days !== undefined) record.days = days;
    if (reason !== undefined) record.reason = reason;
    if (startDate) record.startDate = new Date(startDate);
    if (endDate) record.endDate = new Date(endDate);
    
    await record.save();
    
    const updatedRecord = await LeaveRecord.findById(id)
      .populate('user', 'firstName lastName email vtid')
      .populate('approvedBy', 'firstName lastName');
    
    res.json({
      success: true,
      message: 'Leave record updated successfully',
      data: updatedRecord
    });
    
  } catch (error) {
    console.error('Update leave record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating leave record'
    });
  }
});

// @route   DELETE /api/leave/records/:id
// @desc    Delete leave record
// @access  Private (Admin)
router.delete('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await LeaveRecord.findByIdAndDelete(id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Leave record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Leave record deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete leave record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting leave record'
    });
  }
});

// @route   GET /api/leave/user/current
// @desc    Get current user's current leave balance
// @access  Private (User)
router.get('/user/current', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const balance = await AnnualLeaveBalance.getCurrentBalance(userId);
    
    if (!balance) {
      return res.json({
        success: true,
        data: {
          entitlementDays: 0,
          carryOverDays: 0,
          usedDays: 0,
          remainingDays: 0,
          message: 'No leave balance configured'
        }
      });
    }
    
    res.json({
      success: true,
      data: balance
    });
    
  } catch (error) {
    console.error('Get user current balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leave balance'
    });
  }
});

// @route   GET /api/leave/user/next-leave
// @desc    Get current user's next upcoming approved leave
// @access  Private (User)
router.get('/user/next-leave', async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    const nextLeave = await LeaveRecord.findOne({
      user: userId,
      status: 'approved',
      startDate: { $gte: now }
    }).sort({ startDate: 1 });
    
    if (!nextLeave) {
      return res.json({
        success: true,
        data: null,
        message: 'No upcoming leave found'
      });
    }
    
    res.json({
      success: true,
      data: nextLeave
    });
    
  } catch (error) {
    console.error('Get next leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching next leave'
    });
  }
});

// ==================== LEAVE APPROVAL WORKFLOW ROUTES ====================
const leaveApprovalController = require('../controllers/leaveApprovalController');

// @route   POST /api/leave/requests/submit
// @desc    Submit a new leave request (pending approval)
// @access  Private
router.post('/requests/submit', leaveApprovalController.submitLeaveRequest);

// @route   POST /api/leave/requests/:leaveId/approve
// @desc    Approve a pending leave request
// @access  Private (Manager/Admin)
router.post('/requests/:leaveId/approve', leaveApprovalController.approveLeaveRequest);

// @route   POST /api/leave/requests/:leaveId/reject
// @desc    Reject a pending leave request
// @access  Private (Manager/Admin)
router.post('/requests/:leaveId/reject', leaveApprovalController.rejectLeaveRequest);

// @route   GET /api/leave/requests/pending
// @desc    Get all pending leave requests for a manager
// @access  Private (Manager/Admin)
router.get('/requests/pending', leaveApprovalController.getPendingLeaveRequests);

// @route   GET /api/leave/requests/employee/:employeeId
// @desc    Get all leave requests for a specific employee
// @access  Private
router.get('/requests/employee/:employeeId', leaveApprovalController.getEmployeeLeaveRequests);

// @route   GET /api/leave/overlaps
// @desc    Detect overlapping leave requests for team/department
// @access  Private (Manager/Admin)
router.get('/overlaps', leaveApprovalController.detectLeaveOverlaps);

module.exports = router;
