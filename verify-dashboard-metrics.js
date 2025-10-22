const mysql = require('mysql2/promise');

async function verifyMetrics() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'aja_timesheet'
  });

  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 DASHBOARD METRICS VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');

    // 1. Total Entries
    const [totalEntries] = await connection.execute(
      'SELECT COUNT(*) as total FROM timesheet_entries'
    );
    console.log('1️⃣  Total Entries:', totalEntries[0].total);

    // 2. Total Hours
    const [totalHours] = await connection.execute(
      'SELECT SUM(total_hours) as total FROM timesheet_entries'
    );
    console.log('2️⃣  Total Hours:', parseFloat(totalHours[0].total).toFixed(2));

    // 3. Billable Hours
    const [billableHours] = await connection.execute(
      'SELECT SUM(total_hours) as total FROM timesheet_entries WHERE billable = 1'
    );
    console.log('3️⃣  Billable Hours:', parseFloat(billableHours[0].total).toFixed(2));

    // 4. Staff with Entries
    const [staffCount] = await connection.execute(
      'SELECT COUNT(DISTINCT user_id) as total FROM timesheet_entries'
    );
    console.log('4️⃣  Staff with Entries:', staffCount[0].total);

    // 5. Not Started Tasks
    const [notStarted] = await connection.execute(
      'SELECT COUNT(*) as total FROM timesheet_entries WHERE status = "NotStarted"'
    );
    console.log('5️⃣  Not Started Tasks:', notStarted[0].total);

    // 6. Carried Out Tasks
    const [carriedOut] = await connection.execute(
      'SELECT COUNT(*) as total FROM timesheet_entries WHERE status = "CarriedOut"'
    );
    console.log('6️⃣  Carried Out Tasks:', carriedOut[0].total);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📈 DEPARTMENT BREAKDOWN');
    console.log('═══════════════════════════════════════════════════════\n');

    // Department Stats
    const [deptStats] = await connection.execute(`
      SELECT 
        department,
        COUNT(*) as entries,
        SUM(total_hours) as hours,
        SUM(CASE WHEN billable = 1 THEN total_hours ELSE 0 END) as billable_hours,
        AVG(total_hours) as avg_hours,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        COUNT(*) as total
      FROM timesheet_entries
      GROUP BY department
      ORDER BY hours DESC
    `);

    deptStats.forEach((dept, index) => {
      const completionRate = ((dept.completed / dept.total) * 100).toFixed(1);
      console.log(`${index + 1}. ${dept.department}`);
      console.log(`   Entries: ${dept.entries} | Hours: ${parseFloat(dept.hours).toFixed(2)} | Billable: ${parseFloat(dept.billable_hours).toFixed(2)}`);
      console.log(`   Avg Hours: ${parseFloat(dept.avg_hours).toFixed(2)} | Completion Rate: ${completionRate}%\n`);
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('👥 TOP 10 USERS BY HOURS');
    console.log('═══════════════════════════════════════════════════════\n');

    // Top Users
    const [topUsers] = await connection.execute(`
      SELECT 
        u.first_name,
        u.last_name,
        u.email,
        COUNT(te.id) as entries,
        SUM(te.total_hours) as hours,
        SUM(CASE WHEN te.billable = 1 THEN te.total_hours ELSE 0 END) as billable_hours
      FROM users u
      JOIN timesheet_entries te ON u.id = te.user_id
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY hours DESC
      LIMIT 10
    `);

    topUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`   Entries: ${user.entries} | Hours: ${parseFloat(user.hours).toFixed(2)} | Billable: ${parseFloat(user.billable_hours).toFixed(2)}\n`);
    });

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 STATUS DISTRIBUTION');
    console.log('═══════════════════════════════════════════════════════\n');

    // Status Distribution
    const [statusDist] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM timesheet_entries)) as percentage
      FROM timesheet_entries
      GROUP BY status
    `);

    statusDist.forEach(status => {
      console.log(`${status.status}: ${status.count} (${parseFloat(status.percentage).toFixed(2)}%)`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('⚡ PRIORITY DISTRIBUTION');
    console.log('═══════════════════════════════════════════════════════\n');

    // Priority Distribution
    const [priorityDist] = await connection.execute(`
      SELECT 
        priority,
        COUNT(*) as count,
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM timesheet_entries)) as percentage
      FROM timesheet_entries
      GROUP BY priority
      ORDER BY FIELD(priority, 'Critical', 'High', 'Medium', 'Low')
    `);

    priorityDist.forEach(priority => {
      console.log(`${priority.priority}: ${priority.count} (${parseFloat(priority.percentage).toFixed(2)}%)`);
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📅 DATE RANGE & MONTHLY DISTRIBUTION');
    console.log('═══════════════════════════════════════════════════════\n');

    // Date Range
    const [dateRange] = await connection.execute(`
      SELECT 
        MIN(date) as first_entry,
        MAX(date) as last_entry,
        DATEDIFF(MAX(date), MIN(date)) as days_span
      FROM timesheet_entries
    `);
    console.log(`First Entry: ${dateRange[0].first_entry}`);
    console.log(`Last Entry: ${dateRange[0].last_entry}`);
    console.log(`Days Span: ${dateRange[0].days_span} days\n`);

    // Monthly Distribution
    const [monthlyDist] = await connection.execute(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as entries,
        SUM(total_hours) as hours
      FROM timesheet_entries
      GROUP BY month
      ORDER BY month
    `);

    console.log('Monthly Breakdown:');
    monthlyDist.forEach(month => {
      console.log(`  ${month.month}: ${month.entries} entries, ${parseFloat(month.hours).toFixed(2)} hours`);
    });

    console.log('\n═══════════════════════════════════════════════════════\n');

  } finally {
    await connection.end();
  }
}

verifyMetrics().catch(console.error);

