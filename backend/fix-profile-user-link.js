const mongoose = require('mongoose');
require('dotenv').config();

async function fixProfileUserLink() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('✅ Connected to MongoDB\n');

    const User = require('./models/User');
    const Profile = mongoose.model('Profile');

    // Get all profiles
    const profiles = await Profile.find({}).lean();
    console.log(`📋 Found ${profiles.length} profiles\n`);

    // Get all users
    const users = await User.find({}).select('_id email firstName lastName').lean();
    console.log(`👥 Found ${users.length} users\n`);

    const userIdSet = new Set(users.map(u => u._id.toString()));

    console.log('🔍 Checking Profile → User linkage...\n');

    let fixedCount = 0;
    let orphanedCount = 0;

    for (const profile of profiles) {
      const profileUserId = profile.userId?.toString();
      
      if (!profileUserId) {
        console.log(`❌ Profile "${profile.firstName} ${profile.lastName}" has NO userId`);
        console.log(`   Email: ${profile.email}`);
        
        // Try to find matching user by email
        const matchingUser = users.find(u => u.email === profile.email);
        
        if (matchingUser) {
          console.log(`   ✅ Found matching user by email: ${matchingUser._id}`);
          console.log(`   🔧 Updating profile...`);
          
          await Profile.findByIdAndUpdate(profile._id, {
            userId: matchingUser._id
          });
          
          fixedCount++;
          console.log(`   ✅ Fixed!\n`);
        } else {
          console.log(`   ⚠️  No matching user found - ORPHANED PROFILE\n`);
          orphanedCount++;
        }
      } else if (!userIdSet.has(profileUserId)) {
        console.log(`❌ Profile "${profile.firstName} ${profile.lastName}" links to non-existent user`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Bad userId: ${profileUserId}`);
        
        // Try to find matching user by email
        const matchingUser = users.find(u => u.email === profile.email);
        
        if (matchingUser) {
          console.log(`   ✅ Found matching user by email: ${matchingUser._id}`);
          console.log(`   🔧 Updating profile...`);
          
          await Profile.findByIdAndUpdate(profile._id, {
            userId: matchingUser._id
          });
          
          fixedCount++;
          console.log(`   ✅ Fixed!\n`);
        } else {
          console.log(`   ⚠️  No matching user found - ORPHANED PROFILE\n`);
          orphanedCount++;
        }
      } else {
        console.log(`✅ Profile "${profile.firstName} ${profile.lastName}" → User link OK`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} profiles`);
    console.log(`   ⚠️  Orphaned: ${orphanedCount} profiles (no matching user)`);
    console.log(`   Total profiles: ${profiles.length}`);
    console.log('='.repeat(60) + '\n');

    if (fixedCount > 0) {
      console.log('✅ Profile-User links have been fixed!');
      console.log('   Try assigning shifts again.');
    }

    if (orphanedCount > 0) {
      console.log('\n⚠️  WARNING: Some profiles have no matching users.');
      console.log('   These need to be fixed manually or users need to be created.');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

fixProfileUserLink();
