-- Manual SQL Script to Create User Settings Table
-- Run this directly in your MySQL database

USE khumocob_aja;

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    theme ENUM('light', 'dark') DEFAULT 'dark',
    density ENUM('comfortable', 'compact') DEFAULT 'comfortable',
    start_time TIME DEFAULT '08:00:00',
    end_time TIME DEFAULT '17:00:00',
    remember_filters BOOLEAN DEFAULT true,
    weekly_reminder BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_settings (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Verify table creation
SELECT 'Settings table created successfully!' as message;

-- Show table structure
DESCRIBE user_settings;


