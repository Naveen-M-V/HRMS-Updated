const express = require('express');
const router = express.Router();
const unifiedLeaveController = require('../controllers/unifiedLeaveController');

/**
 * UNIFIED LEAVE MANAGEMENT ROUTES
 * All leave-related endpoints in one place
 */

// ==================== EMPLOYEE LEAVE REQUESTS ====================

// Create leave request from employee dashboard
router.post('/request', unifiedLeaveController.createLeaveRequest);

// Get employee's own leave requests
router.get('/my-requests', unifiedLeaveController.getMyLeaveRequests);

// ==================== ADMIN APPROVAL WORKFLOW ====================

// Get all pending leave requests for admin dashboard
router.get('/pending-requests', unifiedLeaveController.getPendingLeaveRequests);

// Approve leave request
router.patch('/approve/:id', unifiedLeaveController.approveLeaveRequest);

// Reject leave request
router.patch('/reject/:id', unifiedLeaveController.rejectLeaveRequest);

// ==================== ADMIN TIME OFF CREATION ====================

// Admin creates time off for employee (from calendar "+ Time Off" button)
router.post('/admin/time-off', unifiedLeaveController.createTimeOff);

// ==================== EMPLOYEE HUB ABSENCE SECTION ====================

// Add annual leave for employee (from EmployeeHub Absence section)
router.post('/employee-hub/annual-leave', unifiedLeaveController.addAnnualLeave);

// Add sickness record
router.post('/employee-hub/sickness', unifiedLeaveController.addSickness);

// Add lateness record
router.post('/employee-hub/lateness', unifiedLeaveController.addLateness);

// Update carry over days
router.patch('/employee-hub/carry-over', unifiedLeaveController.updateCarryOver);

// Get recent absences for employee
router.get('/employee-hub/absences/:employeeId', unifiedLeaveController.getRecentAbsences);

// ==================== CALENDAR DATA ====================

// Get approved leaves for calendar display
router.get('/calendar', unifiedLeaveController.getCalendarLeaves);

// Detect overlapping leaves for team/department
router.get('/overlaps', unifiedLeaveController.detectLeaveOverlaps);

// ==================== LEAVE BALANCE ENDPOINTS ====================

// Import required models
const AnnualLeaveBalance = require('../models/AnnualLeaveBalance');
const EmployeesHub = require('../models/EmployeesHub');

// Get leave balances with optional filters
router.get('/balances', async (req, res) => {
  try {
    const { userId, yearStart, current } = req.query;
    
    let query = {};
    
    if (userId) {
      query.user = userId;
    }
    
    if (yearStart) {
      query.leaveYearStart = new Date(yearStart);
    }
    
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

// Get current leave balance for a specific user
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

// Get current user's leave balance
router.get('/user/current', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.session?.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
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

// Update leave balance by ID (for carryover, adjustments, etc.)
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
      const adminId = req.user?.id || req.user?._id;
      balance.adjustments.push({
        days: adjustment.days,
        reason: adjustment.reason,
        adjustedBy: adminId,
        at: new Date()
      });
    }
    
    await balance.save();
    
    // Recalculate used days if method exists
    if (AnnualLeaveBalance.recalculateUsedDays) {
      await AnnualLeaveBalance.recalculateUsedDays(
        balance.user,
        balance.leaveYearStart,
        balance.leaveYearEnd
      );
    }
    
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

// Admin: Update employee annual leave balance
router.put('/admin/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { entitlementDays, carryOverDays, reason } = req.body;
    const adminId = req.session?.user?._id || req.user?.id || req.user?._id;

    if (!adminId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const now = new Date();
    let balance = await AnnualLeaveBalance.findOne({
      user: userId,
      leaveYearStart: { $lte: now },
      leaveYearEnd: { $gte: now }
    });

    if (!balance) {
      const currentYear = now.getFullYear();
      const month = now.getMonth();
      const leaveYearStart = month >= 3 ? new Date(currentYear, 3, 1) : new Date(currentYear - 1, 3, 1);
      const leaveYearEnd = month >= 3 ? new Date(currentYear + 1, 2, 31) : new Date(currentYear, 2, 31);

      balance = new AnnualLeaveBalance({
        user: userId,
        leaveYearStart,
        leaveYearEnd,
        entitlementDays: entitlementDays || 28,
        carryOverDays: carryOverDays || 0,
        usedDays: 0
      });
    } else {
      const oldEntitlement = balance.entitlementDays;
      
      if (entitlementDays !== undefined && entitlementDays !== oldEntitlement) {
        balance.entitlementDays = entitlementDays;
        
        if (reason) {
          balance.adjustments.push({
            days: entitlementDays - oldEntitlement,
            reason: reason,
            adjustedBy: adminId,
            at: new Date()
          });
        }
      }
      
      if (carryOverDays !== undefined) {
        balance.carryOverDays = carryOverDays;
      }
    }

    await balance.save();
    await balance.populate('user', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Leave balance updated successfully',
      data: balance
    });
  } catch (error) {
    console.error('Error updating leave balance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update leave balance', 
      error: error.message 
    });
  }
});

module.exports = router;
