const EmployeeHub = require('../models/EmployeesHub');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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
    const { email, password } = req.body;

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

    res.status(200).json({
      success: true,
      message: `Welcome back, ${employee.firstName}!`,
      data: {
        user: employeeResponse,
        token,
        userType: 'employee'
      }
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
    const { email, password } = req.body;

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

    // Check if profile is approved
    if (!profile.isAdminApproved) {
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

    res.status(200).json({
      success: true,
      message: `Welcome back, ${profile.firstName}!`,
      data: {
        user: profileResponse,
        token,
        userType: 'profile'
      }
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
    const { email, password, userType } = req.body;

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

        return res.status(200).json({
          success: true,
          message: `Welcome back, ${employee.firstName}!`,
          data: {
            user: employeeResponse,
            token,
            userType: 'employee'
          }
        });
      }
    } catch (employeeError) {
      // Employee login failed, try profile login
    }

    // Try profile login
    try {
      const profile = await User.authenticate(normalizedEmail, password);
      if (profile) {
        if (!profile.isAdminApproved) {
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

        return res.status(200).json({
          success: true,
          message: `Welcome back, ${profile.firstName}!`,
          data: {
            user: profileResponse,
            token,
            userType: 'profile'
          }
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
