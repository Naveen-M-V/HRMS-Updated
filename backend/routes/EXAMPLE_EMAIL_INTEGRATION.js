/**
 * EXAMPLE EMAIL INTEGRATION
 * 
 * This file demonstrates how to integrate email notifications into your existing routes.
 * DO NOT use this file directly - copy the relevant code into your actual route files.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import email functions
const {
  sendProfileCreationEmail,
  sendProfileUpdateEmail,
  sendProfileDeletionEmail,
  sendCertificateAddedEmail,
  sendCertificateDeletedEmail
} = require('../utils/emailService');

// Assuming you have Profile and Certificate models
// Adjust the paths based on your actual project structure
const Profile = mongoose.model('Profile');
const Certificate = mongoose.model('Certificate');
const User = mongoose.model('User');

// ========================================
// EXAMPLE 1: Profile Creation
// ========================================
router.post('/profiles', async (req, res) => {
  try {
    // Create the profile
    const newProfile = new Profile(req.body);
    await newProfile.save();
    
    // Check if a User account was created for this profile
    const user = await User.findOne({ email: newProfile.email });
    
    // Prepare user credentials if available (must be BEFORE password hashing!)
    let userData = null;
    if (user) {
      // If you store temporary password before hashing, use it here
      // Example: if you saved it as user.temporaryPassword
      userData = {
        email: user.email,
        password: user.temporaryPassword || 'Contact admin for password'
      };
    }
    
    // Send welcome email (don't wait for it, don't let it block the response)
    sendProfileCreationEmail(newProfile, userData)
      .then(result => {
        if (result.success) {
          console.log('✓ Profile creation email sent to:', newProfile.email);
        } else {
          console.error('✗ Failed to send profile creation email:', result.error);
        }
      })
      .catch(err => console.error('✗ Email sending error:', err));
    
    // Return success response immediately
    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      profile: newProfile
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// EXAMPLE 2: Profile Update
// ========================================
router.put('/profiles/:id', async (req, res) => {
  try {
    const profileId = req.params.id;
    const updates = req.body;
    
    // Update the profile
    const updatedProfile = await Profile.findByIdAndUpdate(
      profileId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!updatedProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Send update notification with the changed fields
    sendProfileUpdateEmail(updatedProfile, updates)
      .then(result => {
        if (result.success) {
          console.log('✓ Profile update email sent to:', updatedProfile.email);
        }
      })
      .catch(err => console.error('✗ Email sending error:', err));
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// EXAMPLE 3: Profile Deletion
// ========================================
router.delete('/profiles/:id', async (req, res) => {
  try {
    const profileId = req.params.id;
    
    // IMPORTANT: Get profile data BEFORE deleting
    const profile = await Profile.findById(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Store profile data for email (can't access it after deletion)
    const profileData = {
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      vtid: profile.vtid
    };
    
    // Delete the profile
    await Profile.findByIdAndDelete(profileId);
    
    // Also delete associated user account if exists
    await User.deleteOne({ email: profileData.email });
    
    // Send deletion notification
    sendProfileDeletionEmail(profileData)
      .then(result => {
        if (result.success) {
          console.log('✓ Profile deletion email sent to:', profileData.email);
        }
      })
      .catch(err => console.error('✗ Email sending error:', err));
    
    res.json({
      success: true,
      message: 'Profile and associated user account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// EXAMPLE 4: Certificate Added
// ========================================
router.post('/certificates', async (req, res) => {
  try {
    // Create the certificate
    const newCertificate = new Certificate(req.body);
    await newCertificate.save();
    
    // Get the profile information
    // OPTION A: If Certificate schema has profileId reference
    // const profile = await Profile.findById(newCertificate.profileId);
    
    // OPTION B: Current schema uses profileName (string), so search by name
    const nameParts = newCertificate.profileName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    const profile = await Profile.findOne({ 
      firstName: firstName,
      lastName: lastName
    });
    
    if (profile) {
      const certificateData = {
        certificate: newCertificate.certificate,
        category: newCertificate.category,
        jobRole: newCertificate.jobRole,
        expiryDate: newCertificate.expiryDate
      };
      
      // Send notification
      sendCertificateAddedEmail(profile, certificateData)
        .then(result => {
          if (result.success) {
            console.log('✓ Certificate added email sent to:', profile.email);
          }
        })
        .catch(err => console.error('✗ Email sending error:', err));
    } else {
      console.warn('Profile not found for certificate:', newCertificate.profileName);
    }
    
    res.status(201).json({
      success: true,
      message: 'Certificate added successfully',
      certificate: newCertificate
    });
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// EXAMPLE 5: Certificate Deleted
// ========================================
router.delete('/certificates/:id', async (req, res) => {
  try {
    const certificateId = req.params.id;
    
    // IMPORTANT: Get certificate data BEFORE deleting
    const certificate = await Certificate.findById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    // Get profile information
    const nameParts = certificate.profileName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    const profile = await Profile.findOne({
      firstName: firstName,
      lastName: lastName
    });
    
    // Store certificate data
    const certificateData = {
      certificate: certificate.certificate,
      category: certificate.category,
      jobRole: certificate.jobRole,
      expiryDate: certificate.expiryDate
    };
    
    // Delete the certificate
    await Certificate.findByIdAndDelete(certificateId);
    
    if (profile) {
      // Send deletion notification
      sendCertificateDeletedEmail(profile, certificateData)
        .then(result => {
          if (result.success) {
            console.log('✓ Certificate deleted email sent to:', profile.email);
          }
        })
        .catch(err => console.error('✗ Email sending error:', err));
    }
    
    res.json({
      success: true,
      message: 'Certificate deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// HELPER: Bulk Certificate Import with Emails
// ========================================
router.post('/certificates/bulk', async (req, res) => {
  try {
    const certificates = req.body.certificates; // Array of certificate objects
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const certData of certificates) {
      try {
        const newCert = new Certificate(certData);
        await newCert.save();
        
        // Send email notification for each
        const nameParts = certData.profileName.split(' ');
        const profile = await Profile.findOne({
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ')
        });
        
        if (profile) {
          sendCertificateAddedEmail(profile, {
            certificate: certData.certificate,
            category: certData.category,
            jobRole: certData.jobRole,
            expiryDate: certData.expiryDate
          }).catch(err => console.error('Email error:', err));
        }
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          certificate: certData.certificate,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Bulk import completed',
      results
    });
  } catch (error) {
    console.error('Error in bulk certificate import:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

/**
 * TO INTEGRATE INTO YOUR ACTUAL ROUTES:
 * 
 * 1. Copy the relevant email function calls from the examples above
 * 2. Add them to your existing route handlers in the appropriate files
 * 3. Make sure to import the email functions at the top of your route file:
 *    const { sendProfileCreationEmail, ... } = require('../utils/emailService');
 * 4. Always use .catch() or try/catch to prevent email errors from breaking your API
 * 5. Log success/failure for monitoring
 */
