const LeaveRequest = require('../models/LeaveRequest');
const AnnualLeaveBalance = require('../models/AnnualLeaveBalance');
const EmployeeHub = require('../models/EmployeesHub');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

/**
 * Create a new leave request
 * @route POST /api/leave-requests
 */
exports.createLeaveRequest = async (req, res) => {
  try {
    const { approverId, leaveType, startDate, endDate, reason, status } = req.body;
    const employeeId = req.user.id || req.user._id;

    // Validation
    if (!approverId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: approverId, leaveType, startDate, endDate, reason'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create leave request for past dates'
      });
    }

    // Validate reason length
    if (reason.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason must be at least 10 characters long'
      });
    }

    // Check if approver exists and is a manager/admin
    const approver = await EmployeeHub.findById(approverId);
    if (!approver) {
      return res.status(404).json({
        success: false,
        message: 'Approver not found'
      });
    }

    // Check for overlapping leave requests
    const overlappingLeave = await LeaveRequest.findOne({
      employeeId,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You already have a leave request for this date range'
      });
    }

    // Create leave request
    const leaveRequest = new LeaveRequest({
      employeeId,
      approverId,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      status: status === 'Draft' ? 'Draft' : 'Pending'
    });

    await leaveRequest.save();

    // Populate references for response
    await leaveRequest.populate('employeeId', 'firstName lastName email');
    await leaveRequest.populate('approverId', 'firstName lastName email');

    // Create notifications for all admins and super admins if status is Pending
    if (leaveRequest.status === 'Pending') {
      const employee = await EmployeeHub.findById(employeeId);
      const User = require('../models/User');
      
      // Find all admin and super-admin users
      const admins = await User.find({
        role: { $in: ['admin', 'super-admin'] }
      }).select('_id');
      
      // Create notification for each admin
      const notifications = admins.map(admin => ({
        userId: admin._id,
        type: 'leave_request',
        title: 'New Leave Request',
        message: `${employee.firstName} ${employee.lastName} has submitted a leave request for ${leaveType} leave from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
        relatedId: leaveRequest._id,
        priority: 'high',
        read: false
      }));
      
      // Also notify the specific approver if they're not already in the admin list
      const adminIds = admins.map(a => a._id.toString());
      if (!adminIds.includes(approverId.toString())) {
        notifications.push({
          userId: approverId,
          type: 'leave_request',
          title: 'New Leave Request Assigned',
          message: `${employee.firstName} ${employee.lastName} has assigned you to approve their ${leaveType} leave request`,
          relatedId: leaveRequest._id,
          priority: 'high',
          read: false
        });
      }
      
      await Notification.insertMany(notifications);
      console.log(`✅ Created ${notifications.length} leave request notifications`);
    }

    res.status(201).json({
      success: true,
      message: leaveRequest.status === 'Draft' ? 'Leave request saved as draft' : 'Leave request submitted successfully',
      data: leaveRequest
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating leave request',
      error: error.message
    });
  }
};

/**
 * Get current user's leave requests
 * @route GET /api/leave-requests/my-requests
 */
exports.getMyLeaveRequests = async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;
    const { status } = req.query;

    let query = { employeeId };
    if (status) {
      query.status = status;
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate('approverId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: leaveRequests
    });
  } catch (error) {
    console.error('Get my leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests',
      error: error.message
    });
  }
};

/**
 * Get pending leave requests for approval
 * @route GET /api/leave-requests/pending
 */
exports.getPendingLeaveRequests = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const { leaveType, startDate, endDate } = req.query;

    let query = { status: 'Pending' };

    // If user is admin or super-admin, show ALL pending requests
    // Otherwise, only show requests assigned to them as approver
    if (userRole !== 'admin' && userRole !== 'super-admin') {
      query.approverId = userId;
    }

    if (leaveType) {
      query.leaveType = leaveType;
    }

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate('employeeId', 'firstName lastName email vtid department jobTitle')
      .populate('approverId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaveRequests.length,
      data: leaveRequests
    });
  } catch (error) {
    console.error('Get pending leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending leave requests',
      error: error.message
    });
  }
};

/**
 * Get a specific leave request
 * @route GET /api/leave-requests/:id
 */
exports.getLeaveRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request ID'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id)
      .populate('employeeId', 'firstName lastName email vtid department')
      .populate('approverId', 'firstName lastName email');

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    res.json({
      success: true,
      data: leaveRequest
    });
  } catch (error) {
    console.error('Get leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave request',
      error: error.message
    });
  }
};

/**
 * Approve a leave request
 * @route PATCH /api/leave-requests/:id/approve
 */
exports.approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request ID'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a ${leaveRequest.status} leave request`
      });
    }

    // Update leave request
    leaveRequest.status = 'Approved';
    leaveRequest.adminComment = adminComment || '';
    leaveRequest.approvedAt = new Date();
    await leaveRequest.save();

    // Create LeaveRecord for reporting purposes
    const LeaveRecord = require('../models/LeaveRecord');
    const leaveTypeMap = {
      'Sick': 'sick',
      'Casual': 'annual',
      'Paid': 'annual',
      'Unpaid': 'unpaid',
      'Maternity': 'annual',
      'Paternity': 'annual',
      'Bereavement': 'annual',
      'Other': 'annual'
    };
    
    await LeaveRecord.create({
      user: leaveRequest.employeeId,
      type: leaveTypeMap[leaveRequest.leaveType] || 'annual',
      status: 'approved',
      startDate: leaveRequest.startDate,
      endDate: leaveRequest.endDate,
      days: leaveRequest.numberOfDays,
      reason: leaveRequest.reason,
      approvedBy: req.user.id || req.user._id,
      approvedAt: new Date(),
      createdBy: req.user.id || req.user._id
    });

    // Update leave balance if applicable
    if (leaveRequest.leaveType !== 'Unpaid') {
      const leaveBalance = await AnnualLeaveBalance.findOne({
        user: leaveRequest.employeeId
      });

      if (leaveBalance) {
        leaveBalance.daysUsed = (leaveBalance.daysUsed || 0) + leaveRequest.numberOfDays;
        leaveBalance.daysRemaining = leaveBalance.totalDays - leaveBalance.daysUsed;
        await leaveBalance.save();
      }
    }

    // Create notification for employee
    const employee = await EmployeeHub.findById(leaveRequest.employeeId);
    await Notification.create({
      userId: leaveRequest.employeeId,
      type: 'leave_approved',
      title: 'Leave Request Approved',
      message: `Your ${leaveRequest.leaveType} leave request for ${leaveRequest.numberOfDays} day(s) has been approved`,
      relatedId: leaveRequest._id,
      read: false
    });

    await leaveRequest.populate('employeeId', 'firstName lastName email');
    await leaveRequest.populate('approverId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Leave request approved successfully',
      data: leaveRequest
    });
  } catch (error) {
    console.error('Approve leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving leave request',
      error: error.message
    });
  }
};

/**
 * Reject a leave request
 * @route PATCH /api/leave-requests/:id/reject
 */
exports.rejectLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request ID'
      });
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a ${leaveRequest.status} leave request`
      });
    }

    // Update leave request
    leaveRequest.status = 'Rejected';
    leaveRequest.rejectionReason = rejectionReason;
    leaveRequest.rejectedAt = new Date();
    await leaveRequest.save();

    // Create notification for employee
    await Notification.create({
      userId: leaveRequest.employeeId,
      type: 'leave_rejected',
      title: 'Leave Request Rejected',
      message: `Your ${leaveRequest.leaveType} leave request has been rejected`,
      relatedId: leaveRequest._id,
      read: false
    });

    await leaveRequest.populate('employeeId', 'firstName lastName email');
    await leaveRequest.populate('approverId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Leave request rejected successfully',
      data: leaveRequest
    });
  } catch (error) {
    console.error('Reject leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting leave request',
      error: error.message
    });
  }
};

/**
 * Update a leave request (draft only)
 * @route PATCH /api/leave-requests/:id
 */
exports.updateLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, leaveType, startDate, endDate, reason, status } = req.body;
    const employeeId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request ID'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Only allow updating draft requests
    if (leaveRequest.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only update draft leave requests'
      });
    }

    // Verify ownership
    if (leaveRequest.employeeId.toString() !== employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this leave request'
      });
    }

    // Update fields
    if (approverId) leaveRequest.approverId = approverId;
    if (leaveType) leaveRequest.leaveType = leaveType;
    if (startDate) leaveRequest.startDate = new Date(startDate);
    if (endDate) leaveRequest.endDate = new Date(endDate);
    if (reason) leaveRequest.reason = reason;
    if (status === 'Pending') leaveRequest.status = 'Pending';

    // Validate dates if changed
    if (leaveRequest.startDate > leaveRequest.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    await leaveRequest.save();
    await leaveRequest.populate('approverId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Leave request updated successfully',
      data: leaveRequest
    });
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave request',
      error: error.message
    });
  }
};

/**
 * Delete a leave request (draft only)
 * @route DELETE /api/leave-requests/:id
 */
exports.deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave request ID'
      });
    }

    const leaveRequest = await LeaveRequest.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Only allow deleting draft requests
    if (leaveRequest.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete draft leave requests'
      });
    }

    // Verify ownership
    if (leaveRequest.employeeId.toString() !== employeeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this leave request'
      });
    }

    await LeaveRequest.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    console.error('Delete leave request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting leave request',
      error: error.message
    });
  }
};

/**
 * Get upcoming approved leaves for an employee
 * @route GET /api/leave-requests/employee/:employeeId/upcoming
 */
exports.getUpcomingLeaves = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingLeaves = await LeaveRequest.find({
      employeeId,
      status: 'Approved',
      startDate: { $gte: today }
    })
      .populate('approverId', 'firstName lastName email')
      .sort({ startDate: 1 });

    res.json({
      success: true,
      data: upcomingLeaves
    });
  } catch (error) {
    console.error('Get upcoming leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming leaves',
      error: error.message
    });
  }
};
