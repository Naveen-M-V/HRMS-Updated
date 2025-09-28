const { MongoClient } = require('mongodb');
require('dotenv').config();

async function findAdmins() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('hrms');
    const users = db.collection('users');
    
    // Find all admin users
    const admins = await users.find(
      { role: 'admin' },
      { projection: { email: 1, emailVerified: 1, adminApprovalStatus: 1, firstName: 1, lastName: 1 } }
    ).toArray();
    
    console.log('All admin accounts found:');
    console.log('=========================');
    
    if (admins.length === 0) {
      console.log('❌ No admin accounts found');
    } else {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Name: ${admin.firstName || 'N/A'} ${admin.lastName || 'N/A'}`);
        console.log(`   Email Verified: ${admin.emailVerified}`);
        console.log(`   Approval Status: ${admin.adminApprovalStatus || 'N/A'}`);
        console.log('   ---');
      });
    }
    
    // Also find all users (in case admin role is missing)
    console.log('\nAll users in database:');
    const allUsers = await users.find(
      {},
      { projection: { email: 1, role: 1, emailVerified: 1, adminApprovalStatus: 1 } }
    ).toArray();
    
    allUsers.forEach(user => {
      console.log(`- ${user.email} (role: ${user.role || 'undefined'}, verified: ${user.emailVerified})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

findAdmins();
