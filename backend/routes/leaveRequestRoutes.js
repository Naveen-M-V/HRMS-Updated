const express = require('express');
const router = express.Router();
const leaveRequestController = require('../controllers/leaveRequestController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Leave Request Routes
 * Handles leave request submission, approval, and retrieval
 */

// @route   POST /api/leave-requests
// @desc    Create a new leave request (employee)
// @access  Private (Employee)
router.post('/', authenticate, leaveRequestController.createLeaveRequest);

// @route   GET /api/leave-requests/my-requests
// @desc    Get current user's leave requests
// @access  Private (Employee)
router.get('/my-requests', authenticate, leaveRequestController.getMyLeaveRequests);

// @route   GET /api/leave-requests/pending
// @desc    Get pending leave requests for approval (admin/manager)
// @access  Private (Admin/Manager)
router.get('/pending', authenticate, authorize(['admin', 'hr', 'super-admin']), leaveRequestController.getPendingLeaveRequests);

// @route   GET /api/leave-requests/:id
// @desc    Get a specific leave request
// @access  Private
router.get('/:id', authenticate, leaveRequestController.getLeaveRequestById);

// @route   PATCH /api/leave-requests/:id/approve
// @desc    Approve a leave request
// @access  Private (Admin/Manager)
router.patch('/:id/approve', authenticate, authorize(['admin', 'hr', 'super-admin']), leaveRequestController.approveLeaveRequest);

// @route   PATCH /api/leave-requests/:id/reject
// @desc    Reject a leave request
// @access  Private (Admin/Manager)
router.patch('/:id/reject', authenticate, authorize(['admin', 'hr', 'super-admin']), leaveRequestController.rejectLeaveRequest);

// @route   PATCH /api/leave-requests/:id
// @desc    Update a leave request (draft)
// @access  Private (Employee)
router.patch('/:id', authenticate, leaveRequestController.updateLeaveRequest);

// @route   DELETE /api/leave-requests/:id
// @desc    Delete a leave request (draft only)
// @access  Private (Employee)
router.delete('/:id', authenticate, leaveRequestController.deleteLeaveRequest);

// @route   GET /api/leave-requests/employee/:employeeId/upcoming
// @desc    Get upcoming approved leaves for an employee
// @access  Private
router.get('/employee/:employeeId/upcoming', authenticate, leaveRequestController.getUpcomingLeaves);

module.exports = router;
