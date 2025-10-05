const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔍 Checking Super Admin Accounts...\n');

const checkSuperAdmins = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get User model (assuming it's defined in server.js)
    const userSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      password: String,
      role: String,
      emailVerified: Boolean,
      adminApprovalStatus: String,
      isActive: Boolean,
      createdAt: Date,
      updatedAt: Date
    });

    const User = mongoose.model('User', userSchema);

    // Super admin emails from your .env
    const superAdminEmails = [
      'dean.cumming@vitrux.co.uk',
      'syed.shahab.ahmed@vitrux.co.uk', 
      'tazeen.syeda@vitrux.co.uk',
      'thaya.govzig@vitruxshield.com',
      'syed.ali.asgar@vitruxshield.com',
      'mvnaveen18@gmail.com'
    ];

    console.log('📋 Checking Super Admin Accounts:\n');

    for (const email of superAdminEmails) {
      console.log(`🔍 Checking: ${email}`);
      
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        console.log('✅ Account exists');
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Email Verified: ${user.emailVerified}`);
        console.log(`   Admin Approval: ${user.adminApprovalStatus}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${user.createdAt}`);
        
        // Check if account can login
        const canLogin = user.role === 'admin' && 
                        user.emailVerified === true && 
                        user.adminApprovalStatus === 'approved' && 
                        user.isActive === true;
        
        if (canLogin) {
          console.log('✅ CAN LOGIN - Account is properly configured');
          console.log('🔑 Password should be: TalentShield@2025');
        } else {
          console.log('❌ CANNOT LOGIN - Issues found:');
          if (user.role !== 'admin') console.log('   - Role is not admin');
          if (!user.emailVerified) console.log('   - Email not verified');
          if (user.adminApprovalStatus !== 'approved') console.log('   - Admin approval not approved');
          if (!user.isActive) console.log('   - Account not active');
        }
      } else {
        console.log('❌ Account does not exist');
        console.log('   Need to create this super admin account');
      }
      console.log('');
    }

    // Check for any other admin accounts
    console.log('📊 All Admin Accounts in Database:\n');
    const allAdmins = await User.find({ role: 'admin' }).select('email firstName lastName emailVerified adminApprovalStatus isActive');
    
    if (allAdmins.length === 0) {
      console.log('❌ No admin accounts found in database');
    } else {
      allAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email}`);
        console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
        console.log(`   Verified: ${admin.emailVerified}`);
        console.log(`   Approved: ${admin.adminApprovalStatus}`);
        console.log(`   Active: ${admin.isActive}`);
        console.log('');
      });
    }

    // Test login query
    console.log('🔍 Testing Login Query for .co.uk emails:\n');
    
    const testEmails = [
      'dean.cumming@vitrux.co.uk',
      'DEAN.CUMMING@VITRUX.CO.UK', // Test case sensitivity
      'Dean.Cumming@Vitrux.co.uk'  // Test mixed case
    ];

    for (const testEmail of testEmails) {
      console.log(`Testing: ${testEmail}`);
      
      // This is the exact query from server.js login
      const loginUser = await User.findOne({ 
        $or: [
          { email: { $regex: new RegExp(`^${testEmail.toLowerCase()}$`, 'i') } },
          { username: { $regex: new RegExp(`^${testEmail.toLowerCase()}$`, 'i') } },
          { vtid: { $regex: new RegExp(`^${testEmail.toLowerCase()}$`, 'i') } }
        ]
      });

      if (loginUser) {
        console.log('✅ Found user with login query');
      } else {
        console.log('❌ User not found with login query');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

checkSuperAdmins();
