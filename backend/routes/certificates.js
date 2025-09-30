const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Certificate = require('../models/Certificate');

// @route   GET /api/certificates
// @desc    Get certificates with pagination and filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query based on filters
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.status) query.status = req.query.status;
    if (req.query.provider) query.provider = req.query.provider;
    if (req.query.search) {
      query.$or = [
        { certificate: new RegExp(req.query.search, 'i') },
        { profileName: new RegExp(req.query.search, 'i') }
      ];
    }

    // Execute query with pagination
    const certificates = await Certificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Certificate.countDocuments(query);

    res.json({
      data: certificates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + certificates.length < total
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/certificates/:id
// @desc    Get certificate by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ msg: 'Certificate not found' });
    }
    res.json(certificate);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/certificates
// @desc    Create a new certificate
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const newCertificate = new Certificate({
      ...req.body,
      createdBy: req.user.id
    });

    const certificate = await newCertificate.save();
    res.json(certificate);
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/certificates/:id
// @desc    Update a certificate
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!certificate) {
      return res.status(404).json({ msg: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/certificates/:id
// @desc    Delete a certificate
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ msg: 'Certificate not found' });
    }

    // Check if user owns the certificate or is admin
    if (certificate.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await certificate.remove();
    res.json({ msg: 'Certificate removed' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;