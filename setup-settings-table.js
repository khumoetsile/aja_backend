const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupSettingsTable() {
  console.log('🔧 Setting up user settings table...');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'khumocob_aja', 
    password: process.env.DB_PASSWORD || 'khumocob_aja',
    database: process.env.DB_NAME || 'khumocob_aja',
    port: process.env.DB_PORT || 3306
  });

  try {
    // Create user_settings table with MySQL syntax
    const createTableSQL = `
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
    
    await connection.execute(createTableSQL);
    
    // Add indexes for better performance
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)
    `;
    
    await connection.execute(indexSQL);
    
    console.log('✅ User settings table created successfully!');
    console.log('📋 Table includes:');
    console.log('   - Theme preferences (light/dark)');
    console.log('   - UI density (comfortable/compact)');
    console.log('   - Workday hours (start/end time)');
    console.log('   - Dashboard filter memory');
    console.log('   - Weekly reminder settings');
    
  } catch (error) {
    console.error('❌ Error setting up settings table:', error);
    
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('📋 Settings table already exists - skipping creation');
    } else {
      throw error;
    }
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupSettingsTable()
    .then(() => {
      console.log('🎉 Settings table setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupSettingsTable };
