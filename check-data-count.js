const mysql = require('mysql2/promise');

async function checkData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'aja_timesheet'
  });

  try {
    // Count total entries
    const [totalRows] = await connection.execute('SELECT COUNT(*) as total FROM timesheet_entries');
    console.log('\n📊 Total Timesheet Entries:', totalRows[0].total);

    // Count by date range
    const [dateRange] = await connection.execute(`
      SELECT MIN(date) as min_date, MAX(date) as max_date 
      FROM timesheet_entries
    `);
    console.log('📅 Date Range:', dateRange[0].min_date, 'to', dateRange[0].max_date);

    // Count by department
    const [deptCounts] = await connection.execute(`
      SELECT department, COUNT(*) as count 
      FROM timesheet_entries 
      GROUP BY department 
      ORDER BY count DESC
    `);
    console.log('\n🏢 By Department:');
    deptCounts.forEach(row => {
      console.log(`  ${row.department}: ${row.count} entries`);
    });

    // Count users
    const [userCount] = await connection.execute('SELECT COUNT(*) as total FROM users');
    console.log('\n👥 Total Users:', userCount[0].total);

  } finally {
    await connection.end();
  }
}

checkData().catch(console.error);

