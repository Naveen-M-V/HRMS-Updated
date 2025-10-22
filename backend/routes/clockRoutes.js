const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const User = require('../models/User');

/**
 * Clock Routes
 * Handles time tracking and attendance functionality
 */

// @route   POST /api/clock/in
// @desc    Clock in an employee
// @access  Private (Admin)
router.post('/in', async (req, res) => {
  try {
    const { employeeId, location, workType } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if employee is already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingEntry = await TimeEntry.findOne({
      employee: employeeId,
      date: { $gte: today },
      status: { $in: ['clocked_in', 'on_break'] }
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Employee is already clocked in today'
      });
    }

    // Create new time entry
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
    
    const timeEntry = new TimeEntry({
      employee: employeeId,
      date: new Date(),
      clockIn: currentTime,
      location: location || 'Office - Main',
      workType: workType || 'Regular Shift',
      status: 'clocked_in',
      createdBy: req.user.id
    });

    await timeEntry.save();

    res.json({
      success: true,
      message: 'Employee clocked in successfully',
      data: timeEntry
    });

  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during clock in'
    });
  }
});

// @route   POST /api/clock/out
// @desc    Clock out an employee
// @access  Private (Admin)
router.post('/out', async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Find today's active time entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeEntry = await TimeEntry.findOne({
      employee: employeeId,
      date: { $gte: today },
      status: { $in: ['clocked_in', 'on_break'] }
    });

    if (!timeEntry) {
      return res.status(400).json({
        success: false,
        message: 'No active clock-in found for today'
      });
    }

    // Update clock out time
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
    timeEntry.clockOut = currentTime;
    timeEntry.status = 'clocked_out';
    
    await timeEntry.save();

    res.json({
      success: true,
      message: 'Employee clocked out successfully',
      data: timeEntry
    });

  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during clock out'
    });
  }
});

// @route   GET /api/clock/status
// @desc    Get current clock status for all employees
// @access  Private (Admin)
router.get('/status', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all employees
    const employees = await User.find({ role: { $ne: 'admin' } })
      .select('firstName lastName email department vtid')
      .lean();

    // Get today's time entries
    const timeEntries = await TimeEntry.find({
      date: { $gte: today }
    }).populate('employee', 'firstName lastName email department vtid');

    // Create status map
    const statusMap = {};
    timeEntries.forEach(entry => {
      if (entry.employee) {
        statusMap[entry.employee._id.toString()] = {
          status: entry.status,
          clockIn: entry.clockIn,
          clockOut: entry.clockOut,
          location: entry.location
        };
      }
    });

    // Build response with all employees and their status
    const employeeStatus = employees.map(employee => {
      const status = statusMap[employee._id.toString()];
      return {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        department: employee.department,
        vtid: employee.vtid,
        status: status?.status || 'absent',
        clockIn: status?.clockIn || null,
        clockOut: status?.clockOut || null,
        location: status?.location || null
      };
    });

    res.json({
      success: true,
      data: employeeStatus
    });

  } catch (error) {
    console.error('Get clock status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching clock status'
    });
  }
});

// @route   GET /api/clock/entries
// @desc    Get time entries with optional filters
// @access  Private (Admin)
router.get('/entries', async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    let query = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    
    // Employee filter
    if (employeeId) {
      query.employee = employeeId;
    }

    const timeEntries = await TimeEntry.find(query)
      .populate('employee', 'firstName lastName email department vtid')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1, clockIn: -1 });

    res.json({
      success: true,
      data: timeEntries
    });

  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching time entries'
    });
  }
});

// @route   POST /api/clock/entry
// @desc    Add manual time entry
// @access  Private (Admin)
router.post('/entry', async (req, res) => {
  try {
    const { employeeId, location, workType, clockIn, clockOut, breaks } = req.body;

    if (!employeeId || !clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and clock in time are required'
      });
    }

    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Parse date and time from clockIn
    const clockInDate = new Date(clockIn);
    const clockInTime = clockInDate.toTimeString().slice(0, 5);
    
    let clockOutTime = null;
    if (clockOut) {
      const clockOutDate = new Date(clockOut);
      clockOutTime = clockOutDate.toTimeString().slice(0, 5);
    }

    // Process breaks
    const processedBreaks = (breaks || []).map(breakItem => ({
      startTime: breakItem.startTime || '12:00',
      endTime: breakItem.endTime || '12:30',
      duration: breakItem.duration || 30,
      type: breakItem.type || 'other'
    }));

    const timeEntry = new TimeEntry({
      employee: employeeId,
      date: clockInDate,
      clockIn: clockInTime,
      clockOut: clockOutTime,
      location: location || 'Office - Main',
      workType: workType || 'Regular Shift',
      breaks: processedBreaks,
      status: clockOutTime ? 'clocked_out' : 'clocked_in',
      isManualEntry: true,
      createdBy: req.user.id
    });

    await timeEntry.save();

    res.json({
      success: true,
      message: 'Time entry added successfully',
      data: timeEntry
    });

  } catch (error) {
    console.error('Add time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding time entry'
    });
  }
});

// @route   PUT /api/clock/entry/:id
// @desc    Update time entry
// @access  Private (Admin)
router.put('/entry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const timeEntry = await TimeEntry.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).populate('employee', 'firstName lastName email department');

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Time entry updated successfully',
      data: timeEntry
    });

  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating time entry'
    });
  }
});

// @route   DELETE /api/clock/entry/:id
// @desc    Delete time entry
// @access  Private (Admin)
router.delete('/entry/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const timeEntry = await TimeEntry.findByIdAndDelete(id);

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Time entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting time entry'
    });
  }
});

// @route   POST /api/clock/entry/:id/break
// @desc    Add break to time entry
// @access  Private (Admin)
router.post('/entry/:id/break', async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, duration, type } = req.body;

    const timeEntry = await TimeEntry.findById(id);

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    const newBreak = {
      startTime: startTime || '12:00',
      endTime: endTime || '12:30',
      duration: duration || 30,
      type: type || 'other'
    };

    timeEntry.breaks.push(newBreak);
    await timeEntry.save();

    res.json({
      success: true,
      message: 'Break added successfully',
      data: timeEntry
    });

  } catch (error) {
    console.error('Add break error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding break'
    });
  }
});

// @route   GET /api/clock/export
// @desc    Export time entries to CSV
// @access  Private (Admin)
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const timeEntries = await TimeEntry.find(query)
      .populate('employee', 'firstName lastName email department vtid')
      .sort({ date: -1 });

    // Generate CSV
    let csv = 'Date,Employee Name,VTID,Clock In,Clock Out,Total Hours,Breaks,Location\n';
    
    timeEntries.forEach(entry => {
      const employeeName = entry.employee ? 
        `${entry.employee.firstName} ${entry.employee.lastName}` : 'Unknown';
      const vtid = entry.employee?.vtid || '';
      const date = entry.date.toLocaleDateString();
      const clockIn = entry.clockIn || '';
      const clockOut = entry.clockOut || '';
      const totalHours = entry.totalHours.toFixed(2);
      const breakTime = entry.breaks.reduce((total, b) => total + b.duration, 0);
      const breakHours = (breakTime / 60).toFixed(2);
      const location = entry.location || '';
      
      csv += `${date},"${employeeName}",${vtid},${clockIn},${clockOut},${totalHours},${breakHours},"${location}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="time-entries-${startDate}-to-${endDate}.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Export time entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting time entries'
    });
  }
});

// User-specific routes (employees can only manage their own time)

// @route   GET /api/clock/user/status
// @desc    Get current user's clock status
// @access  Private (User)
router.get('/user/status', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeEntry = await TimeEntry.findOne({
      employee: userId,
      date: { $gte: today },
      status: { $in: ['clocked_in', 'clocked_out', 'on_break'] }
    }).populate('employee', 'firstName lastName email vtid');

    if (!timeEntry) {
      return res.json({
        success: true,
        data: {
          status: 'not_clocked_in',
          clockIn: null,
          clockOut: null,
          location: null,
          workType: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        status: timeEntry.status,
        clockIn: timeEntry.clockIn,
        clockOut: timeEntry.clockOut,
        location: timeEntry.location,
        workType: timeEntry.workType,
        breaks: timeEntry.breaks
      }
    });

  } catch (error) {
    console.error('Get user clock status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching clock status'
    });
  }
});

// @route   POST /api/clock/user/in
// @desc    Clock in current user
// @access  Private (User)
router.post('/user/in', async (req, res) => {
  try {
    const userId = req.user.id;
    const { workType, location } = req.body;

    // Check if user is already clocked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingEntry = await TimeEntry.findOne({
      employee: userId,
      date: { $gte: today },
      status: { $in: ['clocked_in', 'on_break'] }
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'You are already clocked in today'
      });
    }

    // Create new time entry
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
    
    const timeEntry = new TimeEntry({
      employee: userId,
      date: new Date(),
      clockIn: currentTime,
      location: location || 'Work From Office',
      workType: workType || 'Regular',
      status: 'clocked_in',
      createdBy: userId
    });

    await timeEntry.save();

    res.json({
      success: true,
      message: 'Clocked in successfully',
      data: timeEntry
    });

  } catch (error) {
    console.error('User clock in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during clock in'
    });
  }
});

// @route   POST /api/clock/user/out
// @desc    Clock out current user
// @access  Private (User)
router.post('/user/out', async (req, res) => {
  try {
    const userId = req.user.id;

    // Find today's active time entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeEntry = await TimeEntry.findOne({
      employee: userId,
      date: { $gte: today },
      status: { $in: ['clocked_in', 'on_break'] }
    });

    if (!timeEntry) {
      return res.status(400).json({
        success: false,
        message: 'No active clock-in found for today'
      });
    }

    // Update clock out time
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
    timeEntry.clockOut = currentTime;
    timeEntry.status = 'clocked_out';
    
    await timeEntry.save();

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: timeEntry
    });

  } catch (error) {
    console.error('User clock out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during clock out'
    });
  }
});

// @route   POST /api/clock/user/break
// @desc    Add break for current user
// @access  Private (User)
router.post('/user/break', async (req, res) => {
  try {
    const userId = req.user.id;
    const { duration = 30, type = 'other' } = req.body;

    // Find today's active time entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeEntry = await TimeEntry.findOne({
      employee: userId,
      date: { $gte: today },
      status: 'clocked_in'
    });

    if (!timeEntry) {
      return res.status(400).json({
        success: false,
        message: 'You must be clocked in to add a break'
      });
    }

    // Add break
    const currentTime = new Date().toTimeString().slice(0, 5);
    const breakEndTime = new Date();
    breakEndTime.setMinutes(breakEndTime.getMinutes() + duration);
    const endTime = breakEndTime.toTimeString().slice(0, 5);

    const newBreak = {
      startTime: currentTime,
      endTime: endTime,
      duration: duration,
      type: type
    };

    timeEntry.breaks.push(newBreak);
    timeEntry.status = 'on_break';
    await timeEntry.save();

    res.json({
      success: true,
      message: 'Break added successfully',
      data: timeEntry
    });

  } catch (error) {
    console.error('Add user break error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding break'
    });
  }
});

// @route   GET /api/clock/user/entries
// @desc    Get current user's time entries
// @access  Private (User)
router.get('/user/entries', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    let query = { employee: userId };
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const timeEntries = await TimeEntry.find(query)
      .populate('employee', 'firstName lastName email vtid')
      .sort({ date: -1, clockIn: -1 })
      .limit(50); // Limit to recent entries

    res.json({
      success: true,
      data: timeEntries
    });

  } catch (error) {
    console.error('Get user time entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching time entries'
    });
  }
});

module.exports = router;
