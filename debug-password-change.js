const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('./config/database');

const app = express();
app.use(express.json());
app.use(cors());

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const userResult = await query(
      'SELECT id, email, password, role, first_name, last_name, department, is_active FROM users WHERE email = ?',
      [email]
    );
    
    if (userResult[0].length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult[0][0];
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      'aja-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        firstName: user.first_name, 
        lastName: user.last_name, 
        department: user.department 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Change password endpoint
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, 'aja-secret-key');
    console.log('JWT decoded:', decoded);
    
    const { currentPassword, newPassword } = req.body;
    const userId = decoded.userId;
    
    console.log('Change password request:', { 
      userId, 
      hasCurrentPassword: !!currentPassword, 
      hasNewPassword: !!newPassword,
      currentPasswordLength: currentPassword ? currentPassword.length : 0
    });
    
    // Get current user data
    const userResult = await query(
      'SELECT id, email, password FROM users WHERE id = ?',
      [userId]
    );
    
    console.log('Query result:', userResult);
    console.log('Query result structure:', { 
      isArray: Array.isArray(userResult), 
      length: userResult.length, 
      firstElement: userResult[0],
      firstElementLength: userResult[0] ? userResult[0].length : 'N/A'
    });
    
    if (userResult[0].length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult[0][0];
    
    console.log('User data:', { 
      id: user.id, 
      email: user.email, 
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordPreview: user.password ? user.password.substring(0, 10) + '...' : 'null'
    });
    
    if (!user.password) {
      return res.status(400).json({ 
        error: 'User account has no password set. Please contact administrator.' 
      });
    }
    
    // Verify current password
    try {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ 
          error: 'Current password is incorrect' 
        });
      }
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return res.status(500).json({ 
        error: 'Password verification failed' 
      });
    }
    
    res.json({ message: 'Password changed successfully' });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  
  // Test the functionality
  setTimeout(async () => {
    try {
      console.log('\n=== Testing change password ===');
      
      // Login
      const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@aja.com', password: 'admin123' })
      });
      
      const loginData = await loginResponse.json();
      console.log('Login result:', loginData);
      
      if (loginData.token) {
        // Test change password
        const changeResponse = await fetch('http://localhost:3002/api/auth/change-password', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${loginData.token}`
          },
          body: JSON.stringify({ 
            currentPassword: 'admin123', 
            newPassword: 'NewPassword123!' 
          })
        });
        
        const changeData = await changeResponse.json();
        console.log('Change password result:', changeData);
      }
      
    } catch (error) {
      console.error('Test error:', error);
    }
    
    process.exit(0);
  }, 2000);
});

