// Admin Authorization System for HRMS
// This file contains the admin signup and approval system

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Super Admin Email List
const SUPER_ADMIN_EMAILS = [
  'dean.cumming@vitrux.co.uk',
  'syed.shahab.ahmed@vitrux.co.uk',
  'tazeen.syeda@vitrux.co.uk',
  'thaya.govzig@vitruxshield.com',
  'syed.ali.asgar@vitruxshield.com',
  'mvnaveen18@gmail.com'
];

// Admin signup endpoint (requires super admin approval)
const adminSignup = async (req, res, User, sendNotificationEmail, JWT_SECRET) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create admin user (pending approval)
    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      role: 'admin',
      isActive: false, // Inactive until approved
      emailVerified: false,
      adminApprovalStatus: 'pending'
    });
    
    await newUser.save();
    console.log('Admin signup request created for:', email);
    
    // Send verification email to the new admin
    const verificationToken = jwt.sign({ email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
    newUser.verificationToken = verificationToken;
    await newUser.save();
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/api/verify-email?token=${verificationToken}`;
    
    await sendNotificationEmail(
      newUser.email,
      `${newUser.firstName} ${newUser.lastName}`,
      'Verify Your Admin Account Email',
      `Please verify your email address by clicking the link below:\n\n${verifyUrl}\n\nAfter verification, your account will be reviewed by super administrators for approval.`,
      'info'
    );
    
    // Send authorization request to all super admins
    for (const superAdminEmail of SUPER_ADMIN_EMAILS) {
      const superAdmin = await User.findOne({ email: superAdminEmail });
      if (superAdmin) {
        const approvalUrl = `${frontendUrl}/admin/approve-user/${newUser._id}`;
        await sendNotificationEmail(
          superAdminEmail,
          `${superAdmin.firstName || 'Admin'} ${superAdmin.lastName || 'User'}`,
          'New Admin Account Approval Required',
          `A new admin account request has been submitted:\n\nName: ${newUser.firstName} ${newUser.lastName}\nEmail: ${newUser.email}\n\nPlease review and approve/reject this request in the admin panel.\n\nApproval URL: ${approvalUrl}`,
          'warning'
        );
      }
    }
    
    res.status(201).json({ 
      message: 'Admin account request submitted successfully. Please check your email for verification and wait for super admin approval.',
      userId: newUser._id
    });
    
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ message: 'Server error during admin signup' });
  }
};

// Super admin approval endpoint
const approveAdminUser = async (req, res, User, sendNotificationEmail) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    
    // Check if requester is super admin
    if (!SUPER_ADMIN_EMAILS.includes(req.user.email)) {
      return res.status(403).json({ message: 'Only super administrators can approve admin accounts' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (action === 'approve') {
      user.adminApprovalStatus = 'approved';
      user.isActive = true;
      await user.save();
      
      // Send approval email to new admin
      await sendNotificationEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        'Admin Account Approved',
        `Congratulations! Your admin account has been approved.\n\nYou can now login to the HRMS system with your credentials.\n\nLogin URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        'success'
      );
      
      res.json({ message: 'Admin account approved successfully' });
    } else if (action === 'reject') {
      user.adminApprovalStatus = 'rejected';
      user.isActive = false;
      await user.save();
      
      // Send rejection email
      await sendNotificationEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        'Admin Account Request Rejected',
        `Your admin account request has been rejected. Please contact the system administrator for more information.`,
        'error'
      );
      
      res.json({ message: 'Admin account rejected' });
    } else {
      res.status(400).json({ message: 'Invalid action. Use "approve" or "reject"' });
    }
    
  } catch (error) {
    console.error('Admin approval error:', error);
    res.status(500).json({ message: 'Server error during admin approval' });
  }
};

// Get pending admin approvals (for super admins)
const getPendingAdminApprovals = async (req, res, User) => {
  try {
    // Check if requester is super admin
    if (!SUPER_ADMIN_EMAILS.includes(req.user.email)) {
      return res.status(403).json({ message: 'Only super administrators can view pending approvals' });
    }
    
    const pendingAdmins = await User.find({
      role: 'admin',
      adminApprovalStatus: 'pending'
    }).select('firstName lastName email createdAt');
    
    res.json(pendingAdmins);
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ message: 'Server error fetching pending approvals' });
  }
};

module.exports = {
  SUPER_ADMIN_EMAILS,
  adminSignup,
  approveAdminUser,
  getPendingAdminApprovals
};
