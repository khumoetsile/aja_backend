const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aja-secret-key');
    
    // Get user details from database
    const result = await query(
      'SELECT id, email, role, first_name, last_name, department FROM users WHERE id = ? AND is_active = true',
      [decoded.userId]
    );

    if (result[0].length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = result[0][0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Specific role middleware
const requireAdmin = authorizeRole(['ADMIN']);
const requireSupervisor = authorizeRole(['ADMIN', 'SUPERVISOR']);
const requireStaff = authorizeRole(['ADMIN', 'SUPERVISOR', 'STAFF']);

module.exports = {
  authenticateToken,
  authorizeRole,
  requireAdmin,
  requireSupervisor,
  requireStaff
}; 