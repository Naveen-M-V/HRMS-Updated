const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixAdmin() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully');
    
    const db = client.db('hrms');
    const users = db.collection('users');
    
    // First, check current status
    const currentAdmin = await users.findOne(
      { email: 'ministeriesnewlife5@gmail.com' },
      { projection: { email: 1, emailVerified: 1, adminApprovalStatus: 1, firstName: 1, lastName: 1 } }
    );
    
    console.log('Current admin status:', currentAdmin);
    
    if (currentAdmin) {
      // Update the admin
      const result = await users.updateOne(
        { email: 'ministeriesnewlife5@gmail.com' },
        { $set: { emailVerified: true } }
      );
      
      console.log('Update result:', result);
      
      // Verify the update
      const updatedAdmin = await users.findOne(
        { email: 'ministeriesnewlife5@gmail.com' },
        { projection: { email: 1, emailVerified: 1, adminApprovalStatus: 1 } }
      );
      
      console.log('✅ Updated admin status:', updatedAdmin);
      console.log('✅ Admin can now login successfully!');
    } else {
      console.log('❌ Admin not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

fixAdmin();
