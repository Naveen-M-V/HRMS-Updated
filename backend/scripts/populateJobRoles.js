const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env' });

const jobRoles = [
  "Spine Survey",
  "Heavy Cabling UG",
  "Cable Blowing",
  "Splicing",
  "Fibre Jointing (Ladder)",
  "Fibre Jointing (MEWP)",
  "Fibre Light Loss Testing (Ladder)",
  "Fibre Light Loss Testing (MEWP)",
  "Ribbon Fibre Jointing",
  "CPN Fibre Casing - UG",
  "CPN Fibre Casing - OH (Ladder)",
  "CPN Fibre Casing - OH (MEWP)",
  "FTTP Access Survey",
  "FTTP Access Survey",
  "FTTP Quality Checks",
  "MDU Survey",
  "FTTP Quality Checks",
  "Internal MDU Build",
  "FTTP LDC fibre install",
  "FTTP LDC step 1 (Ladder)",
  "FTTP LDC step 1 (MEWP)",
  "FTTP LDC step 1 - OH only (Ladder)",
  "FTTP LDC step 1 - OH only (MEWP)",
  "FTTP LDC repair (Ladder)",
  "FTTP LDC repair (MEWP)",
  "FTTP LDC step 2",
  "Optical Test Head Installation - Mast",
  "Optical Test Head Installation - EiC",
  "Supervisor",
  "Supervisor",
  "Piling - SELL Operative",
  "Piling - Overhead Copper programming (Ladder)",
  "Piling - Overhead Copper disconnection (MEWP)",
  "Piling - Overhead Copper programming (MEWP)",
  "Piling - Overhead Copper Jointing (MEWP)",
  "MEWP Operator",
  "Manual piling (provision and recovery)",
  "Pole recovery",
  "Aerial cabling (MEWP)",
  "Aerial cabling (Ladder)",
  "Aerial cabling (MEWP)",
  "Pole Labelling",
  "Scouting",
  "Chambers Module",
  "Chambers Concrete",
  "Chambers Concrete advanced",
  "Chambers Plastic",
  "Chambers Brick",
  "Demolition",
  "Duct Tube Reinstatement",
  "Duct Laying Basic",
  "Duct Laying Intermediate",
  "Duct Laying Advanced",
  "Duct Tape Sealing",
  "Duct Slips",
  "Duct Slips Advanced",
  "Mast Signalling",
  "Maintenance Excavation",
  "Reinstatement Operative - Footway",
  "Reinstatement Operative - Carriageway",
  "Frame and Cover footway",
  "Frame and Cover Carriageway",
  "Blockage Clearance",
  "PCP Construction",
  "Blasting, Gully sucking or Manhole surveying",
  "Narrow Trenching",
  "Tie Rods",
  "Pole Hole Excavation",
  "FTTC Commissioning",
  "Copper Frame",
  "Copper Frame Accredited for correct frame type",
  "CAL-OMI (Ladder)",
  "CAL-OMI (MEWP)",
  "Copper Jointing UG",
  "FTTC Fibre Soak UG",
  "FTTC Commissioning",
  "FTTC MI (MEWP)",
  "FTTC MI (Ladder)",
  "Heavy cable recovery",
  "Supply and Install Engineer",
  "Supply and Install - Mast Valve installation",
  "Supply and Install - Mast Plumbing",
  "Ancillary Wiring or LLU Cabling",
  "Ancillary Wiring or LLU Cabling",
  "Ancillary Overhead",
  "DSLAM",
  "DSLAM - Power (RCO)",
  "CAV MI Test, replacement or rotation",
  "Conductive Coating",
  "Earthing Bonding"
];

async function populateJobRoles() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('hrms');
    const collection = db.collection('jobroles');
    
    // Clear existing job roles
    await collection.deleteMany({});
    console.log('Cleared existing job roles');
    
    // Insert new job roles
    const jobRoleDocuments = jobRoles.map(name => ({
      name: name.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const result = await collection.insertMany(jobRoleDocuments);
    console.log(`Successfully inserted ${result.insertedCount} job roles`);
    
    // Display inserted job roles
    console.log('\nInserted job roles:');
    jobRoles.forEach((role, index) => {
      console.log(`${index + 1}. ${role}`);
    });
    
  } catch (error) {
    console.error('Error populating job roles:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
populateJobRoles();
