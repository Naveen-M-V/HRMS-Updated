const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Certificate = require('../models/Certificate'); // adjust path if your model is elsewhere

// ----------------------
// Dashboard Stats
// ----------------------
router.get('/dashboard-stats', async (req, res) => {
  try {
    const allCertificates = await Certificate.find();

    // Active certificates = not expired
    const today = new Date();
    const activeCertificates = allCertificates.filter(cert => {
      const [day, month, year] = cert.expiryDate.split('/');
      const expiry = new Date(year, month - 1, day);
      return expiry >= today;
    });

    // Expiring certificates = expiring within next 30 days
    const expiringCertificates = allCertificates.filter(cert => {
      const [day, month, year] = cert.expiryDate.split('/');
      const expiry = new Date(year, month - 1, day);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    });

    // Expired certificates
    const expiredCertificates = allCertificates.filter(cert => {
      const [day, month, year] = cert.expiryDate.split('/');
      const expiry = new Date(year, month - 1, day);
      return expiry < today;
    });

    // Category counts
    const categoryCounts = {};
    allCertificates.forEach(cert => {
      categoryCounts[cert.category] = (categoryCounts[cert.category] || 0) + 1;
    });

    // Job role counts
    const jobRoleCounts = {};
    allCertificates.forEach(cert => {
      jobRoleCounts[cert.jobRole] = (jobRoleCounts[cert.jobRole] || 0) + 1;
    });

    res.json({
      activeCount: activeCertificates.length,
      expiringCertificates,
      expiredCertificates,
      categoryCounts,
      jobRoleCounts
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ----------------------
// Get certificate by ID
// ----------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid certificate ID' });
    }

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.json(certificate);

  } catch (error) {
    console.error("Error fetching certificate by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ----------------------
// Create a new certificate
// ----------------------
router.post('/', async (req, res) => {
  try {
    const newCert = new Certificate(req.body);
    const savedCert = await newCert.save();
    res.status(201).json(savedCert);
  } catch (error) {
    console.error("Error creating certificate:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ----------------------
// Update a certificate
// ----------------------
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid certificate ID' });
    }

    const updatedCert = await Certificate.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedCert) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.json(updatedCert);
  } catch (error) {
    console.error("Error updating certificate:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ----------------------
// Delete a certificate
// ----------------------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid certificate ID' });
    }

    const deletedCert = await Certificate.findByIdAndDelete(id);
    if (!deletedCert) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
