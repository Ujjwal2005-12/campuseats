const jwt = require('jsonwebtoken');

/**
 * Retrieves JWT secret from environment variables.
 * Throws an explicit error if missing to prevent signing/verifying with an undefined secret.
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return secret;
}

/**
 * Generates a signed JWT with minimal claims (id and role).
 * @param {Object} payload - Object containing id and role
 * @returns {string} Signed JSON Web Token
 */
function generateToken(payload) {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  const claims = {
    id: payload.id,
    role: payload.role
  };

  return jwt.sign(claims, secret, { expiresIn });
}

/**
 * Verifies and decodes a JWT.
 * @param {string} token - JWT token string
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

module.exports = {
  generateToken,
  verifyToken
};
