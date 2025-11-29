const mongoose = require('mongoose');
const EmployeeHub = require('../models/EmployeesHub');
const Team = require('../models/Team');
const User = require('../models/User');
const TimeEntry = require('../models/TimeEntry');
const ShiftAssignment = require('../models/ShiftAssignment');
const LeaveRecord = require('../models/LeaveRecord');
const crypto = require('crypto');
const { sendUserCredentialsEmail } = require('../utils/emailService');

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
    // Include terminated employees in "All" view, but filter them out when specific status is selected
    if (status && status !== 'All') {
      query.status = status;
      // For specific status filters (except "Terminated"), only show active employees
      if (status !== 'Terminated') {
        query.isActive = true;
      }
    }
    
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
 * Get EmployeeHub records merged with live clock status.
 */
exports.getEmployeesWithClockStatus = async (req, res) => {
  try {
    console.log('🔍 Fetching employees for Rota...');
    
    // Simple query without populate first
    const employees = await EmployeeHub.find({}).lean();
    console.log(`🔍 Found ${employees.length} employees in EmployeeHub`);

    // Map employees to expected format
    const result = employees.map(emp => {
      return {
        id: emp._id,
        _id: emp._id,
        firstName: emp.firstName || 'Unknown',
        lastName: emp.lastName || 'Unknown',
        email: emp.email || '',
        role: emp.role || 'employee',
        name: `${emp.firstName || 'Unknown'} ${emp.lastName || 'Unknown'}`
      };
    });

    console.log(`✅ Returning ${result.length} employees for Rota system`);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    console.error('❌ Error stack:', error.stack);
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
 * Create a new employee with automatic credentials
 * Updated for new architecture: EmployeesHub only with built-in authentication
 */
exports.createEmployee = async (req, res) => {
  try {
    const employeeData = req.body;
    console.log('🔍 Incoming employee data:', JSON.stringify(employeeData, null, 2));
    
    const normalizedEmail = employeeData.email?.toString().trim().toLowerCase();
    if (!normalizedEmail) {
      console.log('❌ Email validation failed - missing email');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    employeeData.email = normalizedEmail;
    
    // Check if employee with same email already exists in EmployeeHub only
    const existingEmployee = await EmployeeHub.findOne({ email: normalizedEmail });
    if (existingEmployee) {
      console.log('❌ Employee already exists with email:', normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }
    
    // Generate sequential employee ID
    const generateSequentialEmployeeId = async () => {
      try {
        // Find the highest existing employee ID
        const lastEmployee = await EmployeeHub.findOne({ 
          employeeId: { $regex: /^EMP\d+$/ } 
        }).sort({ employeeId: -1 }).limit(1);
        
        let nextNumber = 1001; // Start from EMP1001
        
        if (lastEmployee && lastEmployee.employeeId) {
          // Extract number from last employee ID (e.g., EMP1001 -> 1001)
          const lastNumber = parseInt(lastEmployee.employeeId.replace('EMP', ''));
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }
        
        return `EMP${nextNumber}`;
      } catch (error) {
        console.error('Error generating sequential employee ID:', error);
        // Fallback to random generation if there's an error
        const min = 1000;
        const max = 9999;
        return `EMP${Math.floor(Math.random() * (max - min + 1)) + min}`;
      }
    };

    // Generate unique sequential employee ID
    const employeeId = await generateSequentialEmployeeId();
    console.log('🔍 Generated employee ID:', employeeId);

    // Generate secure temporary password
    const temporaryPassword = crypto.randomBytes(8).toString('hex');
    
    // Add employee ID, password, and default values
    employeeData.employeeId = employeeId;
    employeeData.password = temporaryPassword; // Will be hashed by pre-save hook
    employeeData.role = employeeData.role || 'employee'; // Default to employee
    employeeData.isActive = true;
    employeeData.isEmailVerified = true;
    
    if (!employeeData.startDate) {
      employeeData.startDate = new Date(); // Set current date as default
    }
    
    // Transform flat address fields to nested address object
    if (employeeData.address1 || employeeData.address2 || employeeData.townCity || employeeData.postcode || employeeData.county) {
      employeeData.address = {
        line1: employeeData.address1 || '',
        line2: employeeData.address2 || '',
        city: employeeData.townCity || '',
        postCode: employeeData.postcode || '',
        country: employeeData.county || 'United Kingdom'
      };
    } else {
      // Provide default address if none provided
      employeeData.address = {
        line1: 'Office Address',
        line2: '',
        city: 'London',
        postCode: 'SW1A 0AA',
        country: 'United Kingdom'
      };
    }
    
    // Transform emergency contact fields
    if (employeeData.emergencyContactName || employeeData.emergencyContactPhone || employeeData.emergencyContactEmail) {
      employeeData.emergencyContact = {
        name: employeeData.emergencyContactName || '',
        relationship: employeeData.emergencyContactRelation || 'Emergency Contact',
        phone: employeeData.emergencyContactPhone || '',
        email: employeeData.emergencyContactEmail || ''
      };
    } else {
      // Provide default emergency contact
      employeeData.emergencyContact = {
        name: 'Emergency Contact',
        relationship: 'Emergency',
        phone: '0000000000',
        email: ''
      };
    }
    
    // Remove flat address fields to avoid conflicts
    delete employeeData.address1;
    delete employeeData.address2;
    delete employeeData.townCity;
    delete employeeData.postcode;
    delete employeeData.county;
    delete employeeData.emergencyContactName;
    delete employeeData.emergencyContactPhone;
    delete employeeData.emergencyContactEmail;
    delete employeeData.emergencyContactRelation;
    
    console.log('🔍 Final employee data before save:', JSON.stringify(employeeData, null, 2));
    
    // Create new employee with built-in authentication
    const employee = await EmployeeHub.create(employeeData);
    console.log('✅ Employee created successfully:', employee.employeeId);
    
    // Send credentials via email
    try {
      const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
      await sendUserCredentialsEmail(
        employee.email,
        `${employee.firstName} ${employee.lastName}`,
        temporaryPassword,
        loginUrl
      );
      console.log('✅ Credentials email sent to:', employee.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send credentials email:', emailError);
      // Continue with response even if email fails
    }
    
    // If team is specified, add employee to team
    if (employeeData.team) {
      const team = await Team.findOne({ name: employeeData.team });
      if (team) {
        await team.addMember(employee._id);
      }
    }
    
    // Return success response (no credentials in response for security)
    res.status(201).json({
      success: true,
      message: 'Employee created successfully. Login credentials have been sent to their email.',
      data: {
        id: employee._id,
        employeeId: employee.employeeId,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
        department: employee.department,
        jobTitle: employee.jobTitle,
        isActive: employee.isActive,
        credentialsSent: true
      }
    });
  } catch (error) {
    console.error('❌ Employee creation error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error('❌ Validation errors:', errors);
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
 * Rehire an employee (restore access)
 */
exports.rehireEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    const employee = await EmployeeHub.findById(id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    console.log('🔍 Rehire request:', { id, employeeName: `${employee.firstName} ${employee.lastName}` });

    // Update employee status to active
    employee.status = 'Active';
    employee.isActive = true;
    employee.terminatedDate = null;
    employee.endDate = null;
    employee.terminationNote = null;
    
    console.log('🔍 Saving rehired employee...');
    await employee.save();
    console.log('🔍 Employee rehired successfully:', {
      id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Employee rehired successfully',
      data: employee
    });
  } catch (error) {
    console.error('❌ Error rehiring employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error rehiring employee',
      error: error.message
    });
  }
};

/**
 * Hard delete an employee (permanent removal)
 */
exports.deleteEmployee = async (req, res) => {
  try {
    console.log('🔍 Starting delete employee process...');
    console.log('🔍 Request params:', req.params);
    console.log('🔍 Request body:', req.body);
    
    const { id } = req.params;
    
    // Validate ID
    if (!id) {
      console.log('❌ No ID provided in request');
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }
    
    console.log('🔍 Employee ID to delete:', id);
    
    // Check database connection
    const dbState = mongoose.connection.readyState;
    console.log('🔍 Database connection state:', dbState);
    
    if (dbState !== 1) {
      console.log('❌ Database not connected');
      return res.status(500).json({
        success: false,
        message: 'Database not connected'
      });
    }
    
    console.log('✅ Database connected, proceeding with deletion...');
    
    // Find the employee first
    const employee = await EmployeeHub.findById(id);
    console.log('🔍 Employee found:', employee ? 'YES' : 'NO');
    
    if (!employee) {
      console.log('❌ Employee not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    console.log('✅ Employee found:', employee.firstName, employee.lastName);
    console.log('🔍 Employee status:', employee.status);
    console.log('🔍 Employee details:', {
      _id: employee._id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      status: employee.status,
      department: employee.department,
      jobTitle: employee.jobTitle
    });
    
    // Only allow deletion of terminated employees
    if (employee.status?.toLowerCase() !== 'terminated') {
      console.log('❌ Employee is not terminated, current status:', employee.status);
      return res.status(400).json({
        success: false,
        message: 'Only terminated employees can be permanently deleted'
      });
    }

    console.log('🔍 Hard delete request:', { 
      id: employee._id, 
      employeeName: `${employee.firstName} ${employee.lastName}` 
    });

    // STEP 1: Create ArchiveEmployee record
    try {
      console.log('🔍 Creating archive record...');
      const ArchiveEmployee = require('../models/ArchiveEmployee');
      console.log('✅ ArchiveEmployee model loaded successfully');
      
      // Check if the model is properly formed
      console.log('🔍 ArchiveEmployee model check:', {
        modelName: ArchiveEmployee.modelName,
        collectionName: ArchiveEmployee.collection.name,
        hasFindMethod: typeof ArchiveEmployee.find === 'function'
      });
      
      const archiveData = {
        employeeId: employee._id.toString(),
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        department: employee.department || null,
        jobTitle: employee.jobTitle || null,
        status: employee.status,
        terminatedDate: employee.terminatedDate || null,
        deletedDate: new Date(),
        snapshot: {}
      };

      console.log('🔍 Archive data prepared:', {
        employeeId: archiveData.employeeId,
        fullName: archiveData.fullName,
        status: archiveData.status,
        deletedDate: archiveData.deletedDate
      });

      // Create snapshot without sensitive data
      const employeeObj = employee.toObject();
      delete employeeObj.password; // Remove password from snapshot
      archiveData.snapshot = employeeObj;

      console.log('🔍 Creating ArchiveEmployee instance...');
      const archivedEmployee = new ArchiveEmployee(archiveData);
      
      console.log('🔍 Saving archived employee...');
      const savedEmployee = await archivedEmployee.save();
      console.log('✅ Employee archived successfully:', savedEmployee.fullName);
      console.log('✅ Archived employee ID:', savedEmployee._id);
      console.log('✅ Archived employee saved to collection:', savedEmployee.constructor.modelName);
    } catch (archiveError) {
      console.error('❌ Archive creation failed:', archiveError);
      console.error('❌ Archive error details:', archiveError.message);
      console.error('❌ Archive error stack:', archiveError.stack);
      // Continue with deletion even if archiving fails
    }

    // STEP 2: Delete all associated data
    try {
      console.log('🔍 Testing Document model import...');
      const Document = require('../models/Document');
      console.log('✅ Document model imported successfully');
      
      console.log('🔍 Deleting documents...');
      await Document.deleteMany({ employee: employee._id });
      console.log('✅ Documents deleted successfully');
    } catch (docError) {
      console.error('❌ Error deleting documents:', docError);
      // Continue with other deletions
    }
    
    try {
      console.log('🔍 Testing Certificate model import...');
      const Certificate = require('../models/Certificate');
      console.log('✅ Certificate model imported successfully');
      
      console.log('🔍 Deleting certificates...');
      await Certificate.deleteMany({ employeeRef: employee._id });
      console.log('✅ Certificates deleted successfully');
    } catch (certError) {
      console.error('❌ Error deleting certificates:', certError);
      // Continue with other deletions
    }
    
    try {
      console.log('🔍 Testing TimeEntry model import...');
      const TimeEntry = require('../models/TimeEntry');
      console.log('✅ TimeEntry model imported successfully');
      
      // Check if TimeEntry has the deleteMany method (model might be empty)
      if (typeof TimeEntry.deleteMany === 'function') {
        console.log('🔍 Deleting time entries...');
        await TimeEntry.deleteMany({ employeeRef: employee._id });
        console.log('✅ Time entries deleted successfully');
      } else {
        console.log('⚠️ TimeEntry model is empty, skipping time entry deletion');
      }
    } catch (timeError) {
      console.error('❌ Error deleting time entries:', timeError);
      // Continue with other deletions
    }
    
    try {
      console.log('🔍 Testing ShiftAssignment model import...');
      const ShiftAssignment = require('../models/ShiftAssignment');
      console.log('✅ ShiftAssignment model imported successfully');
      
      console.log('🔍 Deleting shift assignments...');
      await ShiftAssignment.deleteMany({ employeeRef: employee._id });
      console.log('✅ Shift assignments deleted successfully');
    } catch (shiftError) {
      console.error('❌ Error deleting shift assignments:', shiftError);
      // Continue with other deletions
    }
    
    try {
      console.log('🔍 Testing Notification model import...');
      const Notification = require('../models/Notification');
      console.log('✅ Notification model imported successfully');
      
      console.log('🔍 Deleting notifications...');
      await Notification.deleteMany({ userEmployeeRef: employee._id });
      console.log('✅ Notifications deleted successfully');
    } catch (notifError) {
      console.error('❌ Error deleting notifications:', notifError);
      // Continue with other deletions
    }
    
    try {
      console.log('🔍 Testing Team model import...');
      const Team = require('../models/Team');
      console.log('✅ Team model imported successfully');
      
      console.log('🔍 Removing from teams...');
      await Team.updateMany({}, { $pull: { members: employee._id } });
      console.log('✅ Removed from teams successfully');
    } catch (teamError) {
      console.error('❌ Error removing from teams:', teamError);
      // Continue with employee deletion
    }
    
    // STEP 3: Delete the employee record
    console.log('🔍 Deleting employee record...');
    await EmployeeHub.findByIdAndDelete(employee._id);
    console.log('✅ Employee record deleted successfully');
    
    console.log('✅ Employee permanently deleted and archived:', {
      id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`
    });
    
    res.status(200).json({
      success: true,
      message: 'Employee permanently deleted and archived successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting employee:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
};

/**
 * Get all archived employees
 */
exports.getArchivedEmployees = async (req, res) => {
  try {
    console.log('🔍 Fetching archived employees...');
    
    // Try to import ArchiveEmployee model
    let ArchiveEmployee;
    try {
      ArchiveEmployee = require('../models/ArchiveEmployee');
      console.log('✅ ArchiveEmployee model loaded successfully');
    } catch (modelError) {
      console.log('⚠️ ArchiveEmployee model not available, returning empty array');
      console.error('Model error:', modelError);
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    console.log('🔍 Checking if ArchiveEmployee is a proper Mongoose model...');
    console.log('🔍 ArchiveEmployee constructor:', ArchiveEmployee.name);
    console.log('🔍 ArchiveEmployee find method:', typeof ArchiveEmployee.find);
    
    console.log('🔍 Querying ArchiveEmployee collection...');
    const archivedEmployees = await ArchiveEmployee.find({})
      .sort({ deletedDate: -1 }); // Newest first
    
    console.log('✅ Found archived employees:', archivedEmployees.length);
    console.log('🔍 Archived employees data:', archivedEmployees);
    
    // Also try a direct MongoDB query as backup to see all records
    console.log('🔍 Trying direct MongoDB query for verification...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('🔍 Available collections:', collections.map(c => c.name));
    
    if (collections.some(c => c.name === 'archiveemployees')) {
      const directResult = await db.collection('archiveemployees').find({}).toArray();
      console.log('🔍 Direct MongoDB query result:', directResult.length, 'records');
      console.log('🔍 Direct query data:', directResult);
      
      // Show details of each archived employee
      directResult.forEach((emp, index) => {
        console.log(`🔍 Archived Employee ${index + 1}:`, {
          _id: emp._id,
          fullName: emp.fullName,
          employeeId: emp.employeeId,
          deletedDate: emp.deletedDate,
          status: emp.status
        });
      });
    } else {
      console.log('⚠️ archiveemployees collection not found in database');
    }
    
    res.status(200).json({
      success: true,
      count: archivedEmployees.length,
      data: archivedEmployees
    });
  } catch (error) {
    console.error('❌ Error fetching archived employees:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // If the collection doesn't exist, return empty array
    if (error.message.includes('Collection') || error.message.includes('ns not found')) {
      console.log('⚠️ ArchiveEmployee collection not found, returning empty array');
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error fetching archived employees',
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

/**
 * Terminate an employee
 */
exports.terminateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { terminationNote } = req.body;
    
    console.log('🔍 Termination request:', { id, terminationNote });
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    const employee = await EmployeeHub.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    console.log('🔍 Employee found:', employee.firstName, employee.lastName);

    // Update employee status to terminated
    employee.status = 'Terminated';  // Use 'Terminated' (capital T) to match schema enum
    employee.isActive = false;
    employee.terminatedDate = new Date();
    employee.endDate = new Date();  // Set endDate to current date as per requirements
    
    // Add termination note if provided - use set() to handle schema changes gracefully
    if (terminationNote) {
      console.log('🔍 Adding termination note:', terminationNote);
      employee.set('terminationNote', terminationNote);
    }
    
    console.log('🔍 Saving employee...');
    await employee.save();
    console.log('🔍 Employee saved successfully');

    console.log('✅ Employee terminated successfully:', {
      id: employee._id,
      name: `${employee.firstName} ${employee.lastName}`,
      terminationNote: terminationNote || 'No reason provided'
    });

    res.status(200).json({
      success: true,
      message: 'Employee terminated successfully',
      data: employee
    });
  } catch (error) {
    console.error('❌ Error terminating employee:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error terminating employee',
      error: error.message
    });
  }
};
