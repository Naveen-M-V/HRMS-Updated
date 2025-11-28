const mongoose = require('mongoose');
const EmployeeHub = require('./models/EmployeesHub');
const User = require('./models/User');
require('dotenv').config({ path: '.env.local' });

// Generate 4-digit employee ID
const generateEmployeeId = () => {
  const min = 1000;
  const max = 9999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Ensure unique employee ID
const getUniqueEmployeeId = async () => {
  let employeeId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    employeeId = `EMP${generateEmployeeId()}`;
    const existing = await EmployeeHub.findOne({ employeeId });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Unable to generate unique employee ID after multiple attempts');
  }

  return employeeId;
};

const createAdminInEmployeeHub = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@talentshield.com' });
    
    if (!adminUser) {
      console.log('Admin user not found. Please create admin user first.');
      return;
    }

    console.log('Found admin user:', adminUser.email);

    // Check if admin already exists in EmployeeHub
    const existingAdmin = await EmployeeHub.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('Admin already exists in EmployeeHub with employee ID:', existingAdmin.employeeId);
      
      // Update employee ID if missing
      if (!existingAdmin.employeeId) {
        const employeeId = await getUniqueEmployeeId();
        existingAdmin.employeeId = employeeId;
        await existingAdmin.save();
        console.log('Updated admin with employee ID:', employeeId);
      }
      
      return;
    }

    // Generate unique employee ID
    const employeeId = await getUniqueEmployeeId();

    // Create admin in EmployeeHub
    const adminEmployee = new EmployeeHub({
      employeeId,
      firstName: adminUser.firstName || 'Admin',
      lastName: adminUser.lastName || 'User',
      email: adminUser.email,
      phone: adminUser.phone || '',
      jobTitle: 'System Administrator',
      department: 'IT',
      team: 'System Administration',
      office: 'Head Office',
      workLocation: 'On-site',
      status: 'Active',
      isActive: true,
      userId: adminUser._id,
      startDate: new Date(), // Add current date as start date
      // Set some default values for admin
      gender: 'Unspecified',
      dateOfBirth: new Date('1990-01-01'), // Default date
      address: {
        line1: 'Office Address',
        city: 'London',
        postCode: 'SW1A 0AA',
        country: 'United Kingdom'
      },
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'System',
        phone: '0000000000'
      },
      // Profile display
      initials: 'AU',
      color: '#6366F1'
    });

    await adminEmployee.save();
    
    console.log('✅ Admin successfully created in EmployeeHub:');
    console.log(`   Employee ID: ${employeeId}`);
    console.log(`   Name: ${adminEmployee.firstName} ${adminEmployee.lastName}`);
    console.log(`   Email: ${adminEmployee.email}`);
    console.log(`   Status: ${adminEmployee.status}`);

  } catch (error) {
    console.error('❌ Error creating admin in EmployeeHub:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createAdminInEmployeeHub();
