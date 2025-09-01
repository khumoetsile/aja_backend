const mysql = require('mysql2/promise');

async function createSettingsTable() {
  console.log('🔧 Creating settings table...');
  
  // Using the same connection settings as the app
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'khumocob_aja',
    password: 'khumocob_aja',
    database: 'khumocob_aja',
    port: 3306
  });

  try {
    // Create the table
    await connection.execute(`
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
    `);
    
    console.log('✅ Settings table created successfully!');
    
    // Check if table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'user_settings'");
    console.log('📋 Table exists:', tables.length > 0);
    
    // Show table structure
    const [structure] = await connection.execute("DESCRIBE user_settings");
    console.log('📝 Table structure:', structure);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createSettingsTable();


