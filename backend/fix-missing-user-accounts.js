// Script to create missing User accounts for existing Profiles
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import models (simplified for this script)
const userSchema = new mongoose.Schema({}, { strict: false });
const profileSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);

async function createMissingUserAccounts() {
  try {
    console.log('\n=== CREATING MISSING USER ACCOUNTS ===\n');
    
    // Find all profiles
    const allProfiles = await Profile.find({});
    console.log(`Found ${allProfiles.length} profiles`);
    
    let created = 0;
    let skipped = 0;
    
    for (const profile of allProfiles) {
      // Check if User account exists
      const existingUser = await User.findOne({ email: profile.email });
      
      if (!existingUser) {
        console.log(`Creating User account for: ${profile.email}`);
        
        // Generate password using VTID (same logic as in server.js)
        const password = profile.vtid ? profile.vtid.toString() : 'TempPass123';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        try {
          await User.create({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            password: hashedPassword,
            role: 'user',
            vtid: profile.vtid?.toString(),
            profileId: profile._id,
            isActive: true,
            emailVerified: true,
            adminApprovalStatus: 'approved'
          });
          
          console.log(`✅ Created User account for ${profile.email}`);
          created++;
          
        } catch (createError) {
          console.log(`❌ Failed to create User account for ${profile.email}:`, createError.message);
        }
        
      } else {
        skipped++;
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Created: ${created} user accounts`);
    console.log(`Skipped: ${skipped} (already existed)`);
    console.log(`Total: ${allProfiles.length} profiles processed`);
    
  } catch (error) {
    console.error('Error creating user accounts:', error);
  } finally {
    mongoose.connection.close();
  }
}

createMissingUserAccounts();
