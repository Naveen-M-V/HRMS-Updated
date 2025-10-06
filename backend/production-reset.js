const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const productionReset = async () => {
  try {
    console.log('🚀 HRMS Production Reset - Starting...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      if (!collection.name.startsWith('system.')) {
        await mongoose.connection.db.collection(collection.name).drop();
        console.log(`✅ Cleared: ${collection.name}`);
      }
    }

    // Create User Schema
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
      lastLoginAt: { type: Date }
    }, { timestamps: true });

    userSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    });

    const User = mongoose.model('User', userSchema);

    // Create super admin accounts
    const superAdmins = [
      { email: 'dean.cumming@vitrux.co.uk', firstName: 'Dean', lastName: 'Cumming' },
      { email: 'syed.shahab.ahmed@vitrux.co.uk', firstName: 'Syed Shahab', lastName: 'Ahmed' },
      { email: 'tazeen.syeda@vitrux.co.uk', firstName: 'Tazeen', lastName: 'Syeda' },
      { email: 'thaya.govzig@vitruxshield.com', firstName: 'Thaya', lastName: 'Govzig' },
      { email: 'syed.ali.asgar@vitruxshield.com', firstName: 'Syed Ali', lastName: 'Asgar' },
      { email: 'mvnaveen18@gmail.com', firstName: 'Naveen', lastName: 'MV' },
      { email: 'joseph.byrne@vitrux.co.uk', firstName: 'Joseph', lastName: 'Byrne' }
    ];

    for (const admin of superAdmins) {
      await new User({
        ...admin,
        password: 'TalentShield@2025',
        role: 'admin',
        isActive: true,
        emailVerified: true,
        adminApprovalStatus: 'approved'
      }).save();
      console.log(`✅ Created: ${admin.email}`);
    }

    // Test email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: { rejectUnauthorized: false }
    });

    await transporter.verify();
    console.log('✅ Email service verified');

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'thaya.govzig@vitruxshield.com',
      subject: 'HRMS Production Ready',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#10b981;color:white;padding:20px;text-align:center">
            <h1>✅ HRMS Production Ready</h1>
          </div>
          <div style="padding:20px;background:#f9f9f9">
            <p><strong>Database reset completed successfully!</strong></p>
            <p><strong>Super admin accounts created:</strong></p>
            <ul>${superAdmins.map(a => `<li>${a.email}</li>`).join('')}</ul>
            <p><strong>Password:</strong> TalentShield@2025</p>
            <p><strong>Email service:</strong> Working</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    });
    console.log('✅ Test email sent');

    console.log('\n🎉 PRODUCTION RESET COMPLETE');
    console.log('🔑 Login with any super admin email + password: TalentShield@2025');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

productionReset();
