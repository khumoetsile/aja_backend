const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdminPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aja_timesheet',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔧 Resetting admin@aja.com password to admin123...');
    
    // Hash the new password
    const saltRounds = 12;
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the password in the database
    const [result] = await connection.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?',
      [hashedPassword, 'admin@aja.com']
    );
    
    if (result.affectedRows === 0) {
      console.log('❌ User admin@aja.com not found');
      return;
    }
    
    console.log('✅ Password updated successfully!');
    console.log(`   Email: admin@aja.com`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   New Hash: ${hashedPassword}`);
    
    // Verify the password works
    const [rows] = await connection.execute(
      'SELECT password FROM users WHERE email = ?',
      ['admin@aja.com']
    );
    
    if (rows.length > 0) {
      const isMatch = await bcrypt.compare(newPassword, rows[0].password);
      console.log(`   Verification: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetAdminPassword();
