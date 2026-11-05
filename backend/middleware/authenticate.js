const { verifyToken } = require('../utils/token');

/**
 * Authentication middleware to verify JWT in the Authorization header.
 * Enforces 'Bearer <token>' pattern.
 * Rejects missing, malformed, invalid, or expired tokens with HTTP 401.
 * Attaches verified identity strictly to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id || !decoded.role) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Attach verified token claims; ignore any body/query parameters
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication required' });
  }
}

module.exports = authenticate;
