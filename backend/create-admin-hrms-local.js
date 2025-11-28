const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdminInCorrectDB() {
  try {
    console.log('🔗 Connecting to hrms_local database...');
    await mongoose.connect('mongodb+srv://vcard_admin:vcard_2025@cluster0.kzdn0kn.mongodb.net/hrms_local?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to hrms_local');
    
    const db = mongoose.connection.db;
    console.log('📊 Database name:', db.databaseName);
    
    // Delete existing admin if any
    await db.collection('users').deleteOne({ email: 'admin@talentshield.com' });
    
    // Create new admin
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.collection('users').insertOne({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@talentshield.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true,
      adminApprovalStatus: 'approved',
      profileId: new mongoose.Types.ObjectId()
    });
    
    console.log('✅ Admin created in hrms_local:', result.insertedId);
    
    // Verify
    const admin = await db.collection('users').findOne({ email: 'admin@talentshield.com' });
    const isValid = await bcrypt.compare(password, admin.password);
    
    console.log('🔐 Verification result:', isValid);
    console.log('🎉 Admin ready in hrms_local database!');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

createAdminInCorrectDB();
