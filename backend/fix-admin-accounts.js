const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔧 Fixing Existing Admin Account Issues...\n');

const fixAdminAccounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema);

    // Fix accounts with undefined emailVerified or adminApprovalStatus
    console.log('🔍 Fixing accounts with undefined status fields:\n');

    // Fix admin@talentshield.com (has undefined fields)
    const adminUser = await User.findOne({ email: 'admin@talentshield.com' });
    if (adminUser) {
      console.log('🔧 Fixing admin@talentshield.com');
      await User.updateOne(
        { email: 'admin@talentshield.com' },
        { 
          $set: { 
            emailVerified: true,
            adminApprovalStatus: 'approved'
          }
        }
      );
      console.log('✅ Fixed admin@talentshield.com - now verified and approved\n');
    }

    // List all super admin emails that should be approved
    const superAdminEmails = [
      'dean.cumming@vitrux.co.uk',
      'syed.shahab.ahmed@vitrux.co.uk', 
      'tazeen.syeda@vitrux.co.uk',
      'thaya.govzig@vitruxshield.com',
      'syed.ali.asgar@vitruxshield.com',
      'mvnaveen18@gmail.com',
      'admin@talentshield.com'
    ];

    console.log('🔧 Ensuring all super admins are properly configured:\n');

    for (const email of superAdminEmails) {
      const result = await User.updateOne(
        { email: email.toLowerCase() },
        { 
          $set: { 
            emailVerified: true,
            adminApprovalStatus: 'approved',
            isActive: true
          }
        }
      );

      if (result.matchedCount > 0) {
        console.log(`✅ Updated ${email} - verified and approved`);
      } else {
        console.log(`⚠️  ${email} - not found in database`);
      }
    }

    console.log('\n📊 Final status check:\n');

    // Check final status of all super admins
    for (const email of superAdminEmails) {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        const canLogin = user.role === 'admin' && 
                        user.emailVerified === true && 
                        user.adminApprovalStatus === 'approved' && 
                        user.isActive === true;
        
        console.log(`${canLogin ? '✅' : '❌'} ${email}`);
        console.log(`   Can Login: ${canLogin ? 'YES' : 'NO'}`);
        console.log(`   Password: TalentShield@2025`);
        
        if (!canLogin) {
          console.log(`   Issues: Role=${user.role}, Verified=${user.emailVerified}, Approved=${user.adminApprovalStatus}, Active=${user.isActive}`);
        }
      } else {
        console.log(`❌ ${email} - NOT FOUND`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

fixAdminAccounts();
