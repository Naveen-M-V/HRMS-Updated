const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificate: { type: String, required: true },
    description: { type: String },
    account: { type: String },
    issueDate: { type: String },
    expiryDate: { type: String },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    profileName: { type: String },
    provider: { type: String },
    fileRequired: { type: String, default: 'No' },
    active: { type: String, default: 'Yes' },
    status: { type: String, default: 'Active' },
    cost: { type: String, default: '0.00' },
    category: { type: String, required: true },
    jobRole: { type: String },
    approvalStatus: { type: String, default: 'Approved' },
    isInterim: { type: String, default: 'False' },
    supplier: { type: String },
    totalCost: { type: String, default: '0.00' },
    certificateFile: { type: String }, // filename of uploaded cert file
    archived: { type: String, default: 'Unarchived' },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
