const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const jobRoles = [
  "Spine Survey",
  "Heavy Cabling UG",
  "Cable Blowing",
  "Overblow",
  "Fibre Jointing (Ladder)",
  "Fibre Jointing (MEWP)",
  "Fibre Light Loss Testing (Ladder)",
  "Fibre Light Loss Testing (MEWP)",
  "Fibre Jointing - UG only",
  "Ribbon Fibre Jointing",
  "OFN Fibre Cabling - UG",
  "OFN Fibre Cabling - OH (Ladder)",
  "OFN Fibre Cabling - OH (MEWP)",
  "Rod and Rope",
  "FTTP Access Survey",
  "FTTP Quality Checks",
  "MDU Survey",
  "MDU Quality Checks",
  "MDU L2C",
  "Internal MDU Build",
  "FTTP L2C Home Install",
  "FTTP L2C step 1 (Ladder)",
  "FTTP L2C step 1 (MEWP)",
  "FTTP L2C step 1 - OH only (Ladder)",
  "FTTP L2C step 1 - OH only (MEWP)",
  "FTTP L2C repair (Ladder)",
  "FTTP L2C repair (MEWP)",
  "FTTP L2C step 2",
  "Optical Test Head Installation - Viavi",
  "Optical Test Head Installation - Exfo",
  "PTO",
  "Supervisor",
  "Poling - PEU Operative",
  "Poling - Overhead Copper dropwiring (Ladder)",
  "Poling - Overhead Copper dropwiring (MEWP)",
  "Poling - Overhead Copper Jointing (LADDER)",
  "Poling - Overhead Copper Jointing (MEWP)",
  "MEWP Operator",
  "Manual poling (provision and recovery)",
  "Pole recovery",
  "Pole Survey (AAP)",
  "Aerial cabling (LADDER)",
  "Aerial cabling (MEWP)",
  "Poling Labourer",
  "Blockages",
  "Chambers Modular",
  "Chambers Concrete",
  "Chambers Concrete advanced",
  "Carriageway Chambers",
  "Chambers Brick",
  "Manhole build",
  "Manhole Reroof",
  "Duct Laying Basic",
  "Duct Laying Intermediate",
  "Duct Laying Advanced",
  "Duct Slew Basic",
  "Duct Slew Intermediate",
  "Duct Slew Advanced",
  "Mole Ploughing",
  "Maintenance Excavation",
  "Reinstatement Operative - Footway",
  "Reinstatement Operative - Carriageway",
  "Frame and Cover footway",
  "Frame and Cover Carriageway",
  "DSLAM Construction",
  "PCP Construction",
  "Desilting, Gully sucking or Manhole surveying",
  "Narrow Trenching",
  "Labourer",
  "Trial Hole Excavation",
  "FTTC Commissioning",
  "Copper Frames",
  "Fibre Frames - Accredited for correct frame type",
  "CAL/OMI (Ladder)",
  "CAL/OMI (MEWP)",
  "Copper Jointing UG",
  "Copper First Look UG",
  "FTTC MI (LADDER)",
  "FTTC MI (MEWP)",
  "FTTC SI",
  "PCP Maintenance",
  "Heavy cable recovery",
  "Supply and Install Engineer",
  "Supply and Install - Fibre Cable installation",
  "Supply and Install - Mobile installation",
  "Supply and Install - Civils",
  "Ancillary Wiring or LLU Cabling",
  "Auxillary Overhead",
  "DSLAM Power Meter",
  "DSLAM - Power (RCD)",
  "DSLAM Battery Replacement or Rotation",
  "Conductive Concrete",
  "Equipotential Bonding"
];

// Remove duplicates, trim whitespace
const uniqueJobRoles = [...new Set(jobRoles.map(j => j.trim()))];

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
    const jobRoleDocuments = uniqueJobRoles.map(name => ({
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const result = await collection.insertMany(jobRoleDocuments);
    console.log(`Successfully inserted ${result.insertedCount} job roles`);

    // Display inserted job roles
    console.log('\nInserted job roles:');
    uniqueJobRoles.forEach((role, index) => {
      console.log(`${index + 1}. ${role}`);
    });

  } catch (error) {
    console.error('Error populating job roles:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

populateJobRoles();
