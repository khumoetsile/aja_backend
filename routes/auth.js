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
  body('password').isLength({ min: 4 })
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

// Test endpoint without auth
router.post('/register-test', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 4 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('role').isIn(['ADMIN', 'SUPERVISOR', 'STAFF']),
  body('department').trim().notEmpty()
], async (req, res) => {
  try {
    console.log('Test endpoint - Received data:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Test endpoint - Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    res.json({ message: 'Test validation passed', data: req.body });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new user (Admin only)
router.post('/register', [
  authenticateToken,
  requireAdmin,
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 4 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('role').isIn(['ADMIN', 'SUPERVISOR', 'STAFF']),
  body('department').trim().notEmpty()
], async (req, res) => {
  try {
    // Debug: Log the received data
    console.log('Received registration data:', req.body);
    console.log('Password field:', req.body.password);
    console.log('Role field:', req.body.role);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
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
  body('newPassword').isLength({ min: 4 })
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

// Update user (Admin only)
router.put('/users/:userId', [
  authenticateToken,
  requireAdmin,
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  // Email updates are not allowed for security reasons
  body('role').optional().isIn(['ADMIN', 'SUPERVISOR', 'STAFF']),
  body('department').optional().trim().notEmpty(),
  // Password updates are handled separately through change-password endpoint
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { userId } = req.params;
    const { firstName, lastName, role, department } = req.body;

    // Check if user exists
    const [existingUser] = await query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (firstName) {
      updates.push('first_name = ?');
      values.push(firstName);
    }

    if (lastName) {
      updates.push('last_name = ?');
      values.push(lastName);
    }

    // Email updates are not allowed for security reasons

    if (role) {
      updates.push('role = ?');
      values.push(role);
    }

    if (department) {
      updates.push('department = ?');
      values.push(department);
    }

    // Password updates are handled separately through the change-password endpoint

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    // Add updated_at and userId
    updates.push('updated_at = NOW()');
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    await query(updateQuery, values);

    // Get the updated user
    const [updatedUser] = await query(
      'SELECT id, email, first_name, last_name, role, department, is_active, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset user password (Admin only)
router.post('/users/:userId/reset-password', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const [existingUser] = await query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = existingUser[0];

    // Generate new secure password
    const bcrypt = require('bcryptjs');
    const generateSecurePassword = () => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*';
      
      let password = '';
      
      // Ensure at least one character from each category
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];
      
      // Fill the rest randomly
      const allChars = uppercase + lowercase + numbers + symbols;
      for (let i = 4; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    const newPassword = generateSecurePassword();
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    // Send email with new password
    const nodemailer = require('nodemailer');
    const emailConfig = {
      host: 'mail.khumo.co.bw',
      port: 465,
      secure: true,
      auth: {
        user: 'development@khumo.co.bw',
        pass: 'x}@j@{qVQ2$Eg6+.'
      }
    };

    const transporter = nodemailer.createTransport(emailConfig);

    const mailOptions = {
      from: '"AJA Timesheet System" <development@khumo.co.bw>',
      to: user.email,
      subject: 'Password Reset - AJA Timesheet System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset - AJA Timesheet System</h2>
          
          <p>Dear ${user.first_name} ${user.last_name},</p>
          
          <p>Your password has been reset by an administrator. Below are your new login credentials:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">New Login Information</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>New Password:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px;">${newPassword}</code></p>
          </div>
          
          <p><strong>Important Security Notes:</strong></p>
          <ul>
            <li>Please change your password after your first login</li>
            <li>Keep your login credentials secure and do not share them</li>
            <li>If you have any issues accessing the system, contact your administrator</li>
          </ul>
          
          <p>You can access the system at: <a href="https://timesheet.aja.co.bw" style="color: #007bff;">https://timesheet.aja.co.bw</a></p>
          
          <p>Best regards,<br>
          AJA Timesheet System Administrator</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="font-size: 12px; color: #6c757d;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send password reset email to ${user.email}:`, emailError.message);
      // Don't fail the request if email fails, but log it
    }

    res.json({
      message: 'Password reset successfully',
      emailSent: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 