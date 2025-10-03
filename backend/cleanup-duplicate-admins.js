const { MongoClient } = require('mongodb');
require('dotenv').config();

async function cleanupDuplicateAdmins() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    const dbName = new URL(process.env.MONGODB_URI).pathname.replace(/^\//, '') || 'hrms';
    console.log(`Using database: ${dbName}`);
    const db = client.db(dbName);
    const users = db.collection('users');
    
    // Find and remove duplicate admin accounts with uppercase variations
    const duplicatesToRemove = [
      'Dean.Cumming@vitrux.co.uk',
      'Tazeen.Syeda@vitrux.co.uk'
    ];
    
    console.log('\n🔍 Checking for duplicate admin accounts...\n');
    
    for (const email of duplicatesToRemove) {
      const user = await users.findOne({ email: email });
      if (user) {
        console.log(`Found duplicate: ${email}`);
        console.log(`  - emailVerified: ${user.emailVerified}`);
        console.log(`  - adminApprovalStatus: ${user.adminApprovalStatus}`);
        
        // Check if lowercase version exists
        const lowercaseEmail = email.toLowerCase();
        const lowercaseUser = await users.findOne({ email: lowercaseEmail });
        
        if (lowercaseUser) {
          console.log(`  Lowercase version exists: ${lowercaseEmail}`);
          console.log(`  Deleting uppercase duplicate...`);
          
          await users.deleteOne({ email: email });
          console.log(`  ✅ Deleted ${email}\n`);
        } else {
          console.log(`  ⚠️ No lowercase version found, keeping this one\n`);
        }
      } else {
        console.log(`✓ ${email} not found (already cleaned or doesn't exist)\n`);
      }
    }
    
    console.log('\n📊 Final admin accounts:');
    const allAdmins = await users.find({ role: 'admin' }).toArray();
    console.log(`Total: ${allAdmins.length} admin accounts\n`);
    
    allAdmins.forEach(admin => {
      console.log(`${admin.email}`);
      console.log(`  - emailVerified: ${admin.emailVerified}`);
      console.log(`  - adminApprovalStatus: ${admin.adminApprovalStatus}`);
      console.log(`  - isActive: ${admin.isActive}\n`);
    });
    
    console.log('✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

cleanupDuplicateAdmins();
