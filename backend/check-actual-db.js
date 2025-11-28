const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkActualDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB using backend config...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to:', process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    console.log('📊 Database name:', db.databaseName);
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
    // Check users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log('👥 Users count:', usersCount);
    
    // Find admin user
    const admin = await db.collection('users').findOne({ email: 'admin@talentshield.com' });
    
    if (admin) {
      console.log('👤 Found admin:', {
        email: admin.email,
        role: admin.role,
        passwordLength: admin.password?.length,
        passwordStart: admin.password?.substring(0, 10)
      });
      
      // Test password
      const testResult = await bcrypt.compare('Admin@123', admin.password);
      console.log('🔐 Password test:', testResult);
      
      if (!testResult) {
        console.log('🔄 Fixing password...');
        const newHash = await bcrypt.hash('Admin@123', 10);
        await db.collection('users').updateOne(
          { email: 'admin@talentshield.com' },
          { $set: { password: newHash } }
        );
        console.log('✅ Password updated');
        
        // Test again
        const updatedAdmin = await db.collection('users').findOne({ email: 'admin@talentshield.com' });
        const finalTest = await bcrypt.compare('Admin@123', updatedAdmin.password);
        console.log('🔐 Final test:', finalTest);
      }
    } else {
      console.log('❌ Admin not found in database');
      
      // Create admin directly
      console.log('👤 Creating admin...');
      const hash = await bcrypt.hash('Admin@123', 10);
      const result = await db.collection('users').insertOne({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@talentshield.com',
        password: hash,
        role: 'admin',
        isActive: true,
        emailVerified: true,
        adminApprovalStatus: 'approved',
        profileId: new mongoose.Types.ObjectId()
      });
      console.log('✅ Admin created:', result.insertedId);
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

checkActualDatabase();
