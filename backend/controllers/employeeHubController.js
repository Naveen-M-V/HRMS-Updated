const EmployeeHub = require('../models/EmployeesHub');
const Team = require('../models/Team');
const mongoose = require('mongoose');

/**
 * Get all employees
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const { team, department, status, search } = req.query;
    
    // Build query
    let query = {};
    
    if (team) query.team = team;
    if (department) query.department = department;
    if (status) query.status = status;
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ];
    }
    
    const employees = await EmployeeHub.find(query)
      .populate('managerId', 'firstName lastName')
      .sort({ firstName: 1, lastName: 1 });
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

/**
 * Get a single employee by ID
 */
exports.getEmployeeById = async (req, res) => {
  try {
    console.log('getEmployeeById called with ID:', req.params.id);
    console.log('ID type:', typeof req.params.id);
    console.log('ID length:', req.params.id?.length);
    
    // Validate ObjectId format
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid ObjectId format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format',
        receivedId: req.params.id
      });
    }

    const employee = await EmployeeHub.findById(req.params.id)
      .populate('managerId', 'firstName lastName email');
    
    if (!employee) {
      console.log('Employee not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    console.log('Employee found:', employee.firstName, employee.lastName);
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    
    // Handle CastError specifically (invalid ObjectId format)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
};

/**
 * Create a new employee
 */
exports.createEmployee = async (req, res) => {
  try {
    const employeeData = req.body;
    
    // Check if employee with same email already exists
    const existingEmployee = await EmployeeHub.findOne({ email: employeeData.email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }
    
    // Create new employee
    const employee = await EmployeeHub.create(employeeData);
    
    // If team is specified, add employee to team
    if (employeeData.team) {
      const team = await Team.findOne({ name: employeeData.team });
      if (team) {
        await team.addMember(employee._id);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  }
};

/**
 * Update an employee
 */
exports.updateEmployee = async (req, res) => {
  try {
    const employee = await EmployeeHub.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const oldTeam = employee.team;
    const newTeam = req.body.team;
    
    // Update employee
    Object.assign(employee, req.body);
    await employee.save();
    
    // Update team memberships if team changed
    if (oldTeam !== newTeam) {
      // Remove from old team
      if (oldTeam) {
        const oldTeamDoc = await Team.findOne({ name: oldTeam });
        if (oldTeamDoc) {
          await oldTeamDoc.removeMember(employee._id);
        }
      }
      
      // Add to new team
      if (newTeam) {
        const newTeamDoc = await Team.findOne({ name: newTeam });
        if (newTeamDoc) {
          await newTeamDoc.addMember(employee._id);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
};

/**
 * Delete an employee (soft delete)
 */
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await EmployeeHub.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Remove from team if assigned
    if (employee.team) {
      const team = await Team.findOne({ name: employee.team });
      if (team) {
        await team.removeMember(employee._id);
      }
    }
    
    // Soft delete
    employee.isActive = false;
    employee.status = 'Terminated';
    await employee.save();
    
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
};

/**
 * Get employees by team
 */
exports.getEmployeesByTeam = async (req, res) => {
  try {
    const { teamName } = req.params;
    
    const employees = await EmployeeHub.find({ 
      team: teamName, 
      isActive: true 
    }).sort({ firstName: 1 });
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees by team',
      error: error.message
    });
  }
};

/**
 * Get unregistered BrightHR employees
 */
exports.getUnregisteredBrightHR = async (req, res) => {
  try {
    const employees = await EmployeeHub.getUnregisteredBrightHR();
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unregistered employees',
      error: error.message
    });
  }
};

/**
 * Get employees without team assignment
 */
exports.getEmployeesWithoutTeam = async (req, res) => {
  try {
    const employees = await EmployeeHub.find({ 
      $or: [
        { team: '' },
        { team: null },
        { team: { $exists: false } }
      ],
      isActive: true 
    }).sort({ firstName: 1 });
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees without team',
      error: error.message
    });
  }
};
