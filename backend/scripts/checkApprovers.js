/**
 * Check Approvers Script
 * This script checks for admin/super-admin users and their corresponding EmployeeHub records
 * Useful for debugging leave request approver dropdown issues
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment configuration the same way server.js does
const envConfig = require('../config/environment');
const config = envConfig.getConfig();

const EmployeeHub = require('../models/EmployeesHub');
const User = require('../models/User');

async function checkApprovers() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    console.log(`   Environment: ${config.environment}`);
    console.log(`   MongoDB URI: ${config.database.uri.substring(0, 50)}...`);
    
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to MongoDB\n');

    // Check User collection for admin roles
    console.log('=' .repeat(60));
    console.log('CHECKING USER COLLECTION FOR ADMINS');
    console.log('=' .repeat(60));

    const adminUsers = await User.find({
      role: { $in: ['admin', 'super-admin'] },
      isActive: true,
      isAdminApproved: true
    }).select('email role isActive isAdminApproved firstName lastName');

    console.log(`\n✅ Found ${adminUsers.length} admin users in User collection:\n`);
    
    if (adminUsers.length === 0) {
      console.log('⚠️  WARNING: No admin users found in User collection!');
      console.log('   Create admin users first.\n');
    } else {
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Approved: ${user.isAdminApproved}`);
        console.log('');
      });
    }

    // Check for corresponding EmployeeHub records
    console.log('=' .repeat(60));
    console.log('CHECKING EMPLOYEEHUB RECORDS FOR ADMIN USERS');
    console.log('=' .repeat(60) + '\n');

    let foundInEmployeeHub = 0;
    let missingFromEmployeeHub = [];
    let inactiveInEmployeeHub = [];

    for (const user of adminUsers) {
      const employee = await EmployeeHub.findOne({ email: user.email });
      
      if (!employee) {
        console.log(`❌ ${user.email} (${user.role}) has NO EmployeeHub record`);
        missingFromEmployeeHub.push(user);
      } else if (!employee.isActive || employee.status === 'Terminated') {
        console.log(`⚠️  ${user.email} exists in EmployeeHub but is inactive`);
        console.log(`   EmployeeHub ID: ${employee._id}`);
        console.log(`   Status: ${employee.status}, Active: ${employee.isActive}\n`);
        inactiveInEmployeeHub.push({ user, employee });
      } else {
        console.log(`✅ ${user.email} has valid EmployeeHub record`);
        console.log(`   EmployeeHub ID: ${employee._id}`);
        console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
        console.log(`   Role in EmployeeHub: ${employee.role}`);
        console.log(`   Status: ${employee.status}, Active: ${employee.isActive}\n`);
        foundInEmployeeHub++;
      }
    }

    console.log('=' .repeat(60));
    console.log('SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total admin/super-admin users: ${adminUsers.length}`);
    console.log(`✅ Valid EmployeeHub records: ${foundInEmployeeHub}`);
    console.log(`⚠️  Inactive EmployeeHub records: ${inactiveInEmployeeHub.length}`);
    console.log(`❌ Missing EmployeeHub records: ${missingFromEmployeeHub.length}`);
    
    if (foundInEmployeeHub === 0) {
      console.log('\n❌ CRITICAL ISSUE: No valid approvers available!');
      console.log('   This is why the dropdown shows "No approvers available".\n');
      console.log('⚠️  ACTION REQUIRED:');
      
      if (missingFromEmployeeHub.length > 0) {
        console.log('   1. Create EmployeeHub records for admin users:');
        missingFromEmployeeHub.forEach(user => {
          console.log(`      - ${user.email}`);
        });
      }
      
      if (inactiveInEmployeeHub.length > 0) {
        console.log('   2. Activate these EmployeeHub records:');
        inactiveInEmployeeHub.forEach(({ user, employee }) => {
          console.log(`      - ${user.email} (ID: ${employee._id})`);
        });
        console.log('      Run: node backend/scripts/syncUserRolesToEmployeeHub.js');
      }
      
      console.log('');
    } else if (foundInEmployeeHub < adminUsers.length) {
      console.log('\n⚠️  SOME APPROVERS AVAILABLE BUT NOT ALL');
      console.log('   Run the sync script to fix inactive/missing records:');
      console.log('   node backend/scripts/syncUserRolesToEmployeeHub.js\n');
    } else {
      console.log('\n✅ ALL ADMIN USERS HAVE VALID EMPLOYEEHUB RECORDS');
      console.log('   The approver dropdown should work correctly!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
checkApprovers();
