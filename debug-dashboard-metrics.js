const mysql = require('mysql2/promise');

async function debugDashboardMetrics() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'aja_timesheet'
  });

  try {
    console.log('🔍 Testing dashboard metrics query...');
    
    // Test the exact query from the analytics route
    const metricsQuery = `
      SELECT 
        COUNT(te.id) as totalEntries,
        COALESCE(SUM(te.total_hours), 0) as totalHours,
        COALESCE(SUM(CASE WHEN te.billable = 1 THEN te.total_hours ELSE 0 END), 0) as billableHours,
        COUNT(DISTINCT te.user_id) as activeUsers,
        COUNT(DISTINCT te.department) as departments,
        COALESCE(AVG(te.total_hours), 0) as averageHoursPerEntry,
        SUM(CASE WHEN te.status = 'NotStarted' THEN 1 ELSE 0 END) as notStartedTasks,
        SUM(CASE WHEN te.status = 'CarriedOut' THEN 1 ELSE 0 END) as carriedOutTasks,
        SUM(CASE WHEN te.status = 'Completed' THEN 1 ELSE 0 END) as completedTasks
      FROM timesheet_entries te
      JOIN users u ON te.user_id = u.id
    `;
    
    const [metricsResult] = await connection.execute(metricsQuery);
    const metrics = metricsResult[0];
    
    console.log('✅ Metrics query successful:');
    console.log('  Total Entries:', metrics.totalEntries);
    console.log('  Total Hours:', metrics.totalHours);
    console.log('  Billable Hours:', metrics.billableHours);
    console.log('  Active Users:', metrics.activeUsers);
    console.log('  Departments:', metrics.departments);
    console.log('  Not Started:', metrics.notStartedTasks);
    console.log('  Carried Out:', metrics.carriedOutTasks);
    console.log('  Completed:', metrics.completedTasks);
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await connection.end();
  }
}

debugDashboardMetrics();
