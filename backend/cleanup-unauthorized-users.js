const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define User schema (simplified)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  role: String,
  isActive: Boolean
});

const User = mongoose.model('User', userSchema);

// Unauthorized accounts to remove
const unauthorizedEmails = [
  'kaveen@gmail.com',
  'kanchkaveen12@gmail.com',
  'anah@gmail.com',
  'naveen@gmail.com',
  'ministriesnewlife5@gmail.com',
  'rosi.mahesh20@gmail.com',
  'quotesforlife718@gmail.com',
  'rootlinkevents@gmail.com',
  'praveen123@gmail.com',
  'karthiramesh04356@gmail.com',
  'rosim5137@gmail.com',
  'sanjay@gmail.com',
  'freefirechallenger@gmail.com',
  'sanjaymaheshwaran0124@gmail.com',
  'stdntsanjay@gmail.com',
  'vkaveen6@gmail.com',
  'najaguhan20@gmail.com',
  's7904797@gmail.com',
  'sanjaymaheswaran0124@gmail.com',
  'sanjaymaheshwaran@gmail.com',
  'jleraj@gmail.com',
  'sanjaymaheswaran@gmail.com'
];

// Super admin accounts (authorized)
const superAdminEmails = [
  'dean.cumming@vitrux.co.uk',
  'syed.shahab.ahmed@vitrux.co.uk',
  'tazeen.syeda@vitrux.co.uk',
  'thaya.govzig@vitruxshield.com',
  'syed.ali.asgar@vitruxshield.com',
  'mvnaveen18@gmail.com'
];

async function cleanupUnauthorizedUsers() {
  try {
    console.log('🧹 Starting unauthorized user cleanup...');
    
    // Find and remove unauthorized accounts
    const result = await User.deleteMany({
      email: { $in: unauthorizedEmails }
    });
    
    console.log(`✅ Removed ${result.deletedCount} unauthorized accounts`);
    
    // List remaining users
    const remainingUsers = await User.find({}, 'firstName lastName email role isActive');
    console.log('\n📋 Remaining user accounts:');
    remainingUsers.forEach(user => {
      const status = superAdminEmails.includes(user.email) ? '🔑 SUPER ADMIN' : 
                    user.role === 'admin' ? '👨‍💼 ADMIN' : '👤 USER';
      console.log(`${status} - ${user.firstName} ${user.lastName} (${user.email}) - Active: ${user.isActive}`);
    });
    
    // Ensure super admins exist and are properly configured
    console.log('\n🔑 Checking super admin accounts...');
    for (const email of superAdminEmails) {
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`⚠️  Super admin not found: ${email} - Need to create account`);
      } else if (user.role !== 'admin') {
        await User.updateOne({ email }, { role: 'admin', isActive: true });
        console.log(`✅ Updated ${email} to admin role`);
      } else {
        console.log(`✅ Super admin confirmed: ${email}`);
      }
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run cleanup
cleanupUnauthorizedUsers();
