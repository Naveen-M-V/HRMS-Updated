const mongoose = require('mongoose');
require('dotenv').config();

const TimeEntry = require('./models/TimeEntry');

async function cleanupOldTimeEntries() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('Connected to MongoDB\n');

    const result = await TimeEntry.deleteMany({});
    console.log(`Deleted ${result.deletedCount} time entries from database`);
    console.log('All time entry history cleared successfully');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

cleanupOldTimeEntries();
