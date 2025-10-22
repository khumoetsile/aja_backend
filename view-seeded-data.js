const mysql = require('mysql2/promise');
require('dotenv').config();

async function viewSeededData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aja_timesheet',
    port: process.env.DB_PORT || 3306
  });

  console.log('\n📊 DATABASE CONTENTS SUMMARY\n');
  console.log('='.repeat(80));

  try {
    // Total counts
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [entryCount] = await connection.execute('SELECT COUNT(*) as count FROM timesheet_entries');
    const [deptCount] = await connection.execute('SELECT COUNT(*) as count FROM departments');

    console.log('\n📈 TOTALS:');
    console.log(`  • Users: ${userCount[0].count}`);
    console.log(`  • Departments: ${deptCount[0].count}`);
    console.log(`  • Timesheet Entries: ${entryCount[0].count}`);

    // User breakdown by role
    const [roleBreakdown] = await connection.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY FIELD(role, 'ADMIN', 'SUPERVISOR', 'STAFF')
    `);

    console.log('\n👥 USERS BY ROLE:');
    for (const row of roleBreakdown) {
      console.log(`  • ${row.role}: ${row.count}`);
    }

    // Department breakdown
    const [deptBreakdown] = await connection.execute(`
      SELECT 
        u.department,
        COUNT(*) as user_count,
        SUM(CASE WHEN u.role = 'SUPERVISOR' THEN 1 ELSE 0 END) as supervisors,
        SUM(CASE WHEN u.role = 'STAFF' THEN 1 ELSE 0 END) as staff
      FROM users u
      WHERE u.role != 'ADMIN'
      GROUP BY u.department
      ORDER BY user_count DESC
    `);

    console.log('\n🏢 USERS BY DEPARTMENT:');
    console.log('─'.repeat(60));
    console.log(sprintf('%-20s %12s %12s %12s', 'Department', 'Total', 'Supervisors', 'Staff'));
    console.log('─'.repeat(60));
    for (const row of deptBreakdown) {
      console.log(sprintf('%-20s %12d %12d %12d', 
        row.department, row.user_count, row.supervisors, row.staff));
    }

    // Sample users
    const [sampleUsers] = await connection.execute(`
      SELECT email, first_name, last_name, role, department 
      FROM users 
      ORDER BY 
        FIELD(role, 'ADMIN', 'SUPERVISOR', 'STAFF'),
        department,
        first_name
      LIMIT 20
    `);

    console.log('\n👤 SAMPLE USERS (First 20):');
    console.log('─'.repeat(80));
    console.log(sprintf('%-35s %-20s %-12s %s', 'Email', 'Name', 'Role', 'Department'));
    console.log('─'.repeat(80));
    for (const user of sampleUsers) {
      const name = `${user.first_name} ${user.last_name}`;
      console.log(sprintf('%-35s %-20s %-12s %s', 
        user.email, name, user.role, user.department));
    }

    // Timesheet statistics
    const [entryStats] = await connection.execute(`
      SELECT 
        MIN(date) as earliest_date,
        MAX(date) as latest_date,
        ROUND(SUM(total_hours), 2) as total_hours,
        ROUND(AVG(total_hours), 2) as avg_hours,
        COUNT(CASE WHEN billable = 1 THEN 1 END) as billable_count,
        COUNT(CASE WHEN billable = 0 THEN 1 END) as non_billable_count
      FROM timesheet_entries
    `);

    const stats = entryStats[0];
    console.log('\n📅 TIMESHEET ENTRIES:');
    console.log(`  • Date Range: ${stats.earliest_date} to ${stats.latest_date}`);
    console.log(`  • Total Hours: ${stats.total_hours}`);
    console.log(`  • Average Hours per Entry: ${stats.avg_hours}`);
    console.log(`  • Billable Entries: ${stats.billable_count}`);
    console.log(`  • Non-Billable Entries: ${stats.non_billable_count}`);

    // Status distribution
    const [statusDist] = await connection.execute(`
      SELECT status, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
      FROM timesheet_entries
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('\n📊 STATUS DISTRIBUTION:');
    for (const row of statusDist) {
      console.log(`  • ${row.status}: ${row.count} (${row.percentage}%)`);
    }

    // Priority distribution
    const [priorityDist] = await connection.execute(`
      SELECT priority, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
      FROM timesheet_entries
      GROUP BY priority
      ORDER BY FIELD(priority, 'Critical', 'High', 'Medium', 'Low')
    `);

    console.log('\n🔥 PRIORITY DISTRIBUTION:');
    for (const row of priorityDist) {
      console.log(`  • ${row.priority}: ${row.count} (${row.percentage}%)`);
    }

    // Top 10 most active users
    const [topUsers] = await connection.execute(`
      SELECT 
        u.first_name,
        u.last_name,
        u.email,
        u.department,
        COUNT(te.id) as entry_count,
        ROUND(SUM(te.total_hours), 2) as total_hours
      FROM users u
      LEFT JOIN timesheet_entries te ON u.id = te.user_id
      WHERE u.role IN ('STAFF', 'SUPERVISOR')
      GROUP BY u.id
      ORDER BY entry_count DESC
      LIMIT 10
    `);

    console.log('\n🏆 TOP 10 MOST ACTIVE USERS:');
    console.log('─'.repeat(80));
    console.log(sprintf('%-30s %-20s %12s %12s', 'Name', 'Department', 'Entries', 'Hours'));
    console.log('─'.repeat(80));
    for (const user of topUsers) {
      const name = `${user.first_name} ${user.last_name}`;
      console.log(sprintf('%-30s %-20s %12d %12.2f', 
        name, user.department, user.entry_count, user.total_hours || 0));
    }

    // Department performance
    const [deptPerf] = await connection.execute(`
      SELECT 
        department,
        COUNT(*) as total_entries,
        ROUND(SUM(total_hours), 2) as total_hours,
        ROUND(AVG(total_hours), 2) as avg_hours,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN billable = 1 THEN 1 END) as billable
      FROM timesheet_entries
      GROUP BY department
      ORDER BY total_hours DESC
      LIMIT 10
    `);

    console.log('\n🏢 TOP DEPARTMENTS BY HOURS:');
    console.log('─'.repeat(90));
    console.log(sprintf('%-20s %10s %12s %10s %10s %10s', 
      'Department', 'Entries', 'Total Hrs', 'Avg Hrs', 'Completed', 'Billable'));
    console.log('─'.repeat(90));
    for (const dept of deptPerf) {
      console.log(sprintf('%-20s %10d %12.2f %10.2f %10d %10d', 
        dept.department, dept.total_entries, dept.total_hours, dept.avg_hours, 
        dept.completed, dept.billable));
    }

    // Monthly trend (last 6 months)
    const [monthlyTrend] = await connection.execute(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        COUNT(*) as entries,
        ROUND(SUM(total_hours), 2) as hours,
        COUNT(DISTINCT user_id) as active_users
      FROM timesheet_entries
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month DESC
    `);

    console.log('\n📆 MONTHLY ACTIVITY (Last 6 Months):');
    console.log('─'.repeat(70));
    console.log(sprintf('%-10s %15s %15s %15s', 'Month', 'Entries', 'Hours', 'Active Users'));
    console.log('─'.repeat(70));
    for (const month of monthlyTrend) {
      console.log(sprintf('%-10s %15d %15.2f %15d', 
        month.month, month.entries, month.hours, month.active_users));
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 TIP: All users have password: admin123\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

function sprintf(format, ...args) {
  let argIndex = 0;
  return format.replace(/%(-)?(\d+)?(?:\.(\d+))?([sdf])/g, (match, leftAlign, width, precision, type) => {
    let value = args[argIndex++];
    
    if (type === 'f') {
      value = precision ? parseFloat(value).toFixed(precision) : parseFloat(value).toString();
    } else if (type === 'd') {
      value = parseInt(value).toString();
    } else {
      value = String(value);
    }
    
    if (width) {
      const pad = parseInt(width) - value.length;
      if (pad > 0) {
        const padding = ' '.repeat(pad);
        value = leftAlign ? value + padding : padding + value;
      }
    }
    
    return value;
  });
}

viewSeededData();

