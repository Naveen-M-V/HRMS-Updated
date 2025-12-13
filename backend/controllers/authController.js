const EmployeeHub = require('../models/EmployeesHub');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');

/**
 * Unified Authentication Controller
 * Handles dual login system for Employees and Profiles
 * Employee/Admin Login → EmployeesHub schema
 * Profile Login → User schema
 */

// Generate JWT Token
const generateToken = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    userType: user.userType || user.role === 'profile' ? 'profile' : 'employee'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Employee/Admin Login
exports.employeeLogin = async (req, res) => {
  try {
    // Handle both 'email' and 'identifier' fields for compatibility
    const email = req.body.email || req.body.identifier;
    const { password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Authenticate employee
    const employee = await EmployeeHub.authenticate(email.toLowerCase(), password);

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken({
      ...employee.toObject(),
      userType: 'employee'
    });

    // Create response object without sensitive data
    const employeeResponse = {
      id: employee._id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      role: employee.role,
      employeeId: employee.employeeId,
      department: employee.department,
      jobTitle: employee.jobTitle,
      team: employee.team,
      isActive: employee.isActive,
      lastLogin: employee.lastLogin
    };

    // Set session
    req.session.user = {
      ...employeeResponse,
      userType: 'employee'
    };

    // Force session save before sending response
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to save session'
        });
      }

      console.log('✅ Session saved successfully for employee:', employee.email);
      
      res.status(200).json({
        success: true,
        message: `Welcome back, ${employee.firstName}!`,
        data: {
          user: employeeResponse,
          token,
          userType: 'employee'
        }
      });
    });

  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during login'
    });
  }
};

// Profile Login
exports.profileLogin = async (req, res) => {
  try {
    // Handle both 'email' and 'identifier' fields for compatibility
    const email = req.body.email || req.body.identifier;
    const { password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Authenticate profile
    const profile = await User.authenticate(email.toLowerCase(), password);

    if (!profile) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if profile is approved (only if explicitly set to false)
    // If undefined or true, allow login (backward compatibility)
    if (profile.isAdminApproved === false) {
      return res.status(403).json({
        success: false,
        message: 'Your profile is pending admin approval'
      });
    }

    // Generate token
    const token = generateToken({
      ...profile.toObject(),
      userType: 'profile'
    });

    // Create response object without sensitive data
    const profileResponse = {
      id: profile._id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      vtid: profile.vtid,
      profileType: profile.profileType,
      institution: profile.institution,
      course: profile.course,
      isActive: profile.isActive,
      lastLogin: profile.lastLogin
    };

    // Set session
    req.session.user = {
      ...profileResponse,
      userType: 'profile'
    };

    // Force session save before sending response
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to save session'
        });
      }

      console.log('✅ Session saved successfully for profile:', profile.email);
      
      res.status(200).json({
        success: true,
        message: `Welcome back, ${profile.firstName}!`,
        data: {
          user: profileResponse,
          token,
          userType: 'profile'
        }
      });
    });

  } catch (error) {
    console.error('Profile login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during login'
    });
  }
};

// Unified Login (detects user type automatically)
exports.unifiedLogin = async (req, res) => {
  try {
    // Handle both 'email' and 'identifier' fields for compatibility
    const email = req.body.email || req.body.identifier;
    const { password, userType } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // If userType is specified, use specific login
    if (userType === 'employee') {
      return exports.employeeLogin(req, res);
    } else if (userType === 'profile') {
      return exports.profileLogin(req, res);
    }

    // Auto-detect user type
    const normalizedEmail = email.toLowerCase();
    
    // Try employee login first
    try {
      const employee = await EmployeeHub.authenticate(normalizedEmail, password);
      if (employee) {
        const token = generateToken({
          ...employee.toObject(),
          userType: 'employee'
        });

        const employeeResponse = {
          id: employee._id,
          email: employee.email,
          firstName: employee.firstName,
          lastName: employee.lastName,
          role: employee.role,
          employeeId: employee.employeeId,
          department: employee.department,
          jobTitle: employee.jobTitle,
          team: employee.team,
          isActive: employee.isActive,
          lastLogin: employee.lastLogin
        };

        // Set session for employee
        req.session.user = {
          ...employeeResponse,
          userType: 'employee'
        };

        // Force session save before sending response
        return req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({
              success: false,
              message: 'Failed to save session'
            });
          }

          console.log('✅ Session saved successfully (unified) for employee:', employee.email);
          
          return res.status(200).json({
            success: true,
            message: `Welcome back, ${employee.firstName}!`,
            data: {
              user: employeeResponse,
              token,
              userType: 'employee'
            }
          });
        });
      }
    } catch (employeeError) {
      // Employee login failed, try profile login
    }

    // Try profile login
    try {
      const profile = await User.authenticate(normalizedEmail, password);
      if (profile) {
        // Check if profile is approved (only if explicitly set to false)
        if (profile.isAdminApproved === false) {
          return res.status(403).json({
            success: false,
            message: 'Your profile is pending admin approval'
          });
        }

        const token = generateToken({
          ...profile.toObject(),
          userType: 'profile'
        });

        const profileResponse = {
          id: profile._id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: profile.role,
          vtid: profile.vtid,
          profileType: profile.profileType,
          institution: profile.institution,
          course: profile.course,
          isActive: profile.isActive,
          lastLogin: profile.lastLogin
        };

        // Set session for profile
        req.session.user = {
          ...profileResponse,
          userType: 'profile'
        };

        // Force session save before sending response
        return req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({
              success: false,
              message: 'Failed to save session'
            });
          }

          console.log('✅ Session saved successfully (unified) for profile:', profile.email);
          
          return res.status(200).json({
            success: true,
            message: `Welcome back, ${profile.firstName}!`,
            data: {
              user: profileResponse,
              token,
              userType: 'profile'
            }
          });
        });
      }
    } catch (profileError) {
      // Profile login failed
    }

    // Both logins failed
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });

  } catch (error) {
    console.error('Unified login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during login'
    });
  }
};

// Get Current User (for token validation)
exports.getCurrentUser = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    // Get user based on type
    if (decoded.userType === 'employee') {
      const employee = await EmployeeHub.findById(decoded.id)
        .select('-password')
        .populate('team', 'name initials');
      
      if (!employee || !employee.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Employee not found or inactive'
        });
      }

      const employeeResponse = {
        id: employee._id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
        employeeId: employee.employeeId,
        department: employee.department,
        jobTitle: employee.jobTitle,
        team: employee.team,
        isActive: employee.isActive,
        lastLogin: employee.lastLogin
      };

      res.status(200).json({
        success: true,
        data: {
          user: employeeResponse,
          userType: 'employee'
        }
      });

    } else if (decoded.userType === 'profile') {
      const profile = await User.findById(decoded.id).select('-password');
      
      if (!profile || !profile.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Profile not found or inactive'
        });
      }

      const profileResponse = {
        id: profile._id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: profile.role,
        vtid: profile.vtid,
        profileType: profile.profileType,
        institution: profile.institution,
        course: profile.course,
        isActive: profile.isActive,
        lastLogin: profile.lastLogin
      };

      res.status(200).json({
        success: true,
        data: {
          user: profileResponse,
          userType: 'profile'
        }
      });

    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid user type in token'
      });
    }

  } catch (error) {
    console.error('Get current user error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout (client-side token removal)
exports.logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can add token blacklisting if needed
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
};

// Change Password (for both employees and profiles)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    if (decoded.userType === 'employee') {
      const employee = await EmployeeHub.findById(decoded.id).select('+password');
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Verify current password
      const isMatch = await employee.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      employee.password = newPassword;
      await employee.save();

    } else if (decoded.userType === 'profile') {
      const profile = await User.findById(decoded.id).select('+password');
      
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }

      // Verify current password
      const isMatch = await profile.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      profile.password = newPassword;
      await profile.save();
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Forgot Password (for both employees and profiles)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const normalizedEmail = email.toLowerCase();
    let user = null;
    let userType = null;

    // Try to find in EmployeeHub first
    user = await EmployeeHub.findOne({ email: normalizedEmail, isActive: true });
    if (user) {
      userType = 'employee';
    } else {
      // Try User model
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        userType = 'profile';
      }
    }

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Handle different field names between models
    if (userType === 'employee') {
      user.passwordResetToken = resetTokenHash;
      user.passwordResetExpires = Date.now() + 3600000;
    } else {
      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpires = Date.now() + 3600000;
    }
    await user.save();

    // Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'https://hrms.talentshield.co.uk'}/reset-password?token=${resetToken}&email=${email}`;
    
    try {
      await sendPasswordResetEmail(
        user.email,
        user.firstName || 'User',
        resetUrl,
        resetToken
      );
      
      console.log(`✅ Password reset email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send reset email:', emailError.message);
      // Don't fail the request if email fails - user can still use the link if logged
      console.log('📧 Reset URL (for debugging):', resetUrl);
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent to your email address.',
      // Only include resetUrl in development for debugging
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset Password (for both employees and profiles)
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, email, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const normalizedEmail = email.toLowerCase();
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    let user = null;
    let userType = null;

    // Try to find user in EmployeeHub
    user = await EmployeeHub.findOne({
      email: normalizedEmail,
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (user) {
      userType = 'employee';
    } else {
      // Try User model (different field names)
      user = await User.findOne({
        email: normalizedEmail,
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { $gt: Date.now() }
      });
      if (user) {
        userType = 'profile';
      }
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset tokens
    user.password = newPassword;
    
    // Clear reset tokens based on model type
    if (userType === 'employee') {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
    } else {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
    }
    
    await user.save();

    console.log(`✅ Password reset successful for: ${user.email}`);
    console.log(`   User Type: ${userType}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
