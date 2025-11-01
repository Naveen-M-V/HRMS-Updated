const mongoose = require('mongoose');

/**
 * Location Tracking Schema
 * Tracks employee GPS coordinates and location updates
 */
const locationTrackingSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  address: {
    type: String,
    default: ''
  },
  accuracy: {
    type: Number, // GPS accuracy in meters
    default: null
  },
  locationSource: {
    type: String,
    enum: ['gps', 'network', 'manual'],
    default: 'gps'
  },
  workLocation: {
    type: String,
    enum: ['Work From Office', 'Work From Home', 'Field', 'Client Side'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Link to time entry if this location was captured during clock-in
  timeEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeEntry',
    default: null
  },
  // Track if this is a manual location update or automatic
  updateType: {
    type: String,
    enum: ['clock_in', 'manual_update', 'periodic_update'],
    default: 'manual_update'
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
locationTrackingSchema.index({ employee: 1, createdAt: -1 });
locationTrackingSchema.index({ coordinates: '2dsphere' }); // For geospatial queries
locationTrackingSchema.index({ isActive: 1 });
locationTrackingSchema.index({ workLocation: 1 });
locationTrackingSchema.index({ updateType: 1 });

// Method to calculate distance between two coordinates (in kilometers)
locationTrackingSchema.statics.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Method to get latest location for an employee
locationTrackingSchema.statics.getLatestLocation = async function(employeeId) {
  return await this.findOne({ 
    employee: employeeId, 
    isActive: true 
  })
  .sort({ createdAt: -1 })
  .populate('employee', 'firstName lastName email vtid');
};

// Method to get all active employee locations
locationTrackingSchema.statics.getAllActiveLocations = async function() {
  const pipeline = [
    { $match: { isActive: true } },
    { $sort: { employee: 1, createdAt: -1 } },
    { 
      $group: {
        _id: '$employee',
        latestLocation: { $first: '$$ROOT' }
      }
    },
    {
      $replaceRoot: { newRoot: '$latestLocation' }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'employee',
        foreignField: '_id',
        as: 'employeeInfo'
      }
    },
    {
      $unwind: '$employeeInfo'
    },
    {
      $project: {
        coordinates: 1,
        address: 1,
        workLocation: 1,
        accuracy: 1,
        locationSource: 1,
        updateType: 1,
        createdAt: 1,
        'employeeInfo.firstName': 1,
        'employeeInfo.lastName': 1,
        'employeeInfo.email': 1,
        'employeeInfo.vtid': 1,
        'employeeInfo.role': 1
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('LocationTracking', locationTrackingSchema);
