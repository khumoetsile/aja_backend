const mysql = require('mysql2/promise');

async function testDatabaseAccess() {
  const configs = [
    { name: 'Root with no password', user: 'root', password: '', database: 'aja_timesheet' },
    { name: 'Root with no password - khumocob_aja', user: 'root', password: '', database: 'khumocob_aja' },
    { name: 'khumocob_aja user', user: 'khumocob_aja', password: 'khumocob_aja', database: 'khumocob_aja' },
    { name: 'ajaco_timesheet user', user: 'ajaco_timesheet', password: 'IyhpJL4+%Vl2P+k2', database: 'ajaco_timesheet' }
  ];

  for (const config of configs) {
    try {
      console.log(`\n🔍 Testing: ${config.name}`);
      console.log(`   User: ${config.user}`);
      console.log(`   Database: ${config.database}`);
      
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: config.user,
        password: config.password,
        database: config.database,
        port: 3306,
      });

      // Test basic connection
      console.log('   ✅ Connection successful');
      
      // Test if we can query users table
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
      console.log(`   ✅ Users table accessible: ${rows[0].count} users`);
      
      // Test admin user specifically
      const [adminRows] = await connection.execute(
        'SELECT email, role, is_active FROM users WHERE email = ?',
        ['admin@aja.com']
      );
      
      if (adminRows.length > 0) {
        console.log(`   ✅ Admin user found: ${adminRows[0].email} (${adminRows[0].role})`);
      } else {
        console.log('   ❌ Admin user not found');
      }
      
      await connection.end();
      console.log('   🎉 This configuration works!');
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
}

testDatabaseAccess();
