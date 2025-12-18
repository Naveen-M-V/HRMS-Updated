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

module.exports = router;
