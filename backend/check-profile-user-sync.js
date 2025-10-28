const mongoose = require('mongoose');
require('dotenv').config();

async function checkProfileUserSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('✅ Connected to MongoDB\n');

    const User = require('./models/User');
    const Profile = mongoose.model('Profile');

    const profiles = await Profile.find({}).select('_id userId firstName lastName email').lean();
    const users = await User.find({}).select('_id email firstName lastName role').lean();

    console.log('📊 DATABASE STATUS:\n');
    console.log(`   Profiles: ${profiles.length}`);
    console.log(`   Users: ${users.length}\n`);

    console.log('═'.repeat(80));
    console.log('PROFILE → USER MAPPING');
    console.log('═'.repeat(80) + '\n');

    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. Profile: "${profile.firstName} ${profile.lastName}" (${profile.email})`);
      console.log(`   Profile ID: ${profile._id}`);
      console.log(`   User ID: ${profile.userId || 'NULL'}`);
      
      if (!profile.userId) {
        console.log(`   ⚠️  STATUS: NO USER LINKED - Profile has no userId`);
        console.log(`   💡 FIX: Need to create User or link to existing User`);
      } else {
        const userId = profile.userId.toString();
        const linkedUser = userMap.get(userId);
        
        if (linkedUser) {
          console.log(`   ✅ STATUS: LINKED to User "${linkedUser.firstName} ${linkedUser.lastName}"`);
          console.log(`   📧 User Email: ${linkedUser.email}`);
          console.log(`   👤 User Role: ${linkedUser.role}`);
        } else {
          console.log(`   ❌ STATUS: BROKEN LINK - User ${userId} doesn't exist`);
          console.log(`   💡 FIX: userId points to deleted/non-existent user`);
        }
      }
      console.log('   ' + '─'.repeat(76) + '\n');
    });

    console.log('═'.repeat(80));
    console.log('SUMMARY');
    console.log('═'.repeat(80) + '\n');

    const linked = profiles.filter(p => p.userId && userMap.has(p.userId.toString())).length;
    const noUserId = profiles.filter(p => !p.userId).length;
    const brokenLink = profiles.filter(p => p.userId && !userMap.has(p.userId.toString())).length;

    console.log(`✅ Properly Linked: ${linked} profiles`);
    console.log(`⚠️  No userId: ${noUserId} profiles`);
    console.log(`❌ Broken Links: ${brokenLink} profiles`);
    console.log(`📊 Total Profiles: ${profiles.length}\n`);

    if (noUserId > 0 || brokenLink > 0) {
      console.log('🔧 RECOMMENDED ACTIONS:\n');
      
      if (noUserId > 0) {
        console.log(`   1. Create User accounts for ${noUserId} profile(s) without userId`);
        console.log(`      OR link them to existing users by email match\n`);
      }
      
      if (brokenLink > 0) {
        console.log(`   2. Run: node fix-profile-user-link.js`);
        console.log(`      This will auto-fix broken links by matching emails\n`);
      }
      
      console.log(`   3. After fixing, all ${profiles.length} profiles will show in Clock-ins`);
    } else {
      console.log('✅ All profiles are properly linked!');
      console.log(`   All ${profiles.length} profiles should show in Clock-ins page`);
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

checkProfileUserSync();
