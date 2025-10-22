const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAnalytics() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: 'root',
    password: '',
    database: 'aja_timesheet',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔍 Testing Analytics Calculations...\n');

    // Test query for last 30 days
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().slice(0, 10);

    console.log(`Date Range: ${startDateStr} to ${endDate}\n`);

    const sql = `
      SELECT 
        COUNT(*) AS totalEntries,
        ROUND(SUM(t.total_hours), 2) AS totalHours,
        COUNT(CASE WHEN t.billable = 1 THEN 1 END) AS billableEntries,
        COUNT(CASE WHEN t.billable = 0 THEN 1 END) AS nonBillableEntries,
        COUNT(DISTINCT t.user_id) AS uniqueUsers,
        COUNT(DISTINCT t.date) AS totalDays
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      WHERE t.date BETWEEN ? AND ?
    `;

    const [rows] = await connection.execute(sql, [startDateStr, endDate]);
    const totals = rows[0];

    console.log('📊 Raw Database Results:');
    console.log('  Total Entries:', totals.totalEntries);
    console.log('  Total Hours:', totals.totalHours);
    console.log('  Billable Entries:', totals.billableEntries);
    console.log('  Non-Billable Entries:', totals.nonBillableEntries);
    console.log('  Unique Users:', totals.uniqueUsers);
    console.log('  Total Days:', totals.totalDays);
    console.log('');

    // Calculate metrics
    const totalHours = totals.totalHours || 0;
    const uniqueUsers = totals.uniqueUsers || 1;
    const totalDays = totals.totalDays || 1;

    const averageHoursPerUserPerDay = (uniqueUsers > 0 && totalDays > 0) 
      ? totalHours / (uniqueUsers * totalDays) 
      : 0;

    const expectedHoursPerDay = 8;
    const complianceRate = averageHoursPerUserPerDay > 0 
      ? Math.min(100, Math.round((averageHoursPerUserPerDay / expectedHoursPerDay) * 100)) 
      : 0;

    const expectedTotalHours = uniqueUsers * expectedHoursPerDay * totalDays;
    const utilizationRate = expectedTotalHours > 0 
      ? Math.min(100, Math.round((totalHours / expectedTotalHours) * 100)) 
      : 0;

    console.log('📈 Calculated Metrics:');
    console.log('  Avg Hours/User/Day:', averageHoursPerUserPerDay.toFixed(2));
    console.log('  Expected Total Hours:', expectedTotalHours);
    console.log('  Compliance Rate:', complianceRate + '%');
    console.log('  Utilization Rate:', utilizationRate + '%');
    console.log('');

    // Check for today
    const today = new Date().toISOString().slice(0, 10);
    const [todayRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM timesheet_entries WHERE date = ?',
      [today]
    );
    console.log(`📅 Entries for today (${today}):`, todayRows[0].count);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

testAnalytics();

