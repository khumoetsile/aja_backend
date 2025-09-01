const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    let user;
    try {
      const userResult = await query(
        'SELECT id, email, password, role, first_name, last_name, department, is_active FROM users WHERE email = ?',
        [email]
      );

      if (!userResult || !userResult[0] || userResult[0].length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      user = userResult[0][0];
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({ error: 'Database error occurred' });
    }

    // Check if user is active (MySQL returns 1 for true, 0 for false)
    if (!user.is_active || user.is_active === 0) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'aja-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Return user data (without password) and token
    const { password: _, ...userData } = user;
    
    res.json({
      message: 'Login successful',
      user: userData,
      token,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new user (Admin only)
router.post('/register', [
  authenticateToken,
  requireAdmin,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('role').isIn(['ADMIN', 'SUPERVISOR', 'STAFF']),
  body('department').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password, firstName, lastName, role, department } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser[0].length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await query(
      `INSERT INTO users (email, password, first_name, last_name, role, department, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, true, NOW())`,
      [email, hashedPassword, firstName, lastName, role, department]
    );
    
    // Get the inserted user
    const [insertedUser] = await query(
      'SELECT id, email, first_name, last_name, role, department, created_at FROM users WHERE email = ?',
      [email]
    );

    const { password: _, ...userData } = insertedUser[0];

    res.status(201).json({
      message: 'User created successfully',
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { password: _, ...userData } = req.user;
    res.json({ user: userData });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('department').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { firstName, lastName, department } = req.body;
    const updates = [];
    const values = [];

    if (firstName) {
      updates.push(`first_name = ?`);
      values.push(firstName);
    }

    if (lastName) {
      updates.push(`last_name = ?`);
      values.push(lastName);
    }

    if (department) {
      updates.push(`department = ?`);
      values.push(department);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    values.push(req.user.id);
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;

    await query(updateQuery, values);

    // Get updated user
    const [updatedUser] = await query(
      'SELECT id, email, first_name, last_name, role, department, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', [
  authenticateToken,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current password hash
    const userResult = await query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userResult[0][0].password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (Admin only)
router.get('/users', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, role, department, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
    );

    res.json({ users: result[0] });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle user status (Admin only)
router.put('/users/:userId/toggle-status', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await query(
      'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?',
      [userId]
    );
    
    // Get the updated user
    const [updatedUser] = await query(
      'SELECT id, email, is_active FROM users WHERE id = ?',
      [userId]
    );

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `User ${updatedUser[0].is_active ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 