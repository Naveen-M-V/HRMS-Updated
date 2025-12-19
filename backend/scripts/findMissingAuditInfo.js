const mongoose = require('mongoose');
const DocumentManagement = require('../models/DocumentManagement'); // Adjust path if necessary
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI;

async function findDocumentsWithMissingAudit() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file.');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB.');

    // Find documents where the auditLog is empty or the first entry has no `performedBy`
    const documents = await DocumentManagement.find({
      $or: [
        { 'auditLog.0.performedBy': { $exists: false } },
        { 'auditLog.0.performedBy': null },
        { auditLog: { $size: 0 } },
      ],
    }).select('_id documentName'); // Select only a few fields for readability

    if (documents.length > 0) {
      console.warn(`🚨 Found ${documents.length} documents with missing 'performedBy' in the audit log:`);
      documents.forEach(doc => {
        console.log(`  - Document ID: ${doc._id}, Name: ${doc.documentName || 'N/A'}`);
      });
    } else {
      console.log('✅ All documents seem to have audit log information.');
    }
  } catch (error) {
    console.error('❌ An error occurred:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

findDocumentsWithMissingAudit();
