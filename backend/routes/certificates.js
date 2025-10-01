const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');

// GET /api/certificates with pagination, filtering, caching headers
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page ?? '1', 10);
  const limit = parseInt(req.query.limit ?? '30', 10);
  const skip = (page - 1) * limit;
  const filter = {};

  if (req.query.search) {
    filter.$or = [
      { certificate: new RegExp(req.query.search, 'i') },
      { profileName: new RegExp(req.query.search, 'i') },
    ];
  }
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.provider) filter.provider = req.query.provider;

  try {
    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Certificate.countDocuments(filter),
    ]);
    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      certificates,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

module.exports = router;
