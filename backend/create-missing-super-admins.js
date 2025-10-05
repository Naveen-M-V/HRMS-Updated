const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

console.log('🔧 Creating Missing Super Admin Accounts...\n');

const createMissingSuperAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define User schema (matching your server.js)
    const userSchema = new mongoose.Schema({
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['user', 'admin'], default: 'user' },
      vtid: { type: String, unique: true, sparse: true, uppercase: true, trim: true, index: true },
      profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', unique: true, sparse: true },
      isActive: { type: Boolean, default: true },
      emailVerified: { type: Boolean, default: false },
      verificationToken: { type: String },
      adminApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      adminApprovalToken: { type: String },
      lastLoginAt: { type: Date },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }, { timestamps: true });

    // Hash password before saving
    userSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
      } catch (error) {
        next(error);
      }
    });

    const User = mongoose.model('User', userSchema);

    // Missing super admin accounts
    const missingSuperAdmins = [
      {
        email: 'dean.cumming@vitrux.co.uk',
        firstName: 'Dean',
        lastName: 'Cumming'
      },
      {
        email: 'syed.shahab.ahmed@vitrux.co.uk', 
        firstName: 'Syed Shahab',
        lastName: 'Ahmed'
      }
    ];

    console.log('📝 Creating missing super admin accounts:\n');

    for (const adminData of missingSuperAdmins) {
      console.log(`🔍 Checking: ${adminData.email}`);
      
      // Check if account already exists
      const existingUser = await User.findOne({ email: adminData.email.toLowerCase() });
      
      if (existingUser) {
        console.log('⚠️  Account already exists, skipping...\n');
        continue;
      }

      // Create new super admin account
      const superAdmin = new User({
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email.toLowerCase(),
        password: 'TalentShield@2025', // Will be hashed by pre-save hook
        role: 'admin',
        isActive: true,
        emailVerified: true, // Auto-verify super admins
        adminApprovalStatus: 'approved' // Auto-approve super admins
      });

      await superAdmin.save();
      console.log(`✅ Created super admin: ${adminData.email}`);
      console.log(`   Name: ${adminData.firstName} ${adminData.lastName}`);
      console.log(`   Password: TalentShield@2025`);
      console.log(`   Status: Verified and Approved`);
      console.log('');
    }

    // Verify all super admins from .env are now in database
    console.log('🔍 Verifying all super admins from .env:\n');
    
    const allSuperAdminEmails = [
      'dean.cumming@vitrux.co.uk',
      'syed.shahab.ahmed@vitrux.co.uk', 
      'tazeen.syeda@vitrux.co.uk',
      'thaya.govzig@vitruxshield.com',
      'syed.ali.asgar@vitruxshield.com',
      'mvnaveen18@gmail.com'
    ];

    for (const email of allSuperAdminEmails) {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        const canLogin = user.role === 'admin' && 
                        user.emailVerified === true && 
                        user.adminApprovalStatus === 'approved' && 
                        user.isActive === true;
        
        console.log(`${canLogin ? '✅' : '❌'} ${email}`);
        console.log(`   Status: ${canLogin ? 'CAN LOGIN' : 'CANNOT LOGIN'}`);
        console.log(`   Password: TalentShield@2025`);
        
        if (!canLogin) {
          console.log(`   Issues: Verified=${user.emailVerified}, Approved=${user.adminApprovalStatus}, Active=${user.isActive}`);
        }
      } else {
        console.log(`❌ ${email} - NOT FOUND`);
      }
      console.log('');
    }

    console.log('🎉 Super admin setup completed!\n');
    console.log('📋 Login Instructions:');
    console.log('• Email: dean.cumming@vitrux.co.uk');
    console.log('• Password: TalentShield@2025');
    console.log('');
    console.log('• Email: syed.shahab.ahmed@vitrux.co.uk');
    console.log('• Password: TalentShield@2025');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.log('💡 This error usually means the account already exists');
    }
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

createMissingSuperAdmins();
