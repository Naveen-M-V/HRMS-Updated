const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
const TimeEntry = require('../models/TimeEntry');
const User = require('../models/User');
const LeaveRecord = require('../models/LeaveRecord');
const AnnualLeaveBalance = require('../models/AnnualLeaveBalance');
const {
  findMatchingShift,
  validateClockIn,
  calculateHoursWorked,
  calculateScheduledHours,
  updateShiftStatus
} = require('../utils/shiftTimeLinker');

/**
 * Clock Routes
 * Handles time tracking and attendance functionality
 * Integrated with leave management system
 */

/**
 * Reverse Geocoding Helper Function
 * Converts GPS coordinates to human-readable address using OpenStreetMap Nominatim API
 * @param {Number} latitude - GPS latitude
 * @param {Number} longitude - GPS longitude
 * @returns {Promise<String>} - Formatted address or null if failed
 */
async function reverseGeocode(latitude, longitude) {
  try {
    const https = require('https');
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'HRMS-App/1.0' // Required by OpenStreetMap
        }
      }, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result && result.display_name) {
              resolve(result.display_name);
            } else {
              resolve(null);
            }
          } catch (e) {
            console.error('Error parsing geocoding response:', e);
            resolve(null);
          }
        });
      }).on('error', (err) => {
        console.error('Reverse geocoding error:', err);
        resolve(null);
      });
    });
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}

// @route   POST /api/clock/in
// @desc    Clock in an employee
// @access  Private (Admin)
router.post('/in', async (req, res) => {
  try {
    const { employeeId, location, workType, latitude, longitude, accuracy } = req.body;

    console.log('Clock In Request:', { employeeId, location, workType, latitude, longitude, accuracy });
    console.log('Employee ID type:', typeof employeeId);

    if (!employeeId) {
      console.error('No employeeId provided');
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Check if employee exists in User collection OR Profile collection
    let employee = await User.findById(employeeId);
    console.log('User lookup result:', employee ? `Found: ${employee.firstName} ${employee.lastName}` : 'Not found');
    
    if (!employee) {
      // Check if this is a Profile ID instead
      const Profile = require('mongoose').model('Profile');
      const profile = await Profile.findById(employeeId);
      console.log('Profile lookup result:', profile ? `Found: ${profile.firstName} ${profile.lastName}` : 'Not found');
      
      if (profile && profile.userId) {
        // Use the profile's userId
        employee = await User.findById(profile.userId);
        console.log('Found profile, looking up user:', profile.userId);
      }
    }
    
    if (!employee) {
      console.error('Employee not found in User or Profile:', employeeId);
      return res.status(404).json({
        success: false,
        message: 'Employee not found in system. Please ensure user account exists.'
      });
    }
    
    // Use the actual User ID for clock operations
    const actualEmployeeId = employee._id;

    // Allow multiple clock-ins per day for split shifts or multiple work sessions
    // Check only if there's an ACTIVE clock-in (not clocked out)
    // Use UK timezone for date comparison
    const ukNow = moment().tz('Europe/London');
    const today = ukNow.clone().startOf('day').toDate();
    
    const existingEntry = await TimeEntry.findOne({
      employee: actualEmployeeId,
      date: { $gte: today },
      status: { $in: ['clocked_in', 'on_break'] }
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: `Employee is currently ${existingEntry.status.replace('_', ' ')}. Please clock out or end break before clocking in again.`
      });
    }
    
    // User can clock in again after clocking out (creates a new time entry for the same day)

    // Get current UK time
    const currentTime = ukNow.format('HH:mm'); // HH:mm format in UK timezone
    const createdByUserId = req.user._id || req.user.userId || req.user.id;
    
    // Find matching shift
    const shift = await findMatchingShift(actualEmployeeId, new Date(), location);
    
    let timeEntryData = {
      employee: actualEmployeeId,
      date: ukNow.toDate(), // Store as UK date
      clockIn: currentTime,
      location: location || 'Work From Office',
      workType: workType || 'Regular',
      status: 'clocked_in',
      createdBy: createdByUserId
    };
    
    let attendanceStatus = 'Unscheduled';
    let validationResult = null;
    
    if (shift) {
      validationResult = validateClockIn(currentTime, shift);
      attendanceStatus = validationResult.status;
      
      timeEntryData.shiftId = shift._id;
      timeEntryData.attendanceStatus = attendanceStatus;
      timeEntryData.scheduledHours = calculateScheduledHours(shift);
    } else {
      timeEntryData.attendanceStatus = 'Unscheduled';
      timeEntryData.notes = 'No scheduled shift found for today';
    }
    
    // ========== GPS LOCATION PROCESSING FOR ADMIN CLOCK-IN ==========
    // If GPS coordinates are provided, save them and attempt reverse geocoding
    if (latitude && longitude) {
      console.log('GPS coordinates received for admin clock-in:', { latitude, longitude, accuracy });
      
      // Initialize GPS location object
      timeEntryData.gpsLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        capturedAt: new Date()
      };
      
      // Attempt reverse geocoding to get address (non-blocking)
      try {
        const address = await reverseGeocode(latitude, longitude);
        if (address) {
          timeEntryData.gpsLocation.address = address;
          console.log('Reverse geocoded address for admin clock-in:', address);
        }
      } catch (geocodeError) {
        console.error('Reverse geocoding failed for admin clock-in, continuing without address:', geocodeError);
        // Don't fail the clock-in if geocoding fails
      }
    }
    // ================================================================
    
    const timeEntry = new TimeEntry(timeEntryData);
    await timeEntry.save();
    
    if (shift) {
      console.log('Updating shift status to In Progress:', shift._id);
      await updateShiftStatus(shift._id, 'In Progress', {
        actualStartTime: currentTime,
        timeEntryId: timeEntry._id
      });
      console.log('Shift status updated successfully');
    } else {
      // Check if employee has a shift today even if no match by time
      const ShiftAssignment = require('../models/ShiftAssignment');
      const todayShift = await ShiftAssignment.findOne({
        employeeId: actualEmployeeId,
        date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      });
      
      if (todayShift) {
        todayShift.status = 'In Progress';
        todayShift.actualStartTime = currentTime;
        todayShift.timeEntryId = timeEntry._id;
        await todayShift.save();
        console.log('Shift status updated to In Progress (unscheduled time)');
      }
    }

    // Create notification for admin clock-in
    try {
      const Notification = require('../models/Notification');
      const adminUser = await User.findById(createdByUserId);
      const adminName = adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : 'Admin';
      
      await Notification.create({
        userId: actualEmployeeId,
        type: 'system',
        title: 'Clocked In by Admin',
        message: `${adminName} clocked you in at ${currentTime} - ${location}`,
        priority: 'medium'
      });
    } catch (notifError) {
      console.error('Failed to create admin clock-in notification:', notifError);
    }

    res.json({
      success: true,
      message: validationResult ? validationResult.message : 'Employee clocked in successfully',
      data: {
        timeEntry,
        shift: shift ? {
          _id: shift._id,
          startTime: shift.startTime,
          endTime: shift.endTime,
          location: shift.location
        } : null,
        attendanceStatus
      }
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
    const { employeeId, latitude, longitude, accuracy } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Find today's active time entry using UK timezone
    const ukNow = moment().tz('Europe/London');
    const today = ukNow.clone().startOf('day').toDate();
    
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

    // Update clock out time using UK timezone
    const currentTime = ukNow.format('HH:mm'); // HH:mm format in UK timezone
    timeEntry.clockOut = currentTime;
    timeEntry.status = 'clocked_out';
    
    // ========== GPS LOCATION PROCESSING FOR ADMIN CLOCK-OUT ==========
    // If GPS coordinates are provided, save them and attempt reverse geocoding
    if (latitude && longitude) {
      console.log('GPS coordinates received for admin clock-out:', { latitude, longitude, accuracy });
      
      // Initialize GPS location object for clock-out
      timeEntry.gpsLocationOut = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        capturedAt: new Date()
      };
      
      // Attempt reverse geocoding to get address (non-blocking)
      try {
        const address = await reverseGeocode(latitude, longitude);
        if (address) {
          timeEntry.gpsLocationOut.address = address;
          console.log('Reverse geocoded address for admin clock-out:', address);
        }
      } catch (geocodeError) {
        console.error('Reverse geocoding failed for admin clock-out, continuing without address:', geocodeError);
        // Don't fail the clock-out if geocoding fails
      }
    }
    // =================================================================
    
    const hoursWorked = calculateHoursWorked(timeEntry.clockIn, currentTime, timeEntry.breaks);
    timeEntry.hoursWorked = hoursWorked;
    timeEntry.totalHours = hoursWorked;
    
    if (timeEntry.scheduledHours > 0) {
      timeEntry.variance = hoursWorked - timeEntry.scheduledHours;
    }
    
    await timeEntry.save();
    
    if (timeEntry.shiftId) {
      console.log('Marking shift as Completed');
      await updateShiftStatus(timeEntry.shiftId._id, 'Completed', {
        actualEndTime: currentTime
      });
    }

    // Create notification for admin clock-out
    try {
      const Notification = require('../models/Notification');
      const adminUserId = req.user._id || req.user.userId || req.user.id;
      const adminUser = await User.findById(adminUserId);
      const adminName = adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : 'Admin';
      
      await Notification.create({
        userId: employeeId,
        type: 'system',
        title: 'Clocked Out by Admin',
        message: `${adminName} clocked you out at ${currentTime}. Hours worked: ${hoursWorked.toFixed(2)}h`,
        priority: 'medium'
      });
    } catch (notifError) {
      console.error('Failed to create admin clock-out notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Employee clocked out successfully',
      data: {
        timeEntry,
        hoursWorked,
        variance: timeEntry.variance
      }
    });

  } catch (error) {
    console.error('Clock out error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during clock out'
    });
  }
});

// @route   GET /api/clock/dashboard
// @desc    Get dashboard statistics (includes admins by default)
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get Profile model to count total active employees
    const Profile = require('mongoose').model('Profile');
    
    // Get only ACTIVE profiles with valid user accounts
    const profiles = await Profile.find({
      isActive: { $ne: false },
      userId: { $exists: true, $ne: null }
    })
      .populate('userId', 'role')
      .lean();

    // Include ALL users (employees + admins) in dashboard stats
    const validProfiles = profiles.filter(profile => 
      profile.userId && 
      profile.userId._id &&
      profile.userId.deleted !== true &&
      profile.userId.isActive !== false
    );

    // Also include admin users who don't have profiles
    const profileUserIds = profiles.map(p => p.userId?._id?.toString()).filter(Boolean);
    const adminUsers = await User.find({
      role: 'admin',
      _id: { $nin: profileUserIds },
      isActive: { $ne: false },
      deleted: { $ne: true }
    }).select('_id').lean();

    const totalEmployees = validProfiles.length + adminUsers.length;
    const allUserIds = [
      ...validProfiles.map(p => p.userId._id),
      ...adminUsers.map(a => a._id)
    ];

    // Get today's time entries for ALL users (employees + admins)
    const timeEntries = await TimeEntry.find({
      date: { $gte: today },
      employee: { $in: allUserIds }
    }).sort({ createdAt: -1 }); // Sort by most recent first

    // Count only CURRENT status - each user counted once based on latest entry
    const employeeStatusMap = new Map();
    
    timeEntries.forEach(entry => {
      const empId = entry.employee.toString();
      // Only set if not already set (since we sorted by most recent first)
      if (!employeeStatusMap.has(empId)) {
        employeeStatusMap.set(empId, entry.status);
      }
    });

    // Count statuses from the map
    let clockedIn = 0;
    let onBreak = 0;
    let clockedOut = 0;
    
    employeeStatusMap.forEach(status => {
      if (status === 'clocked_in') clockedIn++;
      else if (status === 'on_break') onBreak++;
      else if (status === 'clocked_out') clockedOut++;
    });

    // Absent = users who have no time entry today
    const absent = Math.max(0, totalEmployees - employeeStatusMap.size);

    const stats = {
      clockedIn,
      onBreak,
      clockedOut,
      absent,
      total: totalEmployees
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
});

// @route   GET /api/clock/status
// @desc    Get current clock status for all employees (includes leave status)
// @access  Private (Admin)
router.get('/status', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if admins should be included
    const includeAdmins = req.query.includeAdmins === 'true';

    // Get Profile model from server.js (since it's defined there)
    const Profile = require('mongoose').model('Profile');
    const ShiftAssignment = require('../models/ShiftAssignment');

    // Get only ACTIVE profiles with valid user accounts
    const profiles = await Profile.find({
      isActive: { $ne: false },  // Only active profiles
      userId: { $exists: true, $ne: null }  // Must have a userId
    })
      .populate('userId', 'firstName lastName email _id role')
      .select('userId firstName lastName email department jobTitle vtid profilePicture')
      .lean();

    // Filter profiles based on includeAdmins parameter and user account status
    let validProfiles = profiles.filter(profile => {
      if (!profile.userId || !profile.userId._id) return false;
      
      // Exclude deleted or inactive user accounts
      if (profile.userId.deleted === true || profile.userId.isActive === false) return false;
      
      // If includeAdmins is true, include all profiles
      if (includeAdmins) return true;
      
      // Otherwise, exclude admins
      return profile.userId.role !== 'admin';
    });

    // If includeAdmins is true, also fetch admin users who don't have profiles
    if (includeAdmins) {
      const profileUserIds = profiles.map(p => p.userId?._id?.toString()).filter(Boolean);
      
      // Find admin users without profiles (exclude deleted/inactive)
      const adminUsers = await User.find({
        role: 'admin',
        _id: { $nin: profileUserIds },
        isActive: { $ne: false },
        deleted: { $ne: true }
      }).select('firstName lastName email _id role').lean();

      // Add admin users as "virtual profiles"
      adminUsers.forEach(admin => {
        validProfiles.push({
          userId: admin,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          department: 'Administration',
          jobTitle: 'Administrator',
          vtid: '-',
          profilePicture: null
        });
      });
    }

    // Get all valid user IDs
    const allUserIds = validProfiles.map(p => p.userId._id);
    const employeeIdSet = new Set(allUserIds.map(id => id.toString()));

    // Get today's time entries for all employees
    // Sort by date and clockIn descending to get the most recent entry first
    const timeEntries = await TimeEntry.find({
      date: { $gte: today },
      employee: { $in: allUserIds }
    })
    .sort({ date: -1, clockIn: -1 })
    .populate('employee', 'firstName lastName email')
    .lean();

    // Get today's approved leave records
    const leaveRecords = await LeaveRecord.find({
      status: 'approved',
      startDate: { $lte: tomorrow },
      endDate: { $gte: today },
      user: { $in: allUserIds }
    }).populate('user', '_id').lean();

    // Create status map from time entries
    // For multiple entries per day, prioritize active statuses (clocked_in, on_break)
    const statusMap = {};
    timeEntries.forEach(entry => {
      if (entry.employee) {
        const empId = entry.employee._id.toString();
        const existingStatus = statusMap[empId];
        
        // Priority: clocked_in > on_break > clocked_out > absent
        const shouldUpdate = !existingStatus || 
          (entry.status === 'clocked_in' && existingStatus.status !== 'clocked_in') ||
          (entry.status === 'on_break' && existingStatus.status === 'clocked_out');
        
        if (shouldUpdate) {
          statusMap[empId] = {
            status: entry.status,
            clockIn: entry.clockIn,
            clockOut: entry.clockOut,
            location: entry.location,
            workType: entry.workType,
            timeEntryId: entry._id
          };
        }
      }
    });

    // Create leave map
    const leaveMap = {};
    leaveRecords.forEach(record => {
      if (record.user) {
        leaveMap[record.user._id.toString()] = {
          type: record.type,
          reason: record.reason
        };
      }
    });

    // Build response with valid employees only
    const employeeStatus = validProfiles.map(profile => {
        const empId = profile.userId._id.toString();
        const status = statusMap[empId];
        const leave = leaveMap[empId];
      
      // If employee has approved leave today, override status
      if (leave) {
        return {
          id: empId,
          _id: empId,
          name: `${profile.userId.firstName} ${profile.userId.lastName}`,
          firstName: profile.userId.firstName,
          lastName: profile.userId.lastName,
          email: profile.userId.email,
          department: profile.department || '-',
          vtid: profile.vtid || '-',
          jobTitle: profile.jobTitle || '-',
          jobRole: profile.jobTitle || '-',
          profilePicture: profile.profilePicture || null,
          role: profile.userId.role || 'employee',
          status: 'on_leave',
          clockIn: null,
          clockOut: null,
          location: null,
          workType: null,
          leaveType: leave.type,
          leaveReason: leave.reason,
          timeEntryId: null
        };
      }
      
      // Otherwise use time entry status or default to absent
      return {
        id: empId,
        _id: empId,
        name: `${profile.userId.firstName} ${profile.userId.lastName}`,
        firstName: profile.userId.firstName,
        lastName: profile.userId.lastName,
        email: profile.userId.email,
        department: profile.department || '-',
        vtid: profile.vtid || '-',
        jobTitle: profile.jobTitle || '-',
        jobRole: profile.jobTitle || '-',
        profilePicture: profile.profilePicture || null,
        role: profile.userId.role || 'employee',
        status: status?.status || 'absent',
        clockIn: status?.clockIn || null,
        clockOut: status?.clockOut || null,
        location: status?.location || null,
        workType: status?.workType || null,
        timeEntryId: status?.timeEntryId || null
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
      .populate('shiftId', 'startTime endTime location')
      .sort({ date: -1, clockIn: -1 })
      .lean();

    // Process entries to add shift hours
    const processedEntries = timeEntries.map(entry => {
      let shiftHours = null;
      let shiftStartTime = null;
      let shiftEndTime = null;
      
      if (entry.shiftId && entry.shiftId.startTime && entry.shiftId.endTime) {
        shiftHours = calculateScheduledHours(entry.shiftId.startTime, entry.shiftId.endTime);
        shiftStartTime = entry.shiftId.startTime;
        shiftEndTime = entry.shiftId.endTime;
      }

      return {
        ...entry,
        shiftHours: shiftHours ? shiftHours.toFixed(2) : null,
        shiftStartTime: shiftStartTime,
        shiftEndTime: shiftEndTime
      };
    });

    res.json({
      success: true,
      data: processedEntries
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

    const timeEntry = await TimeEntry.findById(id);

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }

    // If this time entry is linked to a shift, reset the shift status
    if (timeEntry.shiftId) {
      const ShiftAssignment = require('../models/ShiftAssignment');
      const shift = await ShiftAssignment.findById(timeEntry.shiftId);
      
      if (shift) {
        shift.status = 'Scheduled';
        shift.actualStartTime = null;
        shift.actualEndTime = null;
        shift.timeEntryId = null;
        await shift.save();
        console.log(`Shift ${shift._id} reset to Scheduled after time entry deletion`);
      }
    }

    await TimeEntry.findByIdAndDelete(id);

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

// @route   POST /api/clock/onbreak
// @desc    Set employee to "On Break" status and sync with shift
// @access  Private (Admin)
router.post('/onbreak', async (req, res) => {
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
      status: 'clocked_in'
    }).populate('shiftId');

    if (!timeEntry) {
      return res.status(400).json({
        success: false,
        message: 'Employee must be clocked in to take a break'
      });
    }

    // Set break status
    const currentTime = new Date().toTimeString().slice(0, 5);
    timeEntry.status = 'on_break';
    timeEntry.onBreakStart = currentTime;
    
    await timeEntry.save();

    // Sync shift status to "On Break"
    if (timeEntry.shiftId) {
      const ShiftAssignment = require('../models/ShiftAssignment');
      await ShiftAssignment.findByIdAndUpdate(
        timeEntry.shiftId._id,
        { status: 'On Break' },
        { new: true }
      );
      console.log(`Shift ${timeEntry.shiftId._id} set to "On Break"`);
    }

    res.json({
      success: true,
      message: 'Employee is now on break',
      data: timeEntry
    });

  } catch (error) {
    console.error('On break error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error setting break status'
    });
  }
});

// @route   POST /api/clock/endbreak
// @desc    End employee break and resume work
// @access  Private (Admin)
router.post('/endbreak', async (req, res) => {
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
      status: 'on_break'
    }).populate('shiftId');

    if (!timeEntry) {
      return res.status(400).json({
        success: false,
        message: 'Employee is not currently on break'
      });
    }

    // End break
    const currentTime = new Date().toTimeString().slice(0, 5);
    timeEntry.status = 'clocked_in';
    timeEntry.onBreakEnd = currentTime;
    
    // Calculate break duration and add to breaks array
    if (timeEntry.onBreakStart) {
      const startParts = timeEntry.onBreakStart.split(':');
      const endParts = currentTime.split(':');
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      const duration = endMinutes - startMinutes;
      
      timeEntry.breaks.push({
        startTime: timeEntry.onBreakStart,
        endTime: currentTime,
        duration: duration > 0 ? duration : 0,
        type: 'other'
      });
      
      // Clear break markers
      timeEntry.onBreakStart = null;
      timeEntry.onBreakEnd = null;
    }
    
    await timeEntry.save();

    // Sync shift status back to "In Progress"
    if (timeEntry.shiftId) {
      const ShiftAssignment = require('../models/ShiftAssignment');
      await ShiftAssignment.findByIdAndUpdate(
        timeEntry.shiftId._id,
        { status: 'In Progress' },
        { new: true }
      );
      console.log(`Shift ${timeEntry.shiftId._id} resumed to "In Progress"`);
    }

    res.json({
      success: true,
      message: 'Break ended, employee back to work',
      data: timeEntry
    });

  } catch (error) {
    console.error('End break error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error ending break'
    });
  }
});

// @route   POST /api/clock/admin/status
// @desc    Admin change employee status (clocked_in, clocked_out, on_break, absent, on_leave)
// @access  Private (Admin)
router.post('/admin/status', async (req, res) => {
  try {
    const { employeeId, status, location, workType, reason } = req.body;

    if (!employeeId || !status) {
      return res.status(400).json({
        success: false,
        message: 'employeeId and status are required'
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let result;

    switch (status) {
      case 'clocked_in':
        // Check if employee is currently on break - if so, resume work
        const breakEntry = await TimeEntry.findOne({
          employee: employeeId,
          date: { $gte: today },
          status: 'on_break'
        });

        if (breakEntry) {
          // Resume work from break
          const currentTime = new Date().toTimeString().slice(0, 5);
          
          // End the current break
          if (breakEntry.breaks && breakEntry.breaks.length > 0) {
            const lastBreak = breakEntry.breaks[breakEntry.breaks.length - 1];
            if (!lastBreak.endTime || lastBreak.endTime === lastBreak.startTime) {
              lastBreak.endTime = currentTime;
              // Calculate actual break duration
              const startParts = lastBreak.startTime.split(':');
              const endParts = currentTime.split(':');
              const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
              const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
              lastBreak.duration = Math.max(0, endMinutes - startMinutes);
            }
          }
          
          breakEntry.status = 'clocked_in';
          await breakEntry.save();
          
          // Update shift status to In Progress when resuming work
          if (breakEntry.shiftId) {
            console.log('Resume work: Updating shift to In Progress:', breakEntry.shiftId._id);
            await updateShiftStatus(breakEntry.shiftId._id, 'In Progress');
          }
          
          result = { message: 'Employee resumed work successfully', data: breakEntry };
          break;
        }

        // Check if employee already has any time entry for today
        const existingEntry = await TimeEntry.findOne({
          employee: employeeId,
          date: { $gte: today }
        });

        if (existingEntry) {
          return res.status(400).json({
            success: false,
            message: `Employee already has a time entry for today. Current status: ${existingEntry.status.replace('_', ' ')}`
          });
        }

        // Create new time entry
        const currentTime = new Date().toTimeString().slice(0, 5);
        const timeEntry = new TimeEntry({
          employee: employeeId,
          date: new Date(),
          clockIn: currentTime,
          location: location || 'Work From Office',
          workType: workType || 'Regular',
          status: 'clocked_in',
          isManualEntry: true,
          createdBy: req.user.id
        });

        await timeEntry.save();
        result = { message: 'Employee clocked in successfully', data: timeEntry };
        break;

      case 'clocked_out':
        // Find active entry
        const activeEntry = await TimeEntry.findOne({
          employee: employeeId,
          date: { $gte: today },
          status: { $in: ['clocked_in', 'on_break'] }
        });

        if (!activeEntry) {
          return res.status(400).json({
            success: false,
            message: 'No active clock-in found for today'
          });
        }

        activeEntry.clockOut = new Date().toTimeString().slice(0, 5);
        activeEntry.status = 'clocked_out';
        await activeEntry.save();
        result = { message: 'Employee clocked out successfully', data: activeEntry };
        break;

      case 'on_break':
        // Find today's entry
        const clockedInEntry = await TimeEntry.findOne({
          employee: employeeId,
          date: { $gte: today },
          status: 'clocked_in'
        });

        if (!clockedInEntry) {
          return res.status(400).json({
            success: false,
            message: 'Employee must be clocked in to take a break'
          });
        }

        const breakStartTime = new Date().toTimeString().slice(0, 5);
        const breakEndTime = new Date(Date.now() + 30 * 60000).toTimeString().slice(0, 5);

        clockedInEntry.breaks.push({
          startTime: breakStartTime,
          endTime: breakEndTime,
          duration: 30,
          type: 'other'
        });
        clockedInEntry.status = 'on_break';
        await clockedInEntry.save();
        
        // Update shift status to On Break
        if (clockedInEntry.shiftId) {
          console.log('Break started: Updating shift to On Break:', clockedInEntry.shiftId._id);
          await updateShiftStatus(clockedInEntry.shiftId._id, 'On Break');
        }
        
        result = { message: 'Break started successfully', data: clockedInEntry };
        break;

      case 'absent':
      case 'on_leave':
        // Create a leave record for today
        const leaveRecord = new LeaveRecord({
          user: employeeId,
          type: status === 'absent' ? 'absent' : 'annual',
          status: 'approved',
          startDate: today,
          endDate: today,
          days: 1,
          reason: reason || 'Admin marked',
          createdBy: req.user.id,
          approvedBy: req.user.id,
          approvedAt: new Date()
        });

        await leaveRecord.save();
        result = { message: `Employee marked as ${status} successfully`, data: leaveRecord };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: clocked_in, clocked_out, on_break, absent, or on_leave'
        });
    }

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Admin change status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing employee status'
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
    const userId = req.user.id || req.user._id || req.user.userId;
    
    // Use UK timezone for date comparison
    const ukNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
    const today = new Date(ukNow);
    today.setHours(0, 0, 0, 0);
    
    const timeEntry = await TimeEntry.findOne({
      employee: userId,
      date: { $gte: today },
      status: { $in: ['clocked_in', 'clocked_out', 'on_break'] }
    })
    .sort({ date: -1, clockIn: -1 }) // Get the most recent entry
    .populate('employee', 'firstName lastName email vtid');
    
    console.log('📊 User status query - userId:', userId, 'today:', today);
    console.log('📊 Found time entry:', timeEntry ? {
      status: timeEntry.status,
      clockIn: timeEntry.clockIn,
      clockOut: timeEntry.clockOut,
      date: timeEntry.date
    } : 'NO ENTRY FOUND');

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
    const userId = req.user._id || req.user.userId || req.user.id;
    // Extract GPS coordinates from request body
    const { workType, location, latitude, longitude, accuracy } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Allow multiple clock-ins per day for split shifts or multiple work sessions
    // Check only if there's an ACTIVE clock-in (not clocked out)
    // Use UK timezone for date comparison
    const ukNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
    const today = new Date(ukNow);
    today.setHours(0, 0, 0, 0);
    
    const existingEntry = await TimeEntry.findOne({
      employee: userId,
      date: { $gte: today },
      status: { $in: ['clocked_in', 'on_break'] }
    });

    if (existingEntry) {
      console.log('❌ User already has active clock-in:', {
        userId: userId,
        status: existingEntry.status,
        clockIn: existingEntry.clockIn,
        date: existingEntry.date,
        entryId: existingEntry._id
      });
      return res.status(400).json({
        success: false,
        message: `You are currently ${existingEntry.status.replace('_', ' ')}. Please clock out or end break before clocking in again.`,
        currentStatus: {
          status: existingEntry.status,
          clockIn: existingEntry.clockIn,
          clockOut: existingEntry.clockOut,
          location: existingEntry.location,
          workType: existingEntry.workType
        }
      });
    }
    
    // User can clock in again after clocking out (creates a new time entry for the same day)

    // Get current UK time
    const currentTime = ukNow.toTimeString().slice(0, 5); // HH:MM format
    
    // Find matching shift
    const shift = await findMatchingShift(userId, ukNow, location);
    
    let timeEntryData = {
      employee: userId,
      date: ukNow,
      clockIn: currentTime,
      location: location || 'Work From Office',
      workType: workType || 'Regular',
      status: 'clocked_in',
      createdBy: userId
    };
    
    // ========== GPS LOCATION PROCESSING ==========
    // If GPS coordinates are provided, save them and attempt reverse geocoding
    if (latitude && longitude) {
      console.log('GPS coordinates received:', { latitude, longitude, accuracy });
      
      // Initialize GPS location object
      timeEntryData.gpsLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        capturedAt: new Date()
      };
      
      // Attempt reverse geocoding to get address (non-blocking)
      try {
        const address = await reverseGeocode(latitude, longitude);
        if (address) {
          timeEntryData.gpsLocation.address = address;
          console.log('Reverse geocoded address:', address);
        }
      } catch (geocodeError) {
        console.error('Reverse geocoding failed, continuing without address:', geocodeError);
        // Don't fail the clock-in if geocoding fails
      }
    }
    // ============================================
    
    let attendanceStatus = 'Unscheduled';
    let validationResult = null;
    
    if (shift) {
      validationResult = validateClockIn(currentTime, shift);
      attendanceStatus = validationResult.status;
      
      timeEntryData.shiftId = shift._id;
      timeEntryData.attendanceStatus = attendanceStatus;
      timeEntryData.scheduledHours = calculateScheduledHours(shift);
    } else {
      timeEntryData.attendanceStatus = 'Unscheduled';
      timeEntryData.notes = 'No scheduled shift found for today';
    }
    
    const timeEntry = new TimeEntry(timeEntryData);
    await timeEntry.save();
    
    if (shift) {
      console.log('User clock-in: Updating shift to In Progress:', shift._id);
      await updateShiftStatus(shift._id, 'In Progress', {
        actualStartTime: currentTime,
        timeEntryId: timeEntry._id
      });
    }

    // Create notification for clock-in
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: userId,
        type: 'system',
        title: 'Clocked In',
        message: `You clocked in at ${currentTime} - ${location}`,
        priority: 'medium'
      });
    } catch (notifError) {
      console.error('Failed to create clock-in notification:', notifError);
    }

    res.json({
      success: true,
      message: validationResult ? validationResult.message : 'Clocked in successfully',
      data: {
        timeEntry,
        shift: shift ? { _id: shift._id, startTime: shift.startTime, endTime: shift.endTime } : null,
        attendanceStatus,
        validation: validationResult
      }
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
    const userId = req.user._id || req.user.userId || req.user.id;
    // Extract GPS coordinates from request body for clock-out
    const { latitude, longitude, accuracy } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find today's active time entry using UK timezone
    const ukNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
    const today = new Date(ukNow);
    today.setHours(0, 0, 0, 0);
    
    const timeEntry = await TimeEntry.findOne({
      employee: userId,
      date: { $gte: today },
      status: { $in: ['clocked_in', 'on_break'] }
    }).populate('shiftId');

    if (!timeEntry) {
      console.log('Clock-out failed: No active entry found for user:', userId, 'after date:', today);
      return res.status(400).json({
        success: false,
        message: 'No active clock-in found for today'
      });
    }

    // Update clock out time using UK timezone
    const currentTime = ukNow.toTimeString().slice(0, 5); // HH:MM format
    timeEntry.clockOut = currentTime;
    timeEntry.status = 'clocked_out';
    
    // ========== GPS LOCATION PROCESSING FOR CLOCK-OUT ==========
    // If GPS coordinates are provided, save them and attempt reverse geocoding
    if (latitude && longitude) {
      console.log('GPS coordinates received for clock-out:', { latitude, longitude, accuracy });
      
      // Initialize GPS location object for clock-out
      timeEntry.gpsLocationOut = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        capturedAt: new Date()
      };
      
      // Attempt reverse geocoding to get address (non-blocking)
      try {
        const address = await reverseGeocode(latitude, longitude);
        if (address) {
          timeEntry.gpsLocationOut.address = address;
          console.log('Reverse geocoded address for clock-out:', address);
        }
      } catch (geocodeError) {
        console.error('Reverse geocoding failed for clock-out, continuing without address:', geocodeError);
        // Don't fail the clock-out if geocoding fails
      }
    }
    // ===========================================================
    
    const hoursWorked = calculateHoursWorked(timeEntry.clockIn, currentTime, timeEntry.breaks);
    timeEntry.hoursWorked = hoursWorked;
    timeEntry.totalHours = hoursWorked;
    
    if (timeEntry.scheduledHours > 0) {
      timeEntry.variance = hoursWorked - timeEntry.scheduledHours;
    }
    
    await timeEntry.save();
    
    if (timeEntry.shiftId) {
      console.log('User clock-out: Marking shift as Completed');
      await updateShiftStatus(timeEntry.shiftId._id, 'Completed', {
        actualEndTime: currentTime
      });
    }

    // Create notification for clock-out
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: userId,
        type: 'system',
        title: 'Clocked Out',
        message: `You clocked out at ${currentTime}. Hours worked: ${hoursWorked.toFixed(2)}h`,
        priority: 'medium'
      });
    } catch (notifError) {
      console.error('Failed to create clock-out notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: {
        timeEntry,
        hoursWorked,
        variance: timeEntry.variance
      }
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
    const userId = req.user._id || req.user.userId || req.user.id;
    const { duration = 30, type = 'other' } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find today's active time entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeEntry = await TimeEntry.findOne({
      employee: userId,
      date: { $gte: today },
      status: 'clocked_in'
    }).populate('shiftId');

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
    
    // Note: Shift status stays "In Progress" during break
    // (not changing to "On Break" to keep it simple)

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

// @route   POST /api/clock/user/start-break
// @desc    Start break for current user
// @access  Private (User)
router.post('/user/start-break', async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find today's active time entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeEntry = await TimeEntry.findOne({
      employee: userId,
      date: { $gte: today },
      status: 'clocked_in'
    }).populate('employee', 'firstName lastName email');

    if (!timeEntry) {
      return res.status(400).json({
        success: false,
        message: 'You must be clocked in to start a break'
      });
    }

    // Set break status
    const currentTime = new Date().toTimeString().slice(0, 5);
    timeEntry.status = 'on_break';
    timeEntry.onBreakStart = currentTime;
    
    await timeEntry.save();

    // Create notification
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: userId,
        type: 'system',
        title: 'Break Started',
        message: `Break started at ${currentTime}`,
        priority: 'low'
      });
    } catch (notifError) {
      console.error('Failed to create break notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Break started successfully',
      data: timeEntry
    });

  } catch (error) {
    console.error('Start break error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting break'
    });
  }
});

// @route   POST /api/clock/user/resume-work
// @desc    Resume work from break for current user
// @access  Private (User)
router.post('/user/resume-work', async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find today's active time entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeEntry = await TimeEntry.findOne({
      employee: userId,
      date: { $gte: today },
      status: 'on_break'
    }).populate('employee', 'firstName lastName email');

    if (!timeEntry) {
      return res.status(400).json({
        success: false,
        message: 'You are not currently on break'
      });
    }

    // Calculate break duration
    const currentTime = new Date().toTimeString().slice(0, 5);
    const breakStart = timeEntry.onBreakStart;
    
    if (breakStart) {
      const [startHour, startMin] = breakStart.split(':').map(Number);
      const [endHour, endMin] = currentTime.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      
      // Add break to breaks array
      timeEntry.breaks.push({
        startTime: breakStart,
        endTime: currentTime,
        duration: duration > 0 ? duration : 0,
        type: 'other'
      });
    }

    // Resume work status
    timeEntry.status = 'clocked_in';
    timeEntry.onBreakStart = null;
    
    await timeEntry.save();

    // Create notification
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: userId,
        type: 'system',
        title: 'Work Resumed',
        message: `Work resumed at ${currentTime}`,
        priority: 'low'
      });
    } catch (notifError) {
      console.error('Failed to create resume notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Work resumed successfully',
      data: timeEntry
    });

  } catch (error) {
    console.error('Resume work error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting break'
    });
  }
});

// @route   GET /api/clock/user/entries
// @desc    Get current user's time entries
// @access  Private (User)
router.get('/user/entries', async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
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
      .populate('shiftId', 'startTime endTime location')
      .sort({ date: -1, clockIn: -1 })
      .limit(50) // Limit to recent entries
      .lean();

    // Process entries to add shift hours
    const processedEntries = timeEntries.map(entry => {
      let shiftHours = null;
      let shiftStartTime = null;
      let shiftEndTime = null;
      
      if (entry.shiftId && entry.shiftId.startTime && entry.shiftId.endTime) {
        shiftHours = calculateScheduledHours(entry.shiftId.startTime, entry.shiftId.endTime);
        shiftStartTime = entry.shiftId.startTime;
        shiftEndTime = entry.shiftId.endTime;
      }

      return {
        ...entry,
        shiftHours: shiftHours ? shiftHours.toFixed(2) : null,
        shiftStartTime: shiftStartTime,
        shiftEndTime: shiftEndTime
      };
    });

    res.json({
      success: true,
      data: processedEntries
    });

  } catch (error) {
    console.error('Get user time entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching time entries'
    });
  }
});

// @route   DELETE /api/clock/entries/:id
// @desc    Delete a time entry (Admin only)
// @access  Private (Admin)
router.delete('/entries/:id', async (req, res) => {
  try {
    const entryId = req.params.id;
    
    // Find the time entry
    const timeEntry = await TimeEntry.findById(entryId);
    
    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'Time entry not found'
      });
    }
    
    // Delete the time entry
    await TimeEntry.findByIdAndDelete(entryId);
    
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

// @route   GET /api/clock/timesheet/:employeeId
// @desc    Get weekly timesheet data for an employee
// @access  Private (Admin)
router.get('/timesheet/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('📊 Fetching timesheet for employee:', employeeId);
    console.log('📅 Date range:', startDate, 'to', endDate);

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Parse dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Fetch time entries for the employee within the date range
    const timeEntries = await TimeEntry.find({
      employee: employeeId,
      date: {
        $gte: start,
        $lte: end
      }
    })
    .populate('employee', 'firstName lastName email vtid')
    .populate('shiftId', 'startTime endTime location')
    .sort({ date: 1, clockIn: 1 }) // Sort by date, then by clock-in time for multiple sessions
    .lean();

    console.log(`✅ Found ${timeEntries.length} time entries`);

    // Calculate statistics
    let totalHoursWorked = 0;
    let totalOvertime = 0;
    let totalNegativeHours = 0;

    const processedEntries = timeEntries.map(entry => {
      let hoursWorked = 0;
      let overtime = 0;
      let negativeHours = 0;

      // Calculate hours worked using the utility function
      if (entry.clockIn && entry.clockOut) {
        // Use the calculateHoursWorked utility which properly handles HH:mm format
        hoursWorked = parseFloat(calculateHoursWorked(entry.clockIn, entry.clockOut, entry.breaks || []));

        totalHoursWorked += hoursWorked;

        // Calculate overtime (if worked more than 8 hours)
        if (hoursWorked > 8) {
          overtime = hoursWorked - 8;
          totalOvertime += overtime;
        }

        // Calculate negative hours (if worked less than expected shift hours)
        if (entry.shiftId && entry.shiftId.startTime && entry.shiftId.endTime) {
          const expectedHours = calculateScheduledHours(entry.shiftId.startTime, entry.shiftId.endTime);
          
          if (hoursWorked < expectedHours) {
            negativeHours = expectedHours - hoursWorked;
            totalNegativeHours += negativeHours;
          }
        }
      } else if (entry.clockIn && !entry.clockOut) {
        // Employee is still clocked in - calculate hours up to now
        const currentTime = new Date().toTimeString().slice(0, 5);
        hoursWorked = parseFloat(calculateHoursWorked(entry.clockIn, currentTime, entry.breaks || []));
      }

      // Calculate shift hours if shift data is available
      let shiftHours = null;
      let shiftStartTime = null;
      let shiftEndTime = null;
      
      if (entry.shiftId && entry.shiftId.startTime && entry.shiftId.endTime) {
        shiftHours = calculateScheduledHours(entry.shiftId.startTime, entry.shiftId.endTime);
        shiftStartTime = entry.shiftId.startTime;
        shiftEndTime = entry.shiftId.endTime;
      }

      return {
        ...entry,
        hoursWorked: hoursWorked.toFixed(2),
        overtime: overtime.toFixed(2),
        negativeHours: negativeHours.toFixed(2),
        shiftHours: shiftHours ? shiftHours.toFixed(2) : null,
        shiftStartTime: shiftStartTime,
        shiftEndTime: shiftEndTime
      };
    });

    res.json({
      success: true,
      entries: processedEntries,
      statistics: {
        totalHoursWorked: totalHoursWorked.toFixed(2),
        totalOvertime: totalOvertime.toFixed(2),
        totalNegativeHours: totalNegativeHours.toFixed(2),
        totalDays: timeEntries.length
      }
    });

  } catch (error) {
    console.error('❌ Fetch timesheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * GET /api/employees/count
 * Get total count of employees in the system
 */
router.get('/employees/count', async (req, res) => {
  try {
    const totalCount = await User.countDocuments({ role: 'employee' });
    
    res.json({
      success: true,
      total: totalCount
    });
  } catch (error) {
    console.error('Error fetching employee count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee count',
      error: error.message
    });
  }
});

module.exports = router;
