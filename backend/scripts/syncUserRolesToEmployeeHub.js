/**
 * Sync User Roles to EmployeeHub
 * This script syncs admin roles from User collection to EmployeeHub collection
 * This ensures approvers appear in the leave request dropdown
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment configuration the same way server.js does
const envConfig = require('../config/environment');
const config = envConfig.getConfig();

const EmployeeHub = require('../models/EmployeesHub');
const User = require('../models/User');

async function syncRoles() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    console.log(`   Environment: ${config.environment}`);
    console.log(`   MongoDB URI: ${config.database.uri.substring(0, 50)}...`);
    
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB\n');

    console.log('=' .repeat(60));
    console.log('SYNCING ROLES FROM USER TO EMPLOYEEHUB');
    console.log('=' .repeat(60) + '\n');

    // Find all admin and super-admin users
    const adminUsers = await User.find({
      role: { $in: ['admin', 'super-admin'] },
      isActive: true,
      isAdminApproved: true
    });

    console.log(`Found ${adminUsers.length} admin users in User collection\n`);

    let updated = 0;
    let notFound = 0;
    let alreadyCorrect = 0;

    for (const user of adminUsers) {
      // Find corresponding employee by email
      const employee = await EmployeeHub.findOne({ email: user.email });

      if (!employee) {
        console.log(`⚠️  No EmployeeHub record found for ${user.email}`);
        notFound++;
        continue;
      }

      // Check if role needs to be updated
      if (employee.role === user.role) {
        console.log(`✅ ${user.email} already has correct role: ${user.role}`);
        alreadyCorrect++;
        continue;
      }

      // Update the role
      const oldRole = employee.role;
      employee.role = user.role;
      
      // Ensure employee is active
      employee.isActive = true;
      if (employee.status === 'Terminated') {
        employee.status = 'Active';
        console.log(`   ⚠️  Also updating status from Terminated to Active`);
      }

      await employee.save();
      
      console.log(`✅ Updated ${user.email}`);
      console.log(`   Role: ${oldRole} → ${user.role}`);
      updated++;
    }

    console.log('\n' + '=' .repeat(60));
    console.log('SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total admin users processed: ${adminUsers.length}`);
    console.log(`Roles updated: ${updated}`);
    console.log(`Already correct: ${alreadyCorrect}`);
    console.log(`Not found in EmployeeHub: ${notFound}`);

    if (updated > 0) {
      console.log('\n✅ SUCCESS: Roles have been synchronized!');
      console.log('   The approvers should now appear in the leave request dropdown.');
    } else if (alreadyCorrect > 0) {
      console.log('\n✅ All roles are already correct.');
    } else {
      console.log('\n⚠️  No roles were updated. Check if admin users exist in both collections.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
syncRoles();
