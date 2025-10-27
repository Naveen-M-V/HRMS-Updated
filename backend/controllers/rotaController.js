const Rota = require('../models/Rota');
const Shift = require('../models/Shift');
const ShiftAssignment = require('../models/ShiftAssignment');
const User = require('../models/User');
const TimeEntry = require('../models/TimeEntry');

const nextDay = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
};

const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
};

exports.detectShiftConflicts = async (employeeId, startTime, endTime, date, excludeShiftId = null) => {
  try {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const query = {
      employeeId,
      date: { $gte: dateStart, $lte: dateEnd },
      status: { $nin: ['Cancelled', 'Swapped'] }
    };

    if (excludeShiftId) {
      query._id = { $ne: excludeShiftId };
    }

    const existingShifts = await ShiftAssignment.find(query);

    const conflicts = existingShifts.filter(shift => {
      const shiftStart = shift.startTime;
      const shiftEnd = shift.endTime;
      return (
        (startTime >= shiftStart && startTime < shiftEnd) ||
        (endTime > shiftStart && endTime <= shiftEnd) ||
        (startTime <= shiftStart && endTime >= shiftEnd)
      );
    });

    return conflicts;
  } catch (error) {
    console.error('Detect conflicts error:', error);
    throw error;
  }
};

exports.assignShiftToEmployee = async (req, res) => {
  try {
    console.log('=== Assign Shift Request ===');
    console.log('User from session:', req.user);
    console.log('Session ID:', req.session?.id);
    
    const { employeeId, date, startTime, endTime, location, workType, breakDuration, notes } = req.body;

    if (!employeeId || !date || !startTime || !endTime || !location || !workType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employeeId, date, startTime, endTime, location, workType'
      });
    }

    const assignedByUserId = req.user._id || req.user.userId;
    
    if (!req.user || !assignedByUserId) {
      console.error('Authentication failed - req.user:', req.user);
      return res.status(401).json({
        success: false,
        message: 'Authentication required. User not found in session.',
        debug: {
          hasUser: !!req.user,
          hasSession: !!req.session,
          sessionUser: req.session?.user
        }
      });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const conflicts = await exports.detectShiftConflicts(employeeId, startTime, endTime, date);
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Shift conflict detected',
        conflicts: conflicts.map(c => ({
          id: c._id,
          startTime: c.startTime,
          endTime: c.endTime,
          location: c.location
        }))
      });
    }

    const shiftAssignment = new ShiftAssignment({
      employeeId,
      date: new Date(date),
      startTime,
      endTime,
      location,
      workType,
      breakDuration: breakDuration || 0,
      assignedBy: assignedByUserId,
      notes: notes || '',
      status: 'Scheduled'
    });

    await shiftAssignment.save();

    const populatedShift = await ShiftAssignment.findById(shiftAssignment._id)
      .populate('employeeId', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Shift assigned successfully',
      data: populatedShift
    });

  } catch (error) {
    console.error('Assign shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign shift',
      error: error.message
    });
  }
};

exports.bulkCreateShifts = async (req, res) => {
  try {
    const { shifts } = req.body;

    if (!shifts || !Array.isArray(shifts) || shifts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Shifts array is required'
      });
    }

    const assignedByUserId = req.user._id || req.user.userId;
    if (!assignedByUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const shift of shifts) {
      try {
        const { employeeId, date, startTime, endTime, location, workType, breakDuration, notes } = shift;

        const employee = await User.findById(employeeId);
        if (!employee) {
          results.failed.push({
            shift,
            reason: 'Employee not found'
          });
          continue;
        }

        const conflicts = await exports.detectShiftConflicts(employeeId, startTime, endTime, date);
        if (conflicts.length > 0) {
          results.failed.push({
            shift,
            reason: 'Shift conflict detected'
          });
          continue;
        }

        const shiftAssignment = new ShiftAssignment({
          employeeId,
          date: new Date(date),
          startTime,
          endTime,
          location,
          workType,
          breakDuration: breakDuration || 0,
          assignedBy: assignedByUserId,
          notes: notes || '',
          status: 'Scheduled'
        });

        await shiftAssignment.save();
        results.successful.push(shiftAssignment._id);

      } catch (error) {
        results.failed.push({
          shift,
          reason: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk creation completed. ${results.successful.length} successful, ${results.failed.length} failed`,
      data: results
    });

  } catch (error) {
    console.error('Bulk create shifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create shifts',
      error: error.message
    });
  }
};

exports.requestShiftSwap = async (req, res) => {
  try {
    const { shiftId, swapWithEmployeeId, reason } = req.body;

    if (!shiftId || !swapWithEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Shift ID and swap target employee ID are required'
      });
    }

    const shift = await ShiftAssignment.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    if (shift.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only request swap for your own shifts'
      });
    }

    if (shift.swapRequest.status === 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'A swap request is already pending for this shift'
      });
    }

    const targetEmployee = await User.findById(swapWithEmployeeId);
    if (!targetEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Target employee not found'
      });
    }

    shift.swapRequest = {
      requestedBy: req.user._id,
      requestedWith: swapWithEmployeeId,
      status: 'Pending',
      reason: reason || '',
      requestedAt: new Date()
    };

    await shift.save();

    const populatedShift = await ShiftAssignment.findById(shift._id)
      .populate('employeeId', 'firstName lastName email')
      .populate('swapRequest.requestedWith', 'firstName lastName email');

    res.status(200).json({
      success: true,
      message: 'Shift swap request submitted',
      data: populatedShift
    });

  } catch (error) {
    console.error('Request shift swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request shift swap',
      error: error.message
    });
  }
};

exports.approveShiftSwap = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved or Rejected'
      });
    }

    const shift = await ShiftAssignment.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    if (shift.swapRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending swap request for this shift'
      });
    }

    if (status === 'Approved') {
      const originalEmployeeId = shift.employeeId;
      const swapEmployeeId = shift.swapRequest.requestedWith;

      shift.employeeId = swapEmployeeId;
      shift.status = 'Swapped';
      shift.swapRequest.status = 'Approved';
      shift.swapRequest.reviewedBy = req.user._id;
      shift.swapRequest.reviewedAt = new Date();
    } else {
      shift.swapRequest.status = 'Rejected';
      shift.swapRequest.reviewedBy = req.user._id;
      shift.swapRequest.reviewedAt = new Date();
    }

    await shift.save();

    const populatedShift = await ShiftAssignment.findById(shift._id)
      .populate('employeeId', 'firstName lastName email')
      .populate('swapRequest.requestedBy', 'firstName lastName')
      .populate('swapRequest.requestedWith', 'firstName lastName')
      .populate('swapRequest.reviewedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: `Shift swap ${status.toLowerCase()}`,
      data: populatedShift
    });

  } catch (error) {
    console.error('Approve shift swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process shift swap',
      error: error.message
    });
  }
};

exports.getShiftsByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    const { startDate, endDate } = req.query;

    const query = { location };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const shifts = await ShiftAssignment.find(query)
      .populate('employeeId', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: shifts.length,
      data: shifts
    });

  } catch (error) {
    console.error('Get shifts by location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shifts by location',
      error: error.message
    });
  }
};

exports.getShiftStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const shifts = await ShiftAssignment.find(query);

    const stats = {
      totalShifts: shifts.length,
      byLocation: {
        Office: shifts.filter(s => s.location === 'Office').length,
        Home: shifts.filter(s => s.location === 'Home').length,
        Field: shifts.filter(s => s.location === 'Field').length,
        'Client Site': shifts.filter(s => s.location === 'Client Site').length
      },
      byWorkType: {
        Regular: shifts.filter(s => s.workType === 'Regular').length,
        Overtime: shifts.filter(s => s.workType === 'Overtime').length,
        'Weekend overtime': shifts.filter(s => s.workType === 'Weekend overtime').length,
        'Client side overtime': shifts.filter(s => s.workType === 'Client side overtime').length
      },
      byStatus: {
        Scheduled: shifts.filter(s => s.status === 'Scheduled').length,
        Completed: shifts.filter(s => s.status === 'Completed').length,
        Missed: shifts.filter(s => s.status === 'Missed').length,
        Swapped: shifts.filter(s => s.status === 'Swapped').length,
        Cancelled: shifts.filter(s => s.status === 'Cancelled').length
      },
      totalHours: shifts.reduce((acc, shift) => {
        const start = new Date(`2000-01-01T${shift.startTime}`);
        const end = new Date(`2000-01-01T${shift.endTime}`);
        const hours = (end - start) / (1000 * 60 * 60);
        return acc + hours - (shift.breakDuration / 60);
      }, 0).toFixed(2),
      uniqueEmployees: new Set(shifts.map(s => s.employeeId.toString())).size
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get shift statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift statistics',
      error: error.message
    });
  }
};

exports.getAllShiftAssignments = async (req, res) => {
  try {
    const { startDate, endDate, employeeId, location, workType, status } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (employeeId) query.employeeId = employeeId;
    if (location) query.location = location;
    if (workType) query.workType = workType;
    if (status) query.status = status;

    const shifts = await ShiftAssignment.find(query)
      .populate('employeeId', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: shifts.length,
      data: shifts
    });

  } catch (error) {
    console.error('Get all shift assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shift assignments',
      error: error.message
    });
  }
};

exports.getEmployeeShifts = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { employeeId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const shifts = await ShiftAssignment.find(query)
      .populate('assignedBy', 'firstName lastName')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: shifts.length,
      data: shifts
    });

  } catch (error) {
    console.error('Get employee shifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee shifts',
      error: error.message
    });
  }
};

exports.updateShiftAssignment = async (req, res) => {
  try {
    const { shiftId } = req.params;
    const { date, startTime, endTime, location, workType, breakDuration, status, notes } = req.body;

    const shift = await ShiftAssignment.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    if (startTime && endTime && date) {
      const conflicts = await exports.detectShiftConflicts(
        shift.employeeId,
        startTime,
        endTime,
        date,
        shiftId
      );
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Shift conflict detected',
          conflicts
        });
      }
    }

    if (date) shift.date = new Date(date);
    if (startTime) shift.startTime = startTime;
    if (endTime) shift.endTime = endTime;
    if (location) shift.location = location;
    if (workType) shift.workType = workType;
    if (breakDuration !== undefined) shift.breakDuration = breakDuration;
    if (status) shift.status = status;
    if (notes !== undefined) shift.notes = notes;

    await shift.save();

    const populatedShift = await ShiftAssignment.findById(shift._id)
      .populate('employeeId', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Shift updated successfully',
      data: populatedShift
    });

  } catch (error) {
    console.error('Update shift assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shift',
      error: error.message
    });
  }
};

exports.deleteShiftAssignment = async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shift = await ShiftAssignment.findByIdAndDelete(shiftId);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Shift deleted successfully'
    });

  } catch (error) {
    console.error('Delete shift assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shift',
      error: error.message
    });
  }
};

exports.generateRota = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    const employees = await User.find({ isActive: true });
    const shifts = await Shift.find().sort({ name: 1 });

    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active employees found'
      });
    }

    if (shifts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No shifts found. Please create shifts first.'
      });
    }

    await Rota.deleteMany({
      date: { $gte: start, $lte: end }
    });

    let shiftIndex = 0;
    const rotaEntries = [];

    for (let date = new Date(start); date <= end; date = nextDay(date)) {
      if (isWeekend(date)) continue;

      for (const emp of employees) {
        const shift = shifts[shiftIndex % shifts.length];
        
        rotaEntries.push({
          employee: emp._id,
          shift: shift._id,
          date: new Date(date),
          status: 'Assigned'
        });

        shiftIndex++;
      }
    }

    await Rota.insertMany(rotaEntries);

    res.status(201).json({
      success: true,
      message: `Rota generated successfully for ${rotaEntries.length} assignments`,
      count: rotaEntries.length
    });

  } catch (error) {
    console.error('Generate Rota Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate rota',
      error: error.message
    });
  }
};

exports.getEmployeeRota = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const query = { employee: employeeId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const rotas = await Rota.find(query)
      .populate('shift', 'name startTime endTime color')
      .populate('employee', 'firstName lastName email')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: rotas.length,
      data: rotas
    });

  } catch (error) {
    console.error('Get Employee Rota Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee rota',
      error: error.message
    });
  }
};

exports.getAllRota = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const rotas = await Rota.find(query)
      .populate('employee', 'firstName lastName email')
      .populate('shift', 'name startTime endTime color')
      .sort({ date: 1, employee: 1 });

    res.status(200).json({
      success: true,
      count: rotas.length,
      data: rotas
    });

  } catch (error) {
    console.error('Get All Rota Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rota',
      error: error.message
    });
  }
};

exports.updateRota = async (req, res) => {
  try {
    const { rotaId } = req.params;
    const { shift, status, notes } = req.body;

    const updateData = {};
    if (shift) updateData.shift = shift;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const rota = await Rota.findByIdAndUpdate(
      rotaId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('employee', 'firstName lastName email')
      .populate('shift', 'name startTime endTime color');

    if (!rota) {
      return res.status(404).json({
        success: false,
        message: 'Rota entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rota updated successfully',
      data: rota
    });

  } catch (error) {
    console.error('Update Rota Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rota',
      error: error.message
    });
  }
};

exports.deleteRota = async (req, res) => {
  try {
    const { rotaId } = req.params;

    const rota = await Rota.findByIdAndDelete(rotaId);

    if (!rota) {
      return res.status(404).json({
        success: false,
        message: 'Rota entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rota entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete Rota Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rota',
      error: error.message
    });
  }
};

exports.initializeShifts = async (req, res) => {
  try {
    const existingShifts = await Shift.countDocuments();

    if (existingShifts > 0) {
      return res.status(200).json({
        success: true,
        message: 'Shifts already initialized',
        count: existingShifts
      });
    }

    const defaultShifts = [
      { name: 'Morning', startTime: '09:00', endTime: '17:00', color: '#3b82f6' },
      { name: 'Evening', startTime: '17:00', endTime: '01:00', color: '#f59e0b' },
      { name: 'Night', startTime: '01:00', endTime: '09:00', color: '#8b5cf6' }
    ];

    await Shift.insertMany(defaultShifts);

    res.status(201).json({
      success: true,
      message: 'Default shifts created successfully',
      count: defaultShifts.length
    });

  } catch (error) {
    console.error('Initialize Shifts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize shifts',
      error: error.message
    });
  }
};
