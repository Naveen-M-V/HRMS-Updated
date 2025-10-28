const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('firstName lastName email role vtid').lean();
    
    console.log(`📊 Total Users in Database: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database!');
      console.log('   This is why you see empty data in the frontend.');
      mongoose.disconnect();
      return;
    }

    console.log('👥 Users List:');
    console.log('━'.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   VTID: ${user.vtid || 'Not set'}`);
      console.log('   ' + '─'.repeat(76));
    });

    // Check for non-admin users (these show in clock-ins)
    const employees = users.filter(u => u.role !== 'admin');
    console.log(`\n📋 Employees (non-admin): ${employees.length}`);
    
    if (employees.length === 0) {
      console.log('⚠️  No employee users found!');
      console.log('   Only admin users exist. Clock-ins page will show "No Employees Found".');
    }

    // Check for test/demo emails
    const testEmails = ['test@', 'demo@', 'sample@', 'example@'];
    const testUsers = users.filter(u => testEmails.some(t => u.email.includes(t)));
    
    if (testUsers.length > 0) {
      console.log(`\n🧪 Test/Demo Users Found: ${testUsers.length}`);
      testUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
      });
      console.log('\n💡 To remove test users, delete them from MongoDB or use the cleanup script.');
    }

    mongoose.disconnect();
    console.log('\n✅ Check complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
  }
}

checkUsers();
