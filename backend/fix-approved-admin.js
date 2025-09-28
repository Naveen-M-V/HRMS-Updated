const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const fixApprovedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('Connected to MongoDB');

    // Find the admin that was just approved
    const admin = await User.findOne({ 
      email: 'ministeriesnewlife5@gmail.com',
      adminApprovalStatus: 'approved'
    });

    if (admin) {
      console.log('Found approved admin:', admin.email);
      console.log('Current emailVerified status:', admin.emailVerified);
      
      // Set emailVerified to true
      admin.emailVerified = true;
      await admin.save();
      
      console.log('✅ Admin email verification updated successfully!');
      console.log('Admin can now login without email verification issues.');
    } else {
      console.log('❌ Approved admin not found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixApprovedAdmin();
