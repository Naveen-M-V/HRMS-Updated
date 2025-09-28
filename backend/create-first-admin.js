const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createFirstAdmin() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    const db = client.db('hrms');
    const users = db.collection('users');
    
    // Check if any admin exists
    const existingAdmin = await users.findOne({ email: 'sanjaymaheshwaran024@gmail.com' });
    if (existingAdmin) {
      console.log('Admin already exists, updating verification status...');
      await users.updateOne(
        { email: 'sanjaymaheshwaran024@gmail.com' },
        { $set: { emailVerified: true, adminApprovalStatus: 'approved' } }
      );
      console.log('✅ Admin verification status updated');
    } else {
      console.log('Creating your first admin account...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = {
        email: 'sanjaymaheshwaran024@gmail.com',
        password: hashedPassword,
        firstName: 'Sanjay',
        lastName: 'Maheshwaran',
        role: 'admin',
        emailVerified: true,
        adminApprovalStatus: 'approved',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await users.insertOne(adminUser);
      console.log('✅ First admin account created successfully!');
      console.log('📧 Email: sanjaymaheshwaran024@gmail.com');
      console.log('🔑 Password: admin123');
      console.log('🆔 User ID:', result.insertedId);
    }
    
    // Verify the admin was created/updated
    const admin = await users.findOne({ email: 'sanjaymaheshwaran024@gmail.com' });
    console.log('\n📊 Admin account status:');
    console.log('- Email:', admin.email);
    console.log('- Role:', admin.role);
    console.log('- Email Verified:', admin.emailVerified);
    console.log('- Approval Status:', admin.adminApprovalStatus);
    console.log('- Active:', admin.isActive);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

createFirstAdmin();
