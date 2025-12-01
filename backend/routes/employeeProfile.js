const express = require('express');
const router = express.Router();
const EmployeeHub = require('../models/EmployeesHub');

// Get employee by ID with complete profile data
router.get('/:id', async (req, res) => {
  try {
    const employee = await EmployeeHub.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Mock additional data for now
    const profileData = {
      _id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeId: employee.employeeId,
      workingStatus: 'Working from usual location',
      department: employee.department || 'Engineering',
      position: employee.position || 'Senior Developer',
      startDate: employee.startDate || '2022-01-15',
      employmentType: employee.employmentType || 'Full-time',
      phone: employee.phone || '+1 234 567 8900',
      address: employee.address || '123 Main St, City, State',
      leaveBalance: {
        total: 12,
        taken: 10,
        remaining: 2
      },
      absences: {
        sicknessCount: 2,
        latenessCount: 1
      },
      recentAbsences: [
        {
          type: 'Annual Leave',
          date: '2024-11-15',
          status: 'Approved'
        },
        {
          type: 'Sick Leave',
          date: '2024-10-20',
          status: 'Approved'
        }
      ]
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
