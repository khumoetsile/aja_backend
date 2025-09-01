const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSettingsTable() {
  console.log('🔧 Creating user_settings table...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME
    });
    
    console.log('✅ Connected to database');
    
    // Create user_settings table
    const createSettingsTable = `
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
      )
    `;
    
    await connection.execute(createSettingsTable);
    console.log('✅ User settings table created successfully!');
    
    await connection.end();
    console.log('🎉 Settings table setup completed!');
    
  } catch (error) {
    console.error('❌ Error creating settings table:', error.message);
    process.exit(1);
  }
}

createSettingsTable();


