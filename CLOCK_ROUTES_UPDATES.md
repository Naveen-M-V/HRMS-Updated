# Clock Routes Updates - Add to clockRoutes.js

Add this import at the top of the file:

```javascript
const {
  findMatchingShift,
  validateClockIn,
  calculateHoursWorked,
  calculateScheduledHours,
  updateShiftStatus,
  linkTimeEntryToShift
} = require('../utils/shiftTimeLinker');
```

## Replace the POST /api/clock/in endpoint with:

```javascript
// @route   POST /api/clock/in
// @desc    Clock in an employee (with shift linking)
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

    // Get current time
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
    const createdByUserId = req.user._id || req.user.userId || req.user.id;
    
    // Find matching shift
    const shift = await findMatchingShift(employeeId, new Date(), location);
    
    let timeEntryData = {
      employee: employeeId,
      date: new Date(),
      clockIn: currentTime,
      location: location || 'Work From Office',
      workType: workType || 'Regular',
      status: 'clocked_in',
      createdBy: createdByUserId
    };
    
    let attendanceStatus = 'Unscheduled';
    let validationResult = null;
    
    if (shift) {
      // Validate clock-in time
      validationResult = validateClockIn(currentTime, shift);
      attendanceStatus = validationResult.status;
      
      // Add shift reference
      timeEntryData.shiftId = shift._id;
      timeEntryData.attendanceStatus = attendanceStatus;
      timeEntryData.scheduledHours = calculateScheduledHours(shift);
      
      if (shift._locationMismatch) {
        timeEntryData.notes = `Location mismatch: Clocked in at ${location}, scheduled at ${shift.location}`;
      }
    } else {
      // No shift found - unscheduled entry
      timeEntryData.attendanceStatus = 'Unscheduled';
      timeEntryData.notes = 'No scheduled shift found for today';
    }
    
    // Create time entry
    const timeEntry = new TimeEntry(timeEntryData);
    await timeEntry.save();
    
    // Update shift status if matched
    if (shift) {
      await updateShiftStatus(shift._id, 'In Progress', {
        actualStartTime: currentTime,
        timeEntryId: timeEntry._id
      });
    }

    res.json({
      success: true,
      message: validationResult ? validationResult.message : 'Clocked in successfully',
      data: {
        timeEntry,
        shift: shift ? {
          _id: shift._id,
          startTime: shift.startTime,
          endTime: shift.endTime,
          location: shift.location,
          workType: shift.workType
        } : null,
        attendanceStatus,
        validation: validationResult
      }
    });

  } catch (error) {
    console.error('Clock in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during clock in',
      error: error.message
    });
  }
});
```

## Replace the POST /api/clock/out endpoint with:

```javascript
// @route   POST /api/clock/out
// @desc    Clock out an employee (with hours calculation)
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
    }).populate('shiftId');

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
    
    // Calculate hours worked
    const hoursWorked = calculateHoursWorked(
      timeEntry.clockIn,
      currentTime,
      timeEntry.breaks
    );
    
    timeEntry.hoursWorked = hoursWorked;
    timeEntry.totalHours = hoursWorked;
    
    // Calculate variance if scheduled
    if (timeEntry.scheduledHours > 0) {
      timeEntry.variance = hoursWorked - timeEntry.scheduledHours;
    }
    
    await timeEntry.save();
    
    // Update linked shift if exists
    if (timeEntry.shiftId) {
      await updateShiftStatus(timeEntry.shiftId._id, 'Completed', {
        actualEndTime: currentTime
      });
    }

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: {
        timeEntry,
        hoursWorked,
        scheduledHours: timeEntry.scheduledHours,
        variance: timeEntry.variance,
        shiftStatus: timeEntry.shiftId ? 'Completed' : null
      }
    });

  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during clock out',
      error: error.message
    });
  }
});
```

## Replace the POST /api/clock/user/in endpoint with:

```javascript
// @route   POST /api/clock/user/in
// @desc    Clock in current user (with shift linking)
// @access  Private (User)
router.post('/user/in', async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    const { workType, location } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

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

    // Get current time
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    // Find matching shift
    const shift = await findMatchingShift(userId, new Date(), location);
    
    let timeEntryData = {
      employee: userId,
      date: new Date(),
      clockIn: currentTime,
      location: location || 'Work From Office',
      workType: workType || 'Regular',
      status: 'clocked_in',
      createdBy: userId
    };
    
    let attendanceStatus = 'Unscheduled';
    let validationResult = null;
    
    if (shift) {
      validationResult = validateClockIn(currentTime, shift);
      attendanceStatus = validationResult.status;
      
      timeEntryData.shiftId = shift._id;
      timeEntryData.attendanceStatus = attendanceStatus;
      timeEntryData.scheduledHours = calculateScheduledHours(shift);
      
      if (shift._locationMismatch) {
        timeEntryData.notes = `Location mismatch: Clocked in at ${location}, scheduled at ${shift.location}`;
      }
    } else {
      timeEntryData.attendanceStatus = 'Unscheduled';
      timeEntryData.notes = 'No scheduled shift found for today';
    }
    
    const timeEntry = new TimeEntry(timeEntryData);
    await timeEntry.save();
    
    if (shift) {
      await updateShiftStatus(shift._id, 'In Progress', {
        actualStartTime: currentTime,
        timeEntryId: timeEntry._id
      });
    }

    res.json({
      success: true,
      message: validationResult ? validationResult.message : 'Clocked in successfully',
      data: {
        timeEntry,
        shift: shift ? {
          _id: shift._id,
          startTime: shift.startTime,
          endTime: shift.endTime,
          location: shift.location
        } : null,
        attendanceStatus,
        validation: validationResult
      }
    });

  } catch (error) {
    console.error('User clock in error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during clock in',
      error: error.message
    });
  }
});
```

## Replace the POST /api/clock/user/out endpoint with:

```javascript
// @route   POST /api/clock/user/out
// @desc    Clock out current user (with hours calculation)
// @access  Private (User)
router.post('/user/out', async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeEntry = await TimeEntry.findOne({
      employee: userId,
      date: { $gte: today },
      status: { $in: ['clocked_in', 'on_break'] }
    }).populate('shiftId');

    if (!timeEntry) {
      return res.status(400).json({
        success: false,
        message: 'No active clock-in found for today'
      });
    }

    const currentTime = new Date().toTimeString().slice(0, 5);
    timeEntry.clockOut = currentTime;
    timeEntry.status = 'clocked_out';
    
    const hoursWorked = calculateHoursWorked(
      timeEntry.clockIn,
      currentTime,
      timeEntry.breaks
    );
    
    timeEntry.hoursWorked = hoursWorked;
    timeEntry.totalHours = hoursWorked;
    
    if (timeEntry.scheduledHours > 0) {
      timeEntry.variance = hoursWorked - timeEntry.scheduledHours;
    }
    
    await timeEntry.save();
    
    if (timeEntry.shiftId) {
      await updateShiftStatus(timeEntry.shiftId._id, 'Completed', {
        actualEndTime: currentTime
      });
    }

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: {
        timeEntry,
        hoursWorked,
        scheduledHours: timeEntry.scheduledHours,
        variance: timeEntry.variance
      }
    });

  } catch (error) {
    console.error('User clock out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during clock out',
      error: error.message
    });
  }
});
```

Save these changes and restart your backend.
