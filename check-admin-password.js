const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdminPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aja_timesheet',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔍 Checking admin@aja.com user...');
    
    const [rows] = await connection.execute(
      'SELECT email, password, first_name, last_name, role, department, is_active FROM users WHERE email = ?',
      ['admin@aja.com']
    );
    
    if (rows.length === 0) {
      console.log('❌ User admin@aja.com not found');
      return;
    }
    
    const user = rows[0];
    console.log('✅ Admin user found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Department: ${user.department}`);
    console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
    console.log(`   Password Hash: ${user.password}`);
    
    // Test if the default password works
    const bcrypt = require('bcryptjs');
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    
    console.log(`\n🔐 Password Test:`);
    console.log(`   Testing password: ${testPassword}`);
    console.log(`   Result: ${isMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
    
    if (!isMatch) {
      console.log('\n💡 To reset password, run:');
      console.log('   node reset-admin-password.js newpassword123');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAdminPassword();
