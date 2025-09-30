const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');

// @route   GET /api/profiles/:id
// @desc    Get profile by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/profiles/:id
// @desc    Update profile
// @access  Private
router.put('/:id', [
  auth,
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    firstName,
    lastName,
    email,
    mobile,
    jobTitle,
    company,
    staffType,
    nationality,
    status,
    address
  } = req.body;

  try {
    let profile = await Profile.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Build profile object
    const profileFields = {
      firstName,
      lastName,
      email,
      mobile,
      jobTitle,
      company,
      staffType,
      nationality,
      status,
      address,
      updatedAt: Date.now()
    };

    // Update profile
    profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { $set: profileFields },
      { new: true }
    );

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;