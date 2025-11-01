const express = require('express');
const router = express.Router();
const LocationTracking = require('../models/LocationTracking');
const TimeEntry = require('../models/TimeEntry');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// @route   POST /api/location/update
// @desc    Update user location
// @access  Private
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    const { 
      latitude, 
      longitude, 
      accuracy, 
      address, 
      workLocation, 
      updateType = 'manual_update',
      timeEntryId = null 
    } = req.body;

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    // Deactivate previous locations for this user
    await LocationTracking.updateMany(
      { employee: userId, isActive: true },
      { isActive: false }
    );

    // Create new location entry
    const locationData = {
      employee: userId,
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      accuracy: accuracy || null,
      address: address || '',
      workLocation: workLocation || 'Work From Office',
      updateType,
      timeEntryId,
      deviceInfo: {
        userAgent: req.headers['user-agent'] || '',
        platform: req.headers['sec-ch-ua-platform'] || '',
        timestamp: new Date()
      }
    };

    const newLocation = new LocationTracking(locationData);
    await newLocation.save();

    // If this is linked to a time entry, update the time entry with GPS coordinates
    if (timeEntryId) {
      await TimeEntry.findByIdAndUpdate(timeEntryId, {
        gpsCoordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: accuracy || null,
          timestamp: new Date()
        },
        address: address || ''
      });
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        locationId: newLocation._id,
        coordinates: newLocation.coordinates,
        address: newLocation.address,
        workLocation: newLocation.workLocation,
        timestamp: newLocation.createdAt
      }
    });

  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
});

// @route   GET /api/location/my-location
// @desc    Get current user's latest location
// @access  Private
router.get('/my-location', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    
    const location = await LocationTracking.getLatestLocation(userId);
    
    if (!location) {
      return res.json({
        success: true,
        message: 'No location found',
        data: null
      });
    }

    res.json({
      success: true,
      data: {
        coordinates: location.coordinates,
        address: location.address,
        workLocation: location.workLocation,
        accuracy: location.accuracy,
        locationSource: location.locationSource,
        updateType: location.updateType,
        timestamp: location.createdAt
      }
    });

  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location',
      error: error.message
    });
  }
});

// @route   GET /api/location/all-locations
// @desc    Get all active employee locations (Admin only)
// @access  Private (Admin)
router.get('/all-locations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const locations = await LocationTracking.getAllActiveLocations();
    
    res.json({
      success: true,
      data: locations.map(location => ({
        employeeId: location.employee,
        employeeName: `${location.employeeInfo.firstName} ${location.employeeInfo.lastName}`,
        email: location.employeeInfo.email,
        vtid: location.employeeInfo.vtid,
        role: location.employeeInfo.role,
        coordinates: location.coordinates,
        address: location.address,
        workLocation: location.workLocation,
        accuracy: location.accuracy,
        locationSource: location.locationSource,
        updateType: location.updateType,
        lastUpdate: location.createdAt
      }))
    });

  } catch (error) {
    console.error('Get all locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee locations',
      error: error.message
    });
  }
});

// @route   GET /api/location/employee/:employeeId/history
// @desc    Get location history for specific employee (Admin only)
// @access  Private (Admin)
router.get('/employee/:employeeId/history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 50, page = 1, startDate, endDate } = req.query;
    
    let query = { employee: employeeId };
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const locations = await LocationTracking.find(query)
      .populate('employee', 'firstName lastName email vtid')
      .populate('timeEntryId', 'clockIn clockOut date')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await LocationTracking.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        locations: locations.map(location => ({
          id: location._id,
          coordinates: location.coordinates,
          address: location.address,
          workLocation: location.workLocation,
          accuracy: location.accuracy,
          locationSource: location.locationSource,
          updateType: location.updateType,
          isActive: location.isActive,
          timestamp: location.createdAt,
          timeEntry: location.timeEntryId ? {
            id: location.timeEntryId._id,
            date: location.timeEntryId.date,
            clockIn: location.timeEntryId.clockIn,
            clockOut: location.timeEntryId.clockOut
          } : null
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location history',
      error: error.message
    });
  }
});

// @route   GET /api/location/nearby-employees
// @desc    Find employees near a specific location (Admin only)
// @access  Private (Admin)
router.get('/nearby-employees', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query; // radius in kilometers
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Convert radius from kilometers to meters for MongoDB
    const radiusInMeters = parseFloat(radius) * 1000;
    
    const nearbyEmployees = await LocationTracking.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          spherical: true
        }
      },
      {
        $match: { isActive: true }
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
          distance: { $round: ['$distance', 0] }, // Round to nearest meter
          'employeeInfo.firstName': 1,
          'employeeInfo.lastName': 1,
          'employeeInfo.email': 1,
          'employeeInfo.vtid': 1,
          createdAt: 1
        }
      },
      {
        $sort: { distance: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        searchCenter: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radius: parseFloat(radius)
        },
        employees: nearbyEmployees.map(emp => ({
          employeeId: emp.employee,
          employeeName: `${emp.employeeInfo.firstName} ${emp.employeeInfo.lastName}`,
          email: emp.employeeInfo.email,
          vtid: emp.employeeInfo.vtid,
          coordinates: emp.coordinates,
          address: emp.address,
          workLocation: emp.workLocation,
          accuracy: emp.accuracy,
          distanceInMeters: emp.distance,
          distanceInKm: (emp.distance / 1000).toFixed(2),
          lastUpdate: emp.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Find nearby employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find nearby employees',
      error: error.message
    });
  }
});

// @route   DELETE /api/location/clear-history
// @desc    Clear location history for current user
// @access  Private
router.delete('/clear-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId || req.user.id;
    
    // Deactivate all locations for this user instead of deleting
    const result = await LocationTracking.updateMany(
      { employee: userId },
      { isActive: false }
    );
    
    res.json({
      success: true,
      message: 'Location history cleared successfully',
      data: {
        updatedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Clear location history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear location history',
      error: error.message
    });
  }
});

module.exports = router;
