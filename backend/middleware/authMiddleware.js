const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = await jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        if (req.session) {
          req.session.user = decoded;
        }
        return next();
      } catch (error) {
        console.error('JWT verification failed:', error.message);
      }
    }

    if (req.session && req.session.user) {
      req.user = req.session.user;
      return next();
    }

    console.error('Authentication failed - no valid JWT or session for url:', req.originalUrl);
    return res.status(401).json({ message: 'Authentication required' });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

module.exports = authMiddleware;
