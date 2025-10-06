const mongoose = require('mongoose');
require('dotenv').config();

async function checkSchemaMappings() {
  console.log('=== SCHEMA AND FIELD MAPPING CHECK ===');
  console.log('Current time:', new Date().toISOString());
  console.log('');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get database instance
    const db = mongoose.connection.db;

    // 1. Check existing collections
    console.log('\n📊 DATABASE COLLECTIONS:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });

    // 2. Check notification schema in database
    if (collections.find(c => c.name === 'notifications')) {
      console.log('\n🔔 NOTIFICATION COLLECTION ANALYSIS:');
      const notifications = await db.collection('notifications').find({}).limit(5).toArray();
      
      if (notifications.length > 0) {
        console.log(`Found ${notifications.length} sample notifications`);
        console.log('Sample notification structure:');
        console.log(JSON.stringify(notifications[0], null, 2));
        
        // Check field consistency
        const fields = Object.keys(notifications[0]);
        console.log('\nFields in database:', fields.join(', '));
        
        // Check for field variations
        const fieldVariations = {
          'read vs isRead': notifications.some(n => n.hasOwnProperty('read')) && notifications.some(n => n.hasOwnProperty('isRead')),
          'createdOn vs createdAt': notifications.some(n => n.hasOwnProperty('createdOn')) && notifications.some(n => n.hasOwnProperty('createdAt')),
          'readOn vs readAt': notifications.some(n => n.hasOwnProperty('readOn')) && notifications.some(n => n.hasOwnProperty('readAt'))
        };
        
        console.log('\nField variations detected:');
        Object.entries(fieldVariations).forEach(([key, hasVariation]) => {
          console.log(`${hasVariation ? '⚠️' : '✅'} ${key}: ${hasVariation ? 'INCONSISTENT' : 'Consistent'}`);
        });
      } else {
        console.log('No notifications found in database');
      }
    } else {
      console.log('⚠️ No notifications collection found');
    }

    // 3. Check user collection
    if (collections.find(c => c.name === 'users')) {
      console.log('\n👤 USER COLLECTION ANALYSIS:');
      const users = await db.collection('users').find({}).limit(3).toArray();
      
      if (users.length > 0) {
        console.log(`Found ${users.length} sample users`);
        const adminUsers = users.filter(u => u.role === 'admin');
        const regularUsers = users.filter(u => u.role === 'user');
        
        console.log(`- Admin users: ${adminUsers.length}`);
        console.log(`- Regular users: ${regularUsers.length}`);
        
        if (adminUsers.length > 0) {
          console.log('Sample admin user fields:', Object.keys(adminUsers[0]).join(', '));
        }
      } else {
        console.log('No users found in database');
      }
    }

    // 4. Check profile collection
    if (collections.find(c => c.name === 'profiles')) {
      console.log('\n📋 PROFILE COLLECTION ANALYSIS:');
      const profiles = await db.collection('profiles').find({}).limit(3).toArray();
      
      if (profiles.length > 0) {
        console.log(`Found ${profiles.length} sample profiles`);
        console.log('Sample profile fields:', Object.keys(profiles[0]).join(', '));
        
        // Check if profiles have userId field
        const profilesWithUserId = profiles.filter(p => p.userId);
        console.log(`Profiles with userId: ${profilesWithUserId.length}/${profiles.length}`);
      } else {
        console.log('No profiles found in database');
      }
    }

    // 5. Check certificate collection
    if (collections.find(c => c.name === 'certificates')) {
      console.log('\n📜 CERTIFICATE COLLECTION ANALYSIS:');
      const certificates = await db.collection('certificates').find({}).limit(3).toArray();
      
      if (certificates.length > 0) {
        console.log(`Found ${certificates.length} sample certificates`);
        console.log('Sample certificate fields:', Object.keys(certificates[0]).join(', '));
        
        // Check certificate-profile relationships
        const certsWithProfileId = certificates.filter(c => c.profileId);
        console.log(`Certificates with profileId: ${certsWithProfileId.length}/${certificates.length}`);
        
        // Check for expiring certificates
        const now = new Date();
        const expiringCerts = certificates.filter(c => {
          if (!c.expiryDate) return false;
          const expiryDate = new Date(c.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        });
        
        const expiredCerts = certificates.filter(c => {
          if (!c.expiryDate) return false;
          const expiryDate = new Date(c.expiryDate);
          return expiryDate < now;
        });
        
        console.log(`Certificates expiring in 30 days: ${expiringCerts.length}`);
        console.log(`Expired certificates: ${expiredCerts.length}`);
      } else {
        console.log('No certificates found in database');
      }
    }

    console.log('\n🔍 FRONTEND-BACKEND MAPPING CHECK:');
    console.log('Expected frontend notification fields:');
    console.log('- id (maps to _id)');
    console.log('- title (maps to title or message)');
    console.log('- message (maps to message)');
    console.log('- type (maps to type)');
    console.log('- priority (maps to priority)');
    console.log('- read (maps to read field)');
    console.log('- status (computed from read field)');
    console.log('- date (maps to createdOn)');
    console.log('- createdAt (maps to createdOn)');
    console.log('- metadata (maps to metadata)');

    console.log('\n📡 API ENDPOINT CHECK:');
    console.log('Notification API endpoints that should exist:');
    console.log('- GET /api/notifications (get user notifications)');
    console.log('- GET /api/notifications/unread-count (get unread count)');
    console.log('- GET /api/notifications/:userId/unread-count (get user unread count)');
    console.log('- PUT /api/notifications/:id/read (mark as read)');
    console.log('- PUT /api/notifications/mark-all-read (mark all as read)');
    console.log('- POST /api/notifications (create notification)');

    console.log('\n✅ Schema mapping check complete!');

  } catch (error) {
    console.error('❌ Schema check failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the check
checkSchemaMappings().catch(error => {
  console.error('Schema check script error:', error);
  process.exit(1);
});
