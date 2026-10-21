const jwt = require('jsonwebtoken');

/**
 * Middleware to strictly verify JWT token.
 * Rejects missing, malformed, or expired tokens with HTTP 401.
 * Attaches decoded user ID to req.userId.
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Not authorized, token format must be Bearer <token>' });
    }

    const token = parts[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET environment variable is missing.');
      return res.status(500).json({ message: 'Internal server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Not authorized, invalid token payload' });
    }

    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * Middleware for optional authentication.
 * If valid Bearer token is present, sets req.userId.
 * If no token or invalid, proceeds without setting req.userId.
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.id) {
          req.userId = decoded.id;
        }
      }
    }
  } catch (error) {
    // Intentionally ignore token errors for optional auth
    req.userId = null;
  }
  next();
};

/**
 * Generates a signed JWT token with configurable expiration.
 * @param {string|mongoose.Types.ObjectId} id
 */
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required to generate tokens');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

module.exports = {
  verifyToken,
  optionalAuth,
  generateToken
};
