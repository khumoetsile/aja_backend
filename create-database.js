const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  console.log('🔧 Creating database and tables...');
  
  try {
    // Connect without specifying database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ Database '${process.env.DB_NAME}' created/verified`);
    
    // Use the database
    await connection.execute(`USE ${process.env.DB_NAME}`);
    console.log(`✅ Using database '${process.env.DB_NAME}'`);
    
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'SUPERVISOR', 'STAFF') DEFAULT 'STAFF',
        department VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await connection.execute(createUsersTable);
    console.log('✅ Users table created/verified');
    
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
    console.log('✅ User settings table created/verified');
    
    // Create timesheet tables
    const createTimesheetTable = `
      CREATE TABLE IF NOT EXISTS timesheet_entries (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        break_minutes INT DEFAULT 0,
        total_hours DECIMAL(4,2),
        status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_date (user_id, date)
      )
    `;
    await connection.execute(createTimesheetTable);
    console.log('✅ Timesheet entries table created/verified');
    
    // Check if we need to create a test user
    const [existingUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      // Create a test admin user (password: 'admin123')
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await connection.execute(`
        INSERT INTO users (email, first_name, last_name, password_hash, role, department, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ['admin@aja.com', 'Admin', 'User', hashedPassword, 'ADMIN', 'IT', true]);
      
      console.log('✅ Test admin user created: admin@aja.com / admin123');
    } else {
      console.log('✅ Users already exist in database');
    }
    
    await connection.end();
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

createDatabase();


