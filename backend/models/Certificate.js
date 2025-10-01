const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificate: {
    type: String,
    required: true
  },
  profileName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  jobRole: {
    type: String,
    required: true
  },
  expiryDate: {
    type: String, // stored as 'DD/MM/YYYY'
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Certificate', certificateSchema);
