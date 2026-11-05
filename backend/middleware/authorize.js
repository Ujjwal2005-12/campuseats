/**
 * Role-based authorization middleware factory.
 * Verifies that req.user is authenticated and that req.user.role matches allowed roles.
 * @param  {...string} allowedRoles - Array or rest params of permitted role strings (e.g. 'ADMIN', 'FACULTY', 'STUDENT')
 * @returns {Function} Express middleware
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = authorize;
