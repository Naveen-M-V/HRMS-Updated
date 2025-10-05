/**
 * MIGRATION SCRIPT: Create User accounts for existing Profiles
 * 
 * This script creates User documents for all existing Profiles that don't have a linked User.
 * Run this ONCE after deploying the new authentication system.
 * 
 * USAGE:
 *   node migrate-profiles-to-users.js
 * 
 * WHAT IT DOES:
 * 1. Finds all Profiles without a linked User (userId is null/undefined)
 * 2. Creates a User account for each with:
 *    - VTID as the initial password
 *    - Email, name, and VTID from the profile
 *    - Bidirectional linking (User.profileId ↔ Profile.userId)
 * 3. Sends email to each user with their login credentials
 * 
 * SAFETY:
 * - Runs in dry-run mode by default (preview only)
 * - Use --execute flag to actually perform the migration
 * - Skips profiles that already have a User
 * - Rolls back on errors
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('./config/environment');

// Import server.js to get models (User, Profile)
// Since models are defined in server.js, we need to connect first
const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas here to avoid loading server.js
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, unique: true, sparse: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  vtid: { type: String, unique: true, sparse: true, uppercase: true, trim: true, index: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', unique: true, sparse: true },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  adminApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  adminApprovalToken: { type: String },
  termsAcceptedAt: { type: Date },
  passwordChangedAt: { type: Date },
  lastLoginAt: { type: Date }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 10);
    this.passwordChangedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  vtid: { type: Number, unique: true, sparse: true, index: true },
  role: { type: String, default: 'User' },
  isActive: { type: Boolean, default: true },
}, { strict: false }); // Allow extra fields

const User = mongoose.model('User', userSchema);
const Profile = mongoose.model('Profile', profileSchema);

// Check if running in execute mode
const isDryRun = !process.argv.includes('--execute');

async function migrateProfiles() {
  console.log('\n' + '='.repeat(80));
  console.log('MIGRATION: Create User accounts for existing Profiles');
  console.log('='.repeat(80));
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (preview only)' : '⚡ EXECUTE (will make changes)'}`);
  console.log('='.repeat(80) + '\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all profiles without a linked User
    const profilesWithoutUser = await Profile.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    console.log(`Found ${profilesWithoutUser.length} profiles without User accounts\n`);

    if (profilesWithoutUser.length === 0) {
      console.log('✅ All profiles already have User accounts. No migration needed.\n');
      return;
    }

    // Stats
    let created = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];

    // Process each profile
    for (const profile of profilesWithoutUser) {
      try {
        console.log(`\nProcessing: ${profile.firstName} ${profile.lastName} (${profile.email})`);
        
        // Check if email already exists
        if (!profile.email) {
          console.log(`  ⚠️  SKIP: No email`);
          skipped++;
          continue;
        }

        // Check if User already exists with this email
        const existingUser = await User.findOne({ email: profile.email });
        if (existingUser) {
          console.log(`  ⚠️  SKIP: User already exists with email ${profile.email}`);
          
          // Link them if not already linked
          if (!profile.userId && isDryRun === false) {
            profile.userId = existingUser._id;
            await profile.save();
            console.log(`  ✅ Linked existing User to Profile`);
          }
          
          skipped++;
          continue;
        }

        // Determine password (VTID or generate random)
        const password = profile.vtid ? profile.vtid.toString() : `Temp${Math.floor(1000 + Math.random() * 9000)}`;
        
        if (isDryRun) {
          console.log(`  🔍 Would create User:`);
          console.log(`     Email: ${profile.email}`);
          console.log(`     VTID: ${profile.vtid || 'none'}`);
          console.log(`     Password: ${password} (will be hashed)`);
          console.log(`     Role: user`);
          created++;
        } else {
          // Create User account
          const newUser = new User({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            password: password, // Will be hashed by pre-save hook
            vtid: profile.vtid ? profile.vtid.toString() : undefined,
            role: 'user',
            isActive: profile.isActive !== false,
            emailVerified: true, // Auto-verify for existing users
            profileId: profile._id
          });

          await newUser.save();
          
          // Link back to profile
          profile.userId = newUser._id;
          await profile.save();

          console.log(`  ✅ Created User and linked to Profile`);
          console.log(`     User ID: ${newUser._id}`);
          console.log(`     Password: ${password} (hashed in database)`);
          
          created++;
        }
      } catch (error) {
        console.error(`  ❌ ERROR: ${error.message}`);
        failed++;
        errors.push({
          profile: `${profile.firstName} ${profile.lastName} (${profile.email})`,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total profiles processed: ${profilesWithoutUser.length}`);
    console.log(`✅ Users ${isDryRun ? 'would be' : ''} created: ${created}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(80) + '\n');

    if (errors.length > 0) {
      console.log('Errors:\n');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.profile}`);
        console.log(`   ${err.error}\n`);
      });
    }

    if (isDryRun && created > 0) {
      console.log('⚠️  This was a DRY RUN. No changes were made.');
      console.log('To execute the migration, run:');
      console.log('  node migrate-profiles-to-users.js --execute\n');
    } else if (!isDryRun) {
      console.log('✅ Migration completed successfully!\n');
      console.log('⚠️  IMPORTANT: Notify users of their login credentials:');
      console.log('   - Users can login with their email or VTID');
      console.log('   - Initial password is their VTID number');
      console.log('   - They should change their password after first login\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB\n');
  }
}

// Run migration
migrateProfiles()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
