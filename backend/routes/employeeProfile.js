const express = require('express');
const router = express.Router();
const EmployeeHub = require('../models/EmployeesHub');
const AnnualLeaveBalance = require('../models/AnnualLeaveBalance');
const LeaveRecord = require('../models/LeaveRecord');

// Get employee by ID with complete profile data
router.get('/:id', async (req, res) => {
  try {
    const employee = await EmployeeHub.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Fetch real leave balance data for current year
    const now = new Date();
    const leaveBalance = await AnnualLeaveBalance.findOne({
      user: req.params.id,
      leaveYearStart: { $lte: now },
      leaveYearEnd: { $gte: now }
    });

    // Fetch recent leave records
    const recentLeaveRecords = await LeaveRecord.find({
      user: req.params.id
    })
      .sort({ startDate: -1 })
      .limit(5);

    // Calculate leave statistics
    const leaveBalanceData = leaveBalance ? {
      total: leaveBalance.entitlementDays,
      taken: leaveBalance.usedDays || 0,
      remaining: leaveBalance.entitlementDays - (leaveBalance.usedDays || 0)
    } : {
      total: 28,  // Default UK statutory minimum
      taken: 0,
      remaining: 28
    };

    // Count sickness and lateness occurrences (you can add these models later)
    const absencesData = {
      sicknessCount: 0,  // TODO: Implement sickness tracking
      latenessCount: 0   // TODO: Implement lateness tracking
    };

    // Format recent absences
    const recentAbsences = recentLeaveRecords.map(record => ({
      type: record.leaveType,
      date: record.startDate,
      endDate: record.endDate,
      status: record.status,
      days: record.daysUsed
    }));

    // Return complete employee data with leave balance
    const profileData = {
      // Basic Info
      _id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      employeeId: employee.employeeId,
      
      // Contact Info
      phoneNumber: employee.phoneNumber,
      mobileNumber: employee.mobileNumber,
      phone: employee.phoneNumber || employee.mobileNumber,
      
      // Job Info
      jobTitle: employee.jobTitle,
      position: employee.jobTitle,
      department: employee.department,
      team: employee.team,
      officeLocation: employee.officeLocation,
      
      // Dates
      startDate: employee.startDate,
      dateOfBirth: employee.dateOfBirth,
      
      // Personal Info
      gender: employee.gender,
      
      // Address
      addressLine1: employee.addressLine1,
      addressLine2: employee.addressLine2,
      city: employee.city,
      postalCode: employee.postalCode,
      country: employee.country,
      address: employee.addressLine1,
      
      // Emergency Contact
      emergencyContactName: employee.emergencyContactName,
      emergencyContactRelation: employee.emergencyContactRelation,
      emergencyContactPhone: employee.emergencyContactPhone,
      emergencyContactEmail: employee.emergencyContactEmail,
      
      // Leave & Absence
      leaveBalance: leaveBalanceData,
      absences: absencesData,
      recentAbsences: recentAbsences,
      
      // Other
      workingStatus: 'On-site',
      employmentType: employee.employmentType || 'Full-time',
      initials: employee.initials || `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase(),
      profilePhoto: employee.profilePhoto
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send registration email
router.post('/:id/send-registration', async (req, res) => {
  try {
    const employee = await EmployeeHub.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // TODO: Implement email sending logic
    console.log(`Sending registration email to ${employee.email}`);
    
    res.json({ message: 'Registration email sent successfully' });
  } catch (error) {
    console.error('Error sending registration email:', error);
    res.status(500).json({ message: 'Failed to send registration email' });
  }
});

module.exports = router;
