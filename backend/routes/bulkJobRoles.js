const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();

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
  "FTTP Quality Checks",
  "MDU Survey",
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
  "FTTC MI (MEWP)",
  "FTTC MI (Ladder)",
  "Heavy cable recovery",
  "Supply and Install Engineer",
  "Supply and Install - Mast Valve installation",
  "Supply and Install - Mast Plumbing",
  "Ancillary Wiring or LLU Cabling",
  "Ancillary Overhead",
  "DSLAM",
  "DSLAM - Power (RCO)",
  "CAV MI Test, replacement or rotation",
  "Conductive Coating",
  "Earthing Bonding"
];

// POST /api/bulk-job-roles - Bulk insert job roles
router.post('/bulk-job-roles', async (req, res) => {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('hrms');
    const collection = db.collection('jobroles');
    
    // Clear existing job roles
    await collection.deleteMany({});
    
    // Remove duplicates and prepare documents
    const uniqueJobRoles = [...new Set(jobRoles)];
    const jobRoleDocuments = uniqueJobRoles.map(name => ({
      name: name.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Insert new job roles
    const result = await collection.insertMany(jobRoleDocuments);
    
    res.json({
      success: true,
      message: `Successfully inserted ${result.insertedCount} job roles`,
      count: result.insertedCount,
      jobRoles: uniqueJobRoles
    });
    
  } catch (error) {
    console.error('Error bulk inserting job roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk insert job roles',
      error: error.message
    });
  } finally {
    await client.close();
  }
});

module.exports = router;
