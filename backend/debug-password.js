const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function debugPasswordHashing() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test password hashing directly
    const password = 'Admin@123';
    console.log('🔐 Testing password:', password);
    
    // Create multiple hashes to test
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);
    
    console.log('🔐 Hash 1:', hash1);
    console.log('🔐 Hash 2:', hash2);
    
    // Test comparisons
    const test1 = await bcrypt.compare(password, hash1);
    const test2 = await bcrypt.compare(password, hash2);
    
    console.log('✅ Test 1 (should be true):', test1);
    console.log('✅ Test 2 (should be true):', test2);
    
    // Test with different password
    const testWrong = await bcrypt.compare('WrongPassword', hash1);
    console.log('❌ Test wrong (should be false):', testWrong);
    
    // Now test with the actual database
    console.log('\n👤 Testing with database...');
    
    // Delete and recreate admin
    await mongoose.connection.db.collection('users').deleteOne({ email: 'admin@talentshield.com' });
    
    const finalHash = await bcrypt.hash(password, 10);
    console.log('🔐 Final hash:', finalHash);
    
    // Insert directly into database
    const insertResult = await mongoose.connection.db.collection('users').insertOne({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@talentshield.com',
      password: finalHash,
      role: 'admin',
      isActive: true,
      emailVerified: true,
      adminApprovalStatus: 'approved',
      profileId: new mongoose.Types.ObjectId()
    });
    
    console.log('✅ Insert result:', insertResult.insertedId);
    
    // Test the database user
    const dbUser = await mongoose.connection.db.collection('users').findOne({ email: 'admin@talentshield.com' });
    const dbTest = await bcrypt.compare(password, dbUser.password);
    
    console.log('🔐 Database test result:', dbTest);
    console.log('🔐 DB password length:', dbUser.password.length);
    console.log('🔐 DB password starts:', dbUser.password.substring(0, 10));
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

debugPasswordHashing();
