const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Get User and Profile models
const User = mongoose.model('User');
const Profile = mongoose.model('Profile');

// Middleware to check if user is authenticated
const authenticateSession = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

// Get current user's complete profile data
router.get('/current', authenticateSession, async (req, res) => {
  try {
    const userEmail = req.session.user.email;
    
    // Fetch user from User collection
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch profile from Profile collection
    const profile = await Profile.findOne({ email: userEmail });
    
    // Combine user and profile data
    const completeUserData = {
      // Basic user data
      _id: user._id,
      id: user._id,
      firstName: profile?.firstName || user.firstName,
      lastName: profile?.lastName || user.lastName,
      email: user.email,
      role: user.role,
      
      // Profile data (if exists)
      ...(profile ? {
        mobile: profile.mobile,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        profilePicture: profile.profilePicture,
        staffType: profile.staffType,
        company: profile.company,
        jobRole: profile.jobRole,
        jobTitle: profile.jobTitle,
        jobLevel: profile.jobLevel,
        language: profile.language,
        startDate: profile.startDate,
        department: profile.department,
        bio: profile.bio,
        address: profile.address,
        emergencyContact: profile.emergencyContact,
        vtid: profile.vtid,
        skillkoId: profile.skillkoId,
        status: profile.status,
        isActive: profile.isActive,
        emailVerified: profile.emailVerified,
        mobileVerified: profile.mobileVerified,
        otherInformation: profile.otherInformation,
        profileId: profile._id
      } : {})
    };

    res.json(completeUserData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update current user's profile
router.put('/current', authenticateSession, async (req, res) => {
  try {
    const userEmail = req.session.user.email;
    const updateData = req.body;
    
    // Update Profile collection
    const profile = await Profile.findOneAndUpdate(
      { email: userEmail },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    // Also update basic fields in User collection if they exist
    if (updateData.firstName || updateData.lastName) {
      await User.findOneAndUpdate(
        { email: userEmail },
        {
          ...(updateData.firstName && { firstName: updateData.firstName }),
          ...(updateData.lastName && { lastName: updateData.lastName })
        }
      );
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;