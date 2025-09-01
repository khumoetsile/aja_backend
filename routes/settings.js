const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get user settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Getting settings for user:', req.user.id);
    
    // Get user settings from database
    const [settings] = await query(
      'SELECT theme, density, start_time, end_time, remember_filters, weekly_reminder, created_at, updated_at FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    // If no settings exist, return defaults
    if (!settings || settings.length === 0) {
      const defaultSettings = {
        theme: 'dark',
        density: 'comfortable',
        start_time: '08:00',
        end_time: '17:00',
        remember_filters: true,
        weekly_reminder: false,
        created_at: null,
        updated_at: null
      };
      
      console.log('📋 No settings found, returning defaults');
      return res.json({
        message: 'Default settings returned',
        settings: defaultSettings
      });
    }

    console.log('✅ Settings retrieved successfully');
    res.json({
      message: 'Settings retrieved successfully',
      settings: settings[0]
    });

  } catch (error) {
    console.error('❌ Error getting settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
router.put('/', [
  authenticateToken,
  body('theme').optional().isIn(['light', 'dark']).withMessage('Theme must be light or dark'),
  body('density').optional().isIn(['comfortable', 'compact']).withMessage('Density must be comfortable or compact'),
  body('start_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
  body('remember_filters').optional().isBoolean().withMessage('Remember filters must be boolean'),
  body('weekly_reminder').optional().isBoolean().withMessage('Weekly reminder must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { theme, density, start_time, end_time, remember_filters, weekly_reminder } = req.body;
    
    console.log('🔧 Updating settings for user:', req.user.id);
    console.log('📝 Settings data:', req.body);

    // Check if settings already exist
    const [existingSettings] = await query(
      'SELECT id FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      const updates = [];
      const values = [];

      if (theme !== undefined) {
        updates.push('theme = ?');
        values.push(theme);
      }
      if (density !== undefined) {
        updates.push('density = ?');
        values.push(density);
      }
      if (start_time !== undefined) {
        updates.push('start_time = ?');
        values.push(start_time);
      }
      if (end_time !== undefined) {
        updates.push('end_time = ?');
        values.push(end_time);
      }
      if (remember_filters !== undefined) {
        updates.push('remember_filters = ?');
        values.push(remember_filters);
      }
      if (weekly_reminder !== undefined) {
        updates.push('weekly_reminder = ?');
        values.push(weekly_reminder);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid settings provided' });
      }

      values.push(req.user.id);
      const updateQuery = `
        UPDATE user_settings 
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE user_id = ?
      `;

      await query(updateQuery, values);
      console.log('✅ Settings updated successfully');

    } else {
      // Create new settings
      await query(`
        INSERT INTO user_settings (
          user_id, theme, density, start_time, end_time, 
          remember_filters, weekly_reminder, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        req.user.id,
        theme || 'dark',
        density || 'comfortable',
        start_time || '08:00',
        end_time || '17:00',
        remember_filters !== undefined ? remember_filters : true,
        weekly_reminder !== undefined ? weekly_reminder : false
      ]);
      console.log('✅ Settings created successfully');
    }

    // Get updated settings
    const [updatedSettings] = await query(
      'SELECT theme, density, start_time, end_time, remember_filters, weekly_reminder, created_at, updated_at FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Settings updated successfully',
      settings: updatedSettings[0]
    });

  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset settings to defaults
router.delete('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Resetting settings for user:', req.user.id);

    // Delete existing settings
    await query('DELETE FROM user_settings WHERE user_id = ?', [req.user.id]);

    // Return default settings
    const defaultSettings = {
      theme: 'dark',
      density: 'comfortable',
      start_time: '08:00',
      end_time: '17:00',
      remember_filters: true,
      weekly_reminder: false,
      created_at: null,
      updated_at: null
    };

    console.log('✅ Settings reset to defaults');
    res.json({
      message: 'Settings reset to defaults',
      settings: defaultSettings
    });

  } catch (error) {
    console.error('❌ Error resetting settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
