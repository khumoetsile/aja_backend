const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearAndReseed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aja_timesheet',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🧹 Clearing old data...');
    
    // Delete all timesheet entries
    await connection.execute('DELETE FROM timesheet_entries');
    console.log('✅ Cleared timesheet entries');
    
    // Delete all users except admin
    await connection.execute(`DELETE FROM users WHERE email != 'admin@aja.com'`);
    console.log('✅ Cleared users (kept admin)');
    
    // Update database constraint to allow correct statuses
    console.log('\n📝 Updating status constraint...');
    try {
      // Drop old constraint
      await connection.execute(`ALTER TABLE timesheet_entries DROP CHECK timesheet_entries_chk_2`);
    } catch (e) {
      console.log('Old constraint not found or already dropped');
    }
    
    // Add new constraint
    await connection.execute(`
      ALTER TABLE timesheet_entries 
      ADD CONSTRAINT timesheet_entries_status_check 
      CHECK (status IN ('Completed', 'CarriedOut', 'NotStarted'))
    `);
    console.log('✅ Updated status constraint');
    
    console.log('\n✅ Database cleared and ready for re-seeding!');
    console.log('Run: node seed-large-dataset.js');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

clearAndReseed();

