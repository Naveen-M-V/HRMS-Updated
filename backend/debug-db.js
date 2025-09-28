const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debugDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  console.log('MongoDB URI found:', mongoUri ? 'Yes' : 'No');
  
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected successfully to Atlas');
    
    // Check the hrms database specifically
    const db = client.db('hrms');
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in hrms database:');
    if (collections.length === 0) {
      console.log('❌ No collections found in hrms database');
    } else {
      for (const collection of collections) {
        console.log(`- ${collection.name}`);
        const count = await db.collection(collection.name).countDocuments();
        console.log(`  Documents: ${count}`);
      }
    }
    
    // Try to find any users
    const users = db.collection('users');
    const userCount = await users.countDocuments();
    console.log(`\nTotal users in users collection: ${userCount}`);
    
    if (userCount > 0) {
      const allUsers = await users.find({}).toArray();
      console.log('\nAll users found:');
      allUsers.forEach(user => {
        console.log(`- ${user.email} (role: ${user.role || 'undefined'}, verified: ${user.emailVerified})`);
      });
    } else {
      console.log('❌ No users found in database');
      console.log('📝 You need to create your first admin account');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.close();
  }
}

debugDatabase();
