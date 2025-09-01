const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// All analytics routes are protected by authenticateToken at server level
// Scoping rules:
// - ADMIN: all data (optionally filter by department via ?department=)
// - SUPERVISOR: only users within their own department
// - STAFF: only own data

function getDateRange(req) {
  const { start, end } = req.query;
  // Default: last 30 days
  const endDate = end || new Date().toISOString().slice(0, 10);
  const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { startDate, endDate };
}

router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);

    // Base WHERE and params
    const whereClauses = ['t.date BETWEEN ? AND ?'];
    const params = [startDate, endDate];

    // Join with users to allow department/user scoping
    let scopeDescription = 'all';

    if (req.user.role === 'SUPERVISOR') {
      whereClauses.push('u.department = ?');
      params.push(req.user.department);
      scopeDescription = `department:${req.user.department}`;
    } else if (req.user.role === 'STAFF') {
      whereClauses.push('u.id = ?');
      params.push(req.user.id);
      scopeDescription = `user:${req.user.email}`;
    } else if (req.user.role === 'ADMIN' && req.query.department) {
      whereClauses.push('u.department = ?');
      params.push(req.query.department);
      scopeDescription = `department:${req.query.department}`;
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Per-user breakdown within scope
    const perUserSql = `
      SELECT 
        u.id AS user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.department,
        COUNT(*) AS entry_count,
        ROUND(SUM(TIME_TO_SEC(TIMEDIFF(t.end_time, t.start_time))) / 3600, 2) AS total_hours
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
      GROUP BY u.id
      ORDER BY total_hours DESC
    `;

    const [perUserRows] = await query(perUserSql, params);

    // Aggregate totals within scope
    const totalsSql = `
      SELECT 
        COUNT(*) AS entries,
        ROUND(SUM(TIME_TO_SEC(TIMEDIFF(t.end_time, t.start_time))) / 3600, 2) AS hours
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
    `;

    const [totalsRows] = await query(totalsSql, params);
    const totals = totalsRows && totalsRows[0] ? totalsRows[0] : { entries: 0, hours: 0 };

    // Simple status distribution (Completed/CarriedOut/NotStarted)
    const statusSql = `
      SELECT t.status, COUNT(*) AS count
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
      GROUP BY t.status
    `;
    const [statusRows] = await query(statusSql, params);

    res.json({
      scope: scopeDescription,
      range: { start: startDate, end: endDate },
      totals,
      byUser: perUserRows,
      byStatus: statusRows
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Department-specific analytics for supervisors (simplified version)
router.get('/department-summary', async (req, res) => {
  try {
    // Only supervisors and admins can access this endpoint
    if (!['ADMIN', 'SUPERVISOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { startDate, endDate } = getDateRange(req);
    console.log('📊 Department analytics request:', { user: req.user.email, role: req.user.role, department: req.user.department });

    // Determine department scope
    let department = req.user.department;
    if (req.user.role === 'ADMIN' && req.query.department) {
      department = req.query.department;
    }

    if (!department) {
      return res.status(400).json({ error: 'Department not specified' });
    }

    const params = [startDate, endDate, department];

    // Simple overview metrics
    const overviewSql = `
      SELECT 
        COUNT(*) as totalEntries,
        ROUND(SUM(te.total_hours), 2) as totalHours,
        ROUND(SUM(CASE WHEN te.billable = 1 THEN te.total_hours ELSE 0 END), 2) as billableHours,
        ROUND(SUM(CASE WHEN te.billable = 0 THEN te.total_hours ELSE 0 END), 2) as nonBillableHours,
        COUNT(CASE WHEN te.status = 'Completed' THEN 1 END) as completedTasks,
        COUNT(CASE WHEN te.status != 'Completed' THEN 1 END) as pendingTasks,
        ROUND(AVG(te.total_hours), 2) as averageHoursPerEntry,
        ROUND((COUNT(CASE WHEN te.status = 'Completed' THEN 1 END) * 100.0 / COUNT(*)), 2) as completionRate,
        ROUND((SUM(CASE WHEN te.billable = 1 THEN te.total_hours ELSE 0 END) * 100.0 / SUM(te.total_hours)), 2) as billableRate
      FROM timesheet_entries te
      WHERE te.date BETWEEN ? AND ? AND te.department = ?
    `;

    const [overviewResult] = await query(overviewSql, params);
    const overview = overviewResult[0] || {};

    // Simple user performance
    const userPerformanceSql = `
      SELECT 
        u.id as userId,
        CONCAT(u.first_name, ' ', u.last_name) as userName,
        u.email as userEmail,
        COUNT(te.id) as totalEntries,
        ROUND(SUM(te.total_hours), 2) as totalHours,
        ROUND(SUM(CASE WHEN te.billable = 1 THEN te.total_hours ELSE 0 END), 2) as billableHours,
        ROUND((COUNT(CASE WHEN te.status = 'Completed' THEN 1 END) * 100.0 / COUNT(*)), 2) as completionRate
      FROM users u
      JOIN timesheet_entries te ON u.id = te.user_id
      WHERE te.date BETWEEN ? AND ? AND te.department = ?
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY totalHours DESC
    `;

    const [userPerformance] = await query(userPerformanceSql, params);

    // Simple status distribution
    const statusSql = `
      SELECT 
        te.status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / COUNT(*)), 2) as percentage,
        ROUND(SUM(te.total_hours), 2) as totalHours
      FROM timesheet_entries te
      WHERE te.date BETWEEN ? AND ? AND te.department = ?
      GROUP BY te.status
    `;

    const [statusDistribution] = await query(statusSql, params);

    res.json({
      departmentName: department,
      period: { startDate, endDate },
      overview: {
        totalEntries: overview.totalEntries || 0,
        totalHours: overview.totalHours || 0,
        billableHours: overview.billableHours || 0,
        nonBillableHours: overview.nonBillableHours || 0,
        completedTasks: overview.completedTasks || 0,
        pendingTasks: overview.pendingTasks || 0,
        averageHoursPerEntry: overview.averageHoursPerEntry || 0,
        completionRate: overview.completionRate || 0,
        billableRate: overview.billableRate || 0
      },
      userPerformance,
      statusDistribution,
      projectBreakdown: [],
      priorityAnalysis: [],
      timeDistribution: [],
      productivityTrends: []
    });

  } catch (error) {
    console.error('Department analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User performance comparison
router.get('/user-performance', async (req, res) => {
  try {
    if (!['ADMIN', 'SUPERVISOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { startDate, endDate } = getDateRange(req);
    let department = req.user.department;
    if (req.user.role === 'ADMIN' && req.query.department) {
      department = req.query.department;
    }

    const sql = `
      SELECT 
        u.id as userId,
        CONCAT(u.first_name, ' ', u.last_name) as userName,
        u.email as userEmail,
        COUNT(te.id) as totalEntries,
        ROUND(SUM(te.total_hours), 2) as totalHours,
        ROUND(SUM(CASE WHEN te.billable = 1 THEN te.total_hours ELSE 0 END), 2) as billableHours,
        ROUND(SUM(te.total_hours) / NULLIF(DATEDIFF(?, ?), 0), 2) as averageHoursPerDay,
        ROUND((COUNT(CASE WHEN te.status = 'Completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2) as completionRate,
        ROUND(AVG(TIME_TO_SEC(TIMEDIFF(te.end_time, te.start_time)) / 3600), 2) as averageTaskDuration,
        MAX(te.created_at) as lastActivity,
        CASE 
          WHEN MAX(te.created_at) >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'active'
          ELSE 'inactive'
        END as status,
        ROUND(
          (COUNT(CASE WHEN te.status = 'Completed' THEN 1 END) * 0.4 + 
           (SUM(CASE WHEN te.billable = 1 THEN te.total_hours ELSE 0 END) / NULLIF(SUM(te.total_hours), 0)) * 0.3 + 
           (SUM(te.total_hours) / NULLIF(COUNT(*), 0)) * 0.3) * 100, 2
        ) as performanceScore
      FROM users u
      LEFT JOIN timesheet_entries te ON u.id = te.user_id 
        AND te.date BETWEEN ? AND ? 
        AND te.department = ?
      WHERE u.department = ? AND u.is_active = 1
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY performanceScore DESC
    `;

    const [results] = await query(sql, [endDate, startDate, startDate, endDate, department, department]);
    res.json(results);

  } catch (error) {
    console.error('User performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Productivity trends
router.get('/productivity-trends', async (req, res) => {
  try {
    if (!['ADMIN', 'SUPERVISOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { startDate, endDate } = getDateRange(req);
    const period = req.query.period || 'weekly';
    let department = req.user.department;
    if (req.user.role === 'ADMIN' && req.query.department) {
      department = req.query.department;
    }

    let dateFormat, dateGroup;
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        dateGroup = 'DATE(te.date)';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        dateGroup = 'DATE_FORMAT(te.date, "%Y-%m")';
        break;
      default: // weekly
        dateFormat = '%Y-%u';
        dateGroup = 'YEARWEEK(te.date)';
    }

    const sql = `
      SELECT 
        DATE_FORMAT(te.date, '${dateFormat}') as period,
        DATE(te.date) as date,
        ROUND(AVG(te.total_hours), 2) as hoursPerEntry,
        ROUND((COUNT(CASE WHEN te.status = 'Completed' THEN 1 END) * 100.0 / COUNT(*)), 2) as completionRate,
        ROUND((SUM(CASE WHEN te.billable = 1 THEN te.total_hours ELSE 0 END) * 100.0 / SUM(te.total_hours)), 2) as billableRate
      FROM timesheet_entries te
      WHERE te.date BETWEEN ? AND ? 
        AND te.department = ?
      GROUP BY ${dateGroup}
      ORDER BY te.date
    `;

    const [results] = await query(sql, [startDate, endDate, department]);

    // Calculate trends
    const trendsWithDirection = results.map((item, index) => {
      let trend = 'stable';
      if (index > 0) {
        const prev = results[index - 1];
        const currentScore = (item.hoursPerEntry * 0.4) + (item.completionRate * 0.4) + (item.billableRate * 0.2);
        const prevScore = (prev.hoursPerEntry * 0.4) + (prev.completionRate * 0.4) + (prev.billableRate * 0.2);
        
        if (currentScore > prevScore * 1.05) trend = 'up';
        else if (currentScore < prevScore * 0.95) trend = 'down';
      }
      
      return { ...item, trend };
    });

    res.json(trendsWithDirection);

  } catch (error) {
    console.error('Productivity trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export department report
router.get('/export-department-report', async (req, res) => {
  try {
    if (!['ADMIN', 'SUPERVISOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const format = req.query.format || 'csv';
    const { startDate, endDate } = getDateRange(req);
    let department = req.user.department;
    if (req.user.role === 'ADMIN' && req.query.department) {
      department = req.query.department;
    }

    // Get comprehensive data for export
    const sql = `
      SELECT 
        te.date,
        te.client_file_number,
        te.task,
        te.activity,
        te.priority,
        te.start_time,
        te.end_time,
        te.total_hours,
        te.status,
        CASE WHEN te.billable = 1 THEN 'Yes' ELSE 'No' END as billable,
        te.comments,
        CONCAT(u.first_name, ' ', u.last_name) as employee_name,
        u.email as employee_email,
        te.department
      FROM timesheet_entries te
      JOIN users u ON te.user_id = u.id
      WHERE te.date BETWEEN ? AND ? 
        AND te.department = ?
      ORDER BY te.date DESC, u.last_name, u.first_name
    `;

    const [data] = await query(sql, [startDate, endDate, department]);

    if (format === 'csv') {
      // Generate CSV
      const csv = [
        'Date,Client File Number,Task,Activity,Priority,Start Time,End Time,Total Hours,Status,Billable,Employee Name,Employee Email,Department,Comments',
        ...data.map(row => 
          `"${row.date}","${row.client_file_number}","${row.task}","${row.activity}","${row.priority}","${row.start_time}","${row.end_time}","${row.total_hours}","${row.status}","${row.billable}","${row.employee_name}","${row.employee_email}","${row.department}","${row.comments || ''}"`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${department}_Report_${startDate}_to_${endDate}.csv"`);
      res.send(csv);
    } else {
      // For now, return JSON (PDF generation would require additional libraries)
      res.json({
        metadata: {
          department,
          period: { startDate, endDate },
          generatedAt: new Date().toISOString(),
          totalRecords: data.length
        },
        data
      });
    }

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get department users for filtering
router.get('/department-users', async (req, res) => {
  try {
    if (!['ADMIN', 'SUPERVISOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let department = req.user.department;
    if (req.user.role === 'ADMIN' && req.query.department) {
      department = req.query.department;
    }

    const sql = `
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.is_active as active
      FROM users u
      WHERE u.department = ?
      ORDER BY u.last_name, u.first_name
    `;

    const [users] = await query(sql, [department]);
    res.json(users);

  } catch (error) {
    console.error('Department users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get department projects for filtering
router.get('/department-projects', async (req, res) => {
  try {
    if (!['ADMIN', 'SUPERVISOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let department = req.user.department;
    if (req.user.role === 'ADMIN' && req.query.department) {
      department = req.query.department;
    }

    const sql = `
      SELECT DISTINCT
        te.client_file_number as clientFileNumber,
        CONCAT(te.client_file_number, ' - ', te.task) as description,
        CASE WHEN MAX(te.date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END as active
      FROM timesheet_entries te
      WHERE te.department = ?
      GROUP BY te.client_file_number, te.task
      ORDER BY active DESC, te.client_file_number
    `;

    const [projects] = await query(sql, [department]);
    res.json(projects);

  } catch (error) {
    console.error('Department projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available date ranges
router.get('/date-ranges', async (req, res) => {
  try {
    if (!['ADMIN', 'SUPERVISOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let department = req.user.department;
    if (req.user.role === 'ADMIN' && req.query.department) {
      department = req.query.department;
    }

    const sql = `
      SELECT 
        MIN(date) as earliest,
        MAX(date) as latest
      FROM timesheet_entries
      WHERE department = ?
    `;

    const [result] = await query(sql, [department]);
    res.json(result[0] || { earliest: null, latest: null });

  } catch (error) {
    console.error('Date ranges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;