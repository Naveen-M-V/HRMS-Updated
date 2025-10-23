// Enhanced Server with Comprehensive Email Notifications and Profile Sync Fixes
// This file contains the enhanced endpoints to be integrated into server.js

const {
  sendUserCredentialsEmail,
  sendAdminNewUserCredentialsEmail,
  sendNotificationEmail
} = require('./utils/emailService');

// Enhanced Profile Creation with Email Notifications
const enhancedCreateProfile = async (req, res) => {
  try {
    // Handle jobTitle array from frontend - convert to string
    const profileData = { ...req.body };
    if (Array.isArray(profileData.jobTitle)) {
      profileData.jobTitle = profileData.jobTitle.length > 0 ? profileData.jobTitle[0] : '';
    }
    
    const profile = new Profile(profileData);
    const savedProfile = await profile.save();
    
    // Create user account for the profile with auto-generated credentials
    let userCredentials = null;
    try {
      const existingUser = await User.findOne({ email: savedProfile.email });
      
      if (!existingUser) {
        // Generate secure password instead of using VTID
        const { generateSecurePassword } = require('./utils/passwordGenerator');
        const generatedPassword = generateSecurePassword();
        
        // Create user account
        const newUser = new User({
          firstName: savedProfile.firstName,
          lastName: savedProfile.lastName,
          email: savedProfile.email,
          password: generatedPassword, // Will be hashed by pre-save hook
          vtid: savedProfile.vtid.toString(),
          role: 'user',
          isActive: true,
          emailVerified: true, // Auto-verify user accounts created by admin
          adminApprovalStatus: 'approved', // Auto-approve user accounts
          profileId: savedProfile._id
        });
        
        await newUser.save();
        console.log('User account created for profile:', savedProfile.email);
        
        // Update profile with user reference
        savedProfile.userId = newUser._id;
        await savedProfile.save();
        
        userCredentials = {
          email: savedProfile.email,
          password: generatedPassword
        };
      }
    } catch (userCreationError) {
      console.error('Error creating user account:', userCreationError);
    }
    
    // Send comprehensive email notifications
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const loginUrl = `${frontendUrl}/login`;
      
      // 1. Send profile creation email to user (with credentials if new user)
      await sendProfileCreationEmail(savedProfile, userCredentials);
      console.log('Profile creation email sent to user:', savedProfile.email);
      
      // 2. Send notification to all admins
      const adminUsers = await User.find({ role: 'admin' });
      for (const admin of adminUsers) {
        if (userCredentials) {
          // Send admin notification with user credentials
          await sendAdminNewUserCredentialsEmail(
            admin.email,
            `${savedProfile.firstName} ${savedProfile.lastName}`,
            savedProfile.email,
            userCredentials.password,
            loginUrl
          );
        } else {
          // Send general admin notification
          await sendNotificationEmail(
            admin.email,
            `${admin.firstName} ${admin.lastName}`,
            'New Profile Created',
            `A new profile has been created for ${savedProfile.firstName} ${savedProfile.lastName} (${savedProfile.email}).`,
            'info'
          );
        }
      }
      console.log('Admin notifications sent for profile creation');
      
    } catch (emailError) {
      console.error('Error sending profile creation emails:', emailError);
    }
    
    // Create in-app notifications for admins
    try {
      const users = await User.find({ role: 'admin' });
      for (const user of users) {
        const notification = new Notification({
          userId: user._id,
          type: 'profile_created',
          priority: 'low',
          message: `New profile created: ${savedProfile.firstName} ${savedProfile.lastName}`,
          read: false
        });
        await notification.save();
      }
    } catch (notificationError) {
      console.error('Error creating notifications:', notificationError);
    }
    
    res.status(201).json(savedProfile);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Enhanced Profile Update with Email Notifications and Sync Fix
const enhancedUpdateProfile = async (req, res) => {
  try {
    const profileId = req.params.id;
    const updateData = { ...req.body };
    
    // Handle jobTitle array from frontend
    if (Array.isArray(updateData.jobTitle)) {
      updateData.jobTitle = updateData.jobTitle.length > 0 ? updateData.jobTitle[0] : '';
    }
    
    // Get original profile for comparison
    const originalProfile = await Profile.findById(profileId);
    if (!originalProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    // Update profile
    const updatedProfile = await Profile.findByIdAndUpdate(
      profileId,
      updateData,
      { new: true, runValidators: true }
    );
    
    // CRITICAL FIX: Update associated certificates if profile name changed
    const nameChanged = (
      originalProfile.firstName !== updatedProfile.firstName ||
      originalProfile.lastName !== updatedProfile.lastName
    );
    
    if (nameChanged) {
      const newProfileName = `${updatedProfile.firstName} ${updatedProfile.lastName}`;
      
      // Update all certificates with the new profile name to maintain sync
      await Certificate.updateMany(
        { profileId: profileId },
        { profileName: newProfileName }
      );
      
      console.log(`Updated certificate profile names for profile ${profileId} to: ${newProfileName}`);
    }
    
    // Update associated user account if email changed
    if (originalProfile.email !== updatedProfile.email) {
      await User.findOneAndUpdate(
        { profileId: profileId },
        { 
          email: updatedProfile.email,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName
        }
      );
      console.log(`Updated user account email from ${originalProfile.email} to ${updatedProfile.email}`);
    }
    
    // Send email notifications
    try {
      // Determine what fields were updated
      const updatedFields = {};
      Object.keys(updateData).forEach(key => {
        if (originalProfile[key] !== updatedProfile[key]) {
          updatedFields[key] = updatedProfile[key];
        }
      });
      
      if (Object.keys(updatedFields).length > 0) {
        // Send update notification to user
        await sendProfileUpdateEmail(updatedProfile, updatedFields);
        console.log('Profile update email sent to user:', updatedProfile.email);
        
        // Send notification to admins
        const adminUsers = await User.find({ role: 'admin' });
        for (const admin of adminUsers) {
          await sendNotificationEmail(
            admin.email,
            `${admin.firstName} ${admin.lastName}`,
            'Profile Updated',
            `Profile updated for ${updatedProfile.firstName} ${updatedProfile.lastName}. Updated fields: ${Object.keys(updatedFields).join(', ')}.`,
            'info'
          );
        }
        console.log('Admin notifications sent for profile update');
      }
      
    } catch (emailError) {
      console.error('Error sending profile update emails:', emailError);
    }
    
    res.json(updatedProfile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Enhanced Certificate Creation with Email Notifications
const enhancedCreateCertificate = async (req, res) => {
  try {
    const certificateData = { ...req.body };
    
    // Validate and get profile information
    let profile = null;
    if (certificateData.profileId) {
      if (!mongoose.Types.ObjectId.isValid(certificateData.profileId)) {
        return res.status(400).json({ message: 'Invalid profileId format' });
      }
      
      profile = await Profile.findById(certificateData.profileId);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      
      // Auto-set profileName from profile to maintain sync
      certificateData.profileName = `${profile.firstName} ${profile.lastName}`;
    }
    
    // Handle file upload if present
    if (req.file) {
      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: 'File size exceeds 10MB limit' });
      }
      
      certificateData.certificateFile = req.file.originalname;
      certificateData.fileData = req.file.buffer;
      certificateData.fileSize = req.file.size;
      certificateData.mimeType = req.file.mimetype;
    }

    const certificate = new Certificate(certificateData);
    const savedCertificate = await certificate.save();
    
    // Send email notifications
    if (profile) {
      try {
        // Send notification to user
        await sendCertificateAddedEmail(profile, savedCertificate);
        console.log('Certificate added email sent to user:', profile.email);
        
        // Send notification to admins
        const adminUsers = await User.find({ role: 'admin' });
        for (const admin of adminUsers) {
          await sendNotificationEmail(
            admin.email,
            `${admin.firstName} ${admin.lastName}`,
            'Certificate Added',
            `New certificate "${savedCertificate.certificate}" has been added for ${profile.firstName} ${profile.lastName}.`,
            'success'
          );
        }
        console.log('Admin notifications sent for certificate addition');
        
      } catch (emailError) {
        console.error('Error sending certificate creation emails:', emailError);
      }
    }
    
    // Create in-app notifications
    try {
      const users = await User.find({ role: 'admin' });
      for (const user of users) {
        const notification = new Notification({
          userId: user._id,
          type: 'certificate_created',
          priority: 'low',
          message: `New certificate added: ${savedCertificate.certificate} for ${savedCertificate.profileName}`,
          read: false
        });
        await notification.save();
      }
    } catch (notificationError) {
      console.error('Error creating certificate notification:', notificationError);
    }
    
    res.status(201).json(savedCertificate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Enhanced Certificate Update with Email Notifications
const enhancedUpdateCertificate = async (req, res) => {
  try {
    const certificateId = req.params.id;
    const updateData = { ...req.body };
    
    // Get original certificate for comparison
    const originalCertificate = await Certificate.findById(certificateId).populate('profileId');
    if (!originalCertificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Update certificate
    const updatedCertificate = await Certificate.findByIdAndUpdate(
      certificateId,
      updateData,
      { new: true, runValidators: true }
    ).populate('profileId');
    
    // Send email notifications if significant changes occurred
    try {
      const profile = updatedCertificate.profileId;
      if (profile) {
        // Determine what fields were updated
        const significantFields = ['certificate', 'expiryDate', 'status', 'approvalStatus'];
        const hasSignificantChanges = significantFields.some(field => 
          originalCertificate[field] !== updatedCertificate[field]
        );
        
        if (hasSignificantChanges) {
          // Send update notification to user
          await sendNotificationEmail(
            profile.email,
            `${profile.firstName} ${profile.lastName}`,
            'Certificate Updated',
            `Your certificate "${updatedCertificate.certificate}" has been updated.`,
            'info'
          );
          console.log('Certificate update email sent to user:', profile.email);
          
          // Send notification to admins
          const adminUsers = await User.find({ role: 'admin' });
          for (const admin of adminUsers) {
            await sendNotificationEmail(
              admin.email,
              `${admin.firstName} ${admin.lastName}`,
              'Certificate Updated',
              `Certificate "${updatedCertificate.certificate}" for ${profile.firstName} ${profile.lastName} has been updated.`,
              'info'
            );
          }
          console.log('Admin notifications sent for certificate update');
        }
      }
      
    } catch (emailError) {
      console.error('Error sending certificate update emails:', emailError);
    }
    
    res.json(updatedCertificate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Enhanced Certificate Deletion with Email Notifications
const enhancedDeleteCertificate = async (req, res) => {
  try {
    const certificateId = req.params.id;
    
    const certificate = await Certificate.findById(certificateId).populate('profileId');
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    const profile = certificate.profileId;
    
    // Delete certificate
    await Certificate.findByIdAndDelete(certificateId);
    
    // Send email notifications
    if (profile) {
      try {
        // Send notification to user
        await sendCertificateDeletedEmail(profile, certificate);
        console.log('Certificate deletion email sent to user:', profile.email);
        
        // Send notification to admins
        const adminUsers = await User.find({ role: 'admin' });
        for (const admin of adminUsers) {
          await sendNotificationEmail(
            admin.email,
            `${admin.firstName} ${admin.lastName}`,
            'Certificate Deleted',
            `Certificate "${certificate.certificate}" for ${profile.firstName} ${profile.lastName} has been deleted.`,
            'warning'
          );
        }
        console.log('Admin notifications sent for certificate deletion');
        
      } catch (emailError) {
        console.error('Error sending certificate deletion emails:', emailError);
      }
    }
    
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Enhanced Certificate Expiry Monitoring with Email Notifications
const enhancedCertificateExpiryMonitoring = async () => {
  try {
    console.log('Running enhanced certificate expiry monitoring...');
    
    const today = new Date();
    const certificates = await Certificate.find({
      active: 'Yes',
      status: 'Approved',
      expiryDate: { $exists: true, $ne: null }
    }).populate('profileId');
    
    for (const certificate of certificates) {
      if (!certificate.profileId || !certificate.expiryDate) continue;
      
      const profile = certificate.profileId;
      const expiryDate = new Date(certificate.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      // Send expiry reminders
      if (daysUntilExpiry === 30 || daysUntilExpiry === 14 || daysUntilExpiry === 7 || daysUntilExpiry === 1) {
        try {
          // Send to user
          await sendCertificateExpiryReminderEmail(profile, certificate, daysUntilExpiry);
          
          // Send to admins
          const adminUsers = await User.find({ role: 'admin' });
          for (const admin of adminUsers) {
            await sendNotificationEmail(
              admin.email,
              `${admin.firstName} ${admin.lastName}`,
              `Certificate Expiring in ${daysUntilExpiry} Days`,
              `Certificate "${certificate.certificate}" for ${profile.firstName} ${profile.lastName} expires in ${daysUntilExpiry} days.`,
              daysUntilExpiry <= 7 ? 'error' : 'warning'
            );
          }
          
          console.log(`Expiry reminder sent for certificate ${certificate.certificate} (${daysUntilExpiry} days)`);
        } catch (emailError) {
          console.error('Error sending expiry reminder:', emailError);
        }
      }
      
      // Send expired notifications
      if (daysUntilExpiry < 0 && daysUntilExpiry >= -7) { // Send for first week after expiry
        try {
          // Send to user
          await sendCertificateExpiredEmail(profile, certificate);
          
          // Send to admins
          const adminUsers = await User.find({ role: 'admin' });
          for (const admin of adminUsers) {
            await sendNotificationEmail(
              admin.email,
              `${admin.firstName} ${admin.lastName}`,
              'Certificate EXPIRED',
              `Certificate "${certificate.certificate}" for ${profile.firstName} ${profile.lastName} has EXPIRED.`,
              'error'
            );
          }
          
          console.log(`Expired notification sent for certificate ${certificate.certificate}`);
        } catch (emailError) {
          console.error('Error sending expired notification:', emailError);
        }
      }
    }
    
    console.log('Certificate expiry monitoring completed');
  } catch (error) {
    console.error('Error in certificate expiry monitoring:', error);
  }
};

module.exports = {
  enhancedCreateProfile,
  enhancedUpdateProfile,
  enhancedCreateCertificate,
  enhancedUpdateCertificate,
  enhancedDeleteCertificate,
  enhancedCertificateExpiryMonitoring
};
