const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Comprehensive data population script for HRMS
 * Populates all essential data needed for site functionality
 */
const populateComprehensiveData = async () => {
  try {
    console.log('🚀 HRMS Comprehensive Data Population - Starting...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define schemas (matching your current system)
    const jobRoleSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      description: String,
      isActive: { type: Boolean, default: true },
      createdOn: { type: Date, default: Date.now },
      updatedOn: { type: Date, default: Date.now }
    });

    const jobTitleSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      description: String,
      isActive: { type: Boolean, default: true },
      createdOn: { type: Date, default: Date.now },
      updatedOn: { type: Date, default: Date.now }
    });

    const jobLevelSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      description: String,
      isActive: { type: Boolean, default: true },
      usageCount: { type: Number, default: 1 }
    });

    const supplierSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      description: String,
      createdOn: { type: Date, default: Date.now },
      updatedOn: { type: Date, default: Date.now }
    });

    // Certificate names schema not needed - users enter names manually

    // Create models
    const JobRole = mongoose.model('JobRole', jobRoleSchema);
    const JobTitle = mongoose.model('JobTitle', jobTitleSchema);
    const JobLevel = mongoose.model('JobLevel', jobLevelSchema);
    const Supplier = mongoose.model('Supplier', supplierSchema);

    // Comprehensive job roles from your system (93 roles)
    const jobRoles = [
      "Spine Survey", "Heavy Cabling UG", "Cable Blowing", "Overblow",
      "Fibre Jointing (Ladder)", "Fibre Jointing (MEWP)", "Fibre Light Loss Testing (Ladder)",
      "Fibre Light Loss Testing (MEWP)", "Fibre Jointing - UG only", "Ribbon Fibre Jointing",
      "OFN Fibre Cabling - UG", "OFN Fibre Cabling - OH (Ladder)", "OFN Fibre Cabling - OH (MEWP)",
      "Rod and Rope", "FTTP Access Survey - 2", "FTTP Quality Checks - 2", "MDU Survey",
      "MDU Quality Checks", "MDU L2C", "Internal MDU Build", "FTTP L2C Home Install",
      "FTTP L2C step 1 (Ladder)", "FTTP L2C step 1 (MEWP)", "FTTP L2C step 1 - OH only (Ladder)",
      "FTTP L2C step 1 - OH only (MEWP)", "FTTP L2C repair (Ladder)", "FTTP L2C repair (MEWP)",
      "FTTP L2C Step 2", "Optical Test Head Installation - Viavi", "Optical Test Head Installation - Exfo",
      "PTO", "Supervisor - 2", "Poling - PEU Operative", "Poling - Overhead Copper dropwiring (Ladder)",
      "Poling - Overhead Copper dropwiring (MEWP)", "Poling - Overhead Copper Jointing (Ladder)",
      "Poling - Overhead Copper Jointing (MEWP)", "MEWP Operator", "Manual poling (provision and recovery)",
      "Pole recovery", "Pole Survey (AAP)", "Aerial cabling (Ladder)", "Aerial cabling (MEWP)",
      "Poling Labourer", "Blockages", "Chambers Modular", "Chambers Concrete", "Chambers Concrete advanced",
      "Carriageway Chambers", "Chambers Brick", "Manhole build", "Manhole Reroof", "Duct Laying Basic",
      "Duct Laying Intermediate", "Duct Laying Advanced", "Duct Slew Basic", "Duct Slew Intermediate",
      "Duct Slew Advanced", "Mole ploughing", "Maintenance Excavation", "Reinstatement Operative - Footway",
      "Reinstatement Operative - Carriageway", "Frame and Cover footway", "Frame and Cover Carriageway",
      "DSLAM Construction", "PCP Construction", "Desilting, Gully sucking or Manhole survey",
      "Narrow Trenching", "Labourer", "Trial Hole Excavation", "FTTC Commissioning", "Copper Frames",
      "Fibre Frames - Accredited for correct frame type", "CAL/OMI (Ladder)", "CAL/OMI (MEWP)",
      "Copper jointing UG", "Copper first look UG", "FTTC MI (Ladder)", "FTTC MI (MEWP)", "FTTC SI",
      "PCP Maintenance", "Heavy cable recovery", "Supply and Install Engineer",
      "Supply and Install - fibre cable installation", "Supply and Install - Mobile installation",
      "Supply and Install - Civils", "Ancillary Wiring or LLU Cabling", "Auxillary Overhead",
      "DSLAM Power Meter", "DSLAM - Power (RCD)", "DSLAM Battery replacement or rotation",
      "Conductive Concrete", "Equipotential Bonding"
    ];

    // Job titles
    const jobTitles = [
      "Engineer", "Senior Engineer", "Lead Engineer", "Principal Engineer",
      "Technician", "Senior Technician", "Lead Technician", "Principal Technician",
      "Operator", "Senior Operator", "Supervisor", "Team Leader", "Manager",
      "Senior Manager", "Project Manager", "Site Manager", "Operations Manager",
      "Quality Controller", "Safety Officer", "Training Coordinator", "Administrator"
    ];

    // Job levels
    const jobLevels = [
      "Junior", "Operator", "Associate", 
      "Manager", "Senior", "Director"
    ];

    // Suppliers
    const suppliers = [
      "Internal Training Department", "Openreach Training", "BT Training Academy",
      "City & Guilds", "EAL", "NICEIC", "CITB", "IOSH", "NEBOSH", "SQA",
      "Pearson", "NOCN", "HABC", "Highfield", "RoSPA", "PASMA", "IPAF",
      "CPCS", "CSCS", "Fibre Optic Association", "IET", "IMechE", "ICE",
      "CIBSE", "RICS", "External Training Provider", "Online Learning Platform",
      "Certification Body", "Professional Institution", "Industry Association"
    ];

    // Note: Certificate names are NOT needed - users enter them manually

    // Populate Job Roles
    console.log('\n📝 Populating Job Roles...');
    let count = 0;
    for (const roleName of jobRoles) {
      try {
        await JobRole.findOneAndUpdate(
          { name: roleName },
          { 
            name: roleName,
            description: `${roleName} role`,
            isActive: true,
            updatedOn: new Date()
          },
          { upsert: true, new: true }
        );
        count++;
      } catch (error) {
        console.log(`⚠️  Failed to create job role: ${roleName}`);
      }
    }
    console.log(`✅ Created/Updated ${count} job roles`);

    // Populate Job Titles
    console.log('\n📝 Populating Job Titles...');
    count = 0;
    for (const titleName of jobTitles) {
      try {
        await JobTitle.findOneAndUpdate(
          { name: titleName },
          { 
            name: titleName,
            description: `${titleName} position`,
            isActive: true,
            updatedOn: new Date()
          },
          { upsert: true, new: true }
        );
        count++;
      } catch (error) {
        console.log(`⚠️  Failed to create job title: ${titleName}`);
      }
    }
    console.log(`✅ Created/Updated ${count} job titles`);

    // Populate Job Levels
    console.log('\n📝 Populating Job Levels...');
    count = 0;
    for (const levelName of jobLevels) {
      try {
        await JobLevel.findOneAndUpdate(
          { name: levelName },
          { 
            name: levelName,
            description: `${levelName} experience level`,
            isActive: true,
            usageCount: 1
          },
          { upsert: true, new: true }
        );
        count++;
      } catch (error) {
        console.log(`⚠️  Failed to create job level: ${levelName}`);
      }
    }
    console.log(`✅ Created/Updated ${count} job levels`);

    // Populate Suppliers
    console.log('\n📝 Populating Suppliers...');
    count = 0;
    for (const supplierName of suppliers) {
      try {
        await Supplier.findOneAndUpdate(
          { name: supplierName },
          { 
            name: supplierName,
            description: `Training and certification provider: ${supplierName}`,
            updatedOn: new Date()
          },
          { upsert: true, new: true }
        );
        count++;
      } catch (error) {
        console.log(`⚠️  Failed to create supplier: ${supplierName}`);
      }
    }
    console.log(`✅ Created/Updated ${count} suppliers`);

    // Certificate names not populated - users enter them manually when creating certificates

    console.log('\n🎉 COMPREHENSIVE DATA POPULATION COMPLETE');
    console.log('📊 Summary:');
    console.log(`   - Job Roles: ${jobRoles.length}`);
    console.log(`   - Job Titles: ${jobTitles.length}`);
    console.log(`   - Job Levels: ${jobLevels.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log('\n✅ Database is fully populated and ready for use!');

  } catch (error) {
    console.error('❌ Population Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the population
populateComprehensiveData();
