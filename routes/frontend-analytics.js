const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Helper function for date range parsing
function getDateRange(req) {
  const { startDate, endDate } = req.query;
  // Default: last 6 months (not 30 days)
  const endDateParam = endDate || new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const startDateParam = startDate || sixMonthsAgo.toISOString().slice(0, 10);
  return { startDate: startDateParam, endDate: endDateParam };
}

// Time analytics endpoint
router.get('/time-analytics', async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    console.log('📊 Time Analytics Request:', { 
      startDate, 
      endDate, 
      user: req.user.email, 
      role: req.user.role,
      queryParams: req.query 
    });
    
    // Base WHERE and params
    const whereClauses = ['t.date BETWEEN ? AND ?'];
    const params = [startDate, endDate];

    // Role-based filtering
    if (req.user.role === 'SUPERVISOR') {
      whereClauses.push('u.department = ?');
      params.push(req.user.department);
    } else if (req.user.role === 'STAFF') {
      whereClauses.push('u.id = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'ADMIN' && req.query.department) {
      whereClauses.push('u.department = ?');
      params.push(req.query.department);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total hours and entries using the computed total_hours field
    const totalsSql = `
      SELECT 
        COUNT(*) AS totalEntries,
        ROUND(SUM(t.total_hours), 2) AS totalHours,
        COUNT(CASE WHEN t.billable = 1 THEN 1 END) AS billableEntries,
        COUNT(CASE WHEN t.billable = 0 THEN 1 END) AS nonBillableEntries,
        COUNT(DISTINCT t.user_id) AS uniqueUsers,
        COUNT(DISTINCT t.date) AS totalDays
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
    `;

    const [totalsRows] = await query(totalsSql, params);
    const totals = totalsRows && totalsRows[0] ? totalsRows[0] : { 
      totalEntries: 0, 
      totalHours: 0, 
      billableEntries: 0, 
      nonBillableEntries: 0,
      uniqueUsers: 0,
      totalDays: 0
    };

    // Calculate derived metrics
    const totalHours = totals.totalHours || 0;
    const totalEntries = totals.totalEntries || 0;
    const billableEntries = totals.billableEntries || 0;
    const nonBillableEntries = totals.nonBillableEntries || 0;
    const uniqueUsers = totals.uniqueUsers || 1;
    const totalDays = totals.totalDays || 1;
    
    // Calculate billable vs non-billable hours based on actual data
    const billableHours = totalEntries > 0 ? Math.round((billableEntries / totalEntries) * totalHours * 100) / 100 : 0;
    const nonBillableHours = totalEntries > 0 ? Math.round((nonBillableEntries / totalEntries) * totalHours * 100) / 100 : 0;
    
    // Calculate averages
    const averageHoursPerDay = totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0;
    const averageHoursPerWeek = totalDays > 0 ? Math.round((totalHours / (totalDays / 7)) * 100) / 100 : 0;
    const averageHoursPerUser = uniqueUsers > 0 ? Math.round((totalHours / uniqueUsers) * 100) / 100 : 0;
    const averageHoursPerUserPerDay = (uniqueUsers > 0 && totalDays > 0) 
      ? Math.round((totalHours / (uniqueUsers * totalDays)) * 100) / 100 
      : 0;
    
    // Calculate compliance rate based on 8-hour workday per user per day
    const expectedHoursPerDay = 8;
    const complianceRate = averageHoursPerUserPerDay > 0 
      ? Math.min(100, Math.round((averageHoursPerUserPerDay / expectedHoursPerDay) * 100)) 
      : 0;
    
    // Calculate overtime hours (hours over 8 per day per user)
    const expectedTotalHours = uniqueUsers * expectedHoursPerDay * totalDays;
    const overtimeHours = totalHours > expectedTotalHours ? Math.round((totalHours - expectedTotalHours) * 100) / 100 : 0;
    
    // Calculate utilization rate (actual vs expected)
    const utilizationRate = expectedTotalHours > 0 
      ? Math.min(100, Math.round((totalHours / expectedTotalHours) * 100)) 
      : 0;
    
    const response = {
      totalHours: totalHours,
      billableHours: billableHours,
      nonBillableHours: nonBillableHours,
      averageHoursPerDay: averageHoursPerDay,
      averageHoursPerWeek: averageHoursPerWeek,
      averageHoursPerUser: averageHoursPerUser,
      totalEntries: totalEntries,
      billableEntries: billableEntries,
      nonBillableEntries: nonBillableEntries,
      uniqueUsers: uniqueUsers,
      totalDays: totalDays,
      complianceRate: complianceRate,
      overtimeHours: overtimeHours,
      utilizationRate: utilizationRate
    };

    console.log('✅ Time Analytics Response:', response);
    res.json(response);
  } catch (error) {
    console.error('Frontend time analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Department analytics endpoint
router.get('/department-analytics', async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const whereClauses = ['t.date BETWEEN ? AND ?'];
    const params = [startDate, endDate];

    if (req.user.role === 'SUPERVISOR') {
      whereClauses.push('u.department = ?');
      params.push(req.user.department);
    } else if (req.user.role === 'STAFF') {
      whereClauses.push('u.id = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'ADMIN' && req.query.department) {
      whereClauses.push('u.department = ?');
      params.push(req.query.department);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get department breakdown using the computed total_hours field
    const deptSql = `
      SELECT 
        u.department,
        COUNT(DISTINCT u.id) AS userCount,
        COUNT(*) AS totalEntries,
        ROUND(SUM(t.total_hours), 2) AS totalHours,
        COUNT(CASE WHEN t.billable = 1 THEN 1 END) AS billableEntries,
        COUNT(CASE WHEN t.billable = 0 THEN 1 END) AS nonBillableEntries,
        COUNT(DISTINCT t.date) AS totalDays
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
      GROUP BY u.department
      ORDER BY totalHours DESC
    `;

    const [deptRows] = await query(deptSql, params);

    // Format for frontend
    const response = deptRows.map(dept => {
      // Compliance per user per day
      const expectedHoursPerDay = 8;
      const avgPerUserPerDay = (dept.userCount > 0 && dept.totalDays > 0)
        ? dept.totalHours / (dept.userCount * dept.totalDays)
        : 0;
      const complianceRate = avgPerUserPerDay > 0 
        ? Math.min(100, Math.round((avgPerUserPerDay / expectedHoursPerDay) * 100)) 
        : 0;
      
      // Utilization = actual vs expected (per user per day baseline)
      const expectedTotalHours = dept.userCount * expectedHoursPerDay * dept.totalDays;
      const utilizationRate = expectedTotalHours > 0 ? 
        Math.min(100, Math.round((dept.totalHours / expectedTotalHours) * 100)) : 0;
      
      // Calculate billable percentage
      const billablePercentage = dept.totalEntries > 0 ? 
        Math.round((dept.billableEntries / dept.totalEntries) * 100) : 0;
      
      return {
        department: dept.department,
        totalHours: dept.totalHours || 0,
        averageHoursPerUser: Math.round((dept.totalHours || 0) / (dept.userCount || 1) * 100) / 100,
        complianceRate: complianceRate,
        userCount: dept.userCount || 0,
        totalEntries: dept.totalEntries || 0,
        billableEntries: dept.billableEntries || 0,
        nonBillableEntries: dept.nonBillableEntries || 0,
        billablePercentage: billablePercentage,
        totalDays: dept.totalDays || 0,
        utilizationRate: utilizationRate
      };
    });

    res.json(response);
  } catch (error) {
    console.error('Frontend department analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User analytics endpoint
router.get('/user-analytics', async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const whereClauses = ['t.date BETWEEN ? AND ?'];
    const params = [startDate, endDate];

    if (req.user.role === 'SUPERVISOR') {
      whereClauses.push('u.department = ?');
      params.push(req.user.department);
    } else if (req.user.role === 'STAFF') {
      whereClauses.push('u.id = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'ADMIN' && req.query.department) {
      whereClauses.push('u.department = ?');
      params.push(req.query.department);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get user performance data using the computed total_hours field
    const userSql = `
      SELECT 
        u.id AS userId,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.department,
        COUNT(*) AS totalEntries,
        ROUND(SUM(t.total_hours), 2) AS totalHours,
        COUNT(CASE WHEN t.billable = 1 THEN 1 END) AS billableEntries,
        COUNT(CASE WHEN t.billable = 0 THEN 1 END) AS nonBillableEntries,
        COUNT(DISTINCT t.date) AS totalDays,
        MAX(t.date) AS lastEntryDate
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
      GROUP BY u.id
      ORDER BY totalHours DESC
    `;

    const [userRows] = await query(userSql, params);

    // Format for frontend
    const response = userRows.map(user => {
      // Compliance per user per day
      const expectedHoursPerDay = 8;
      const avgPerUserPerDay = user.totalDays > 0 ? user.totalHours / user.totalDays : 0;
      const complianceRate = avgPerUserPerDay > 0 ? 
        Math.min(100, Math.round((avgPerUserPerDay / expectedHoursPerDay) * 100)) : 0;
      
      // Utilization = actual vs expected hours per day
      const expectedTotalHours = expectedHoursPerDay * user.totalDays;
      const utilizationRate = expectedTotalHours > 0 ? 
        Math.min(100, Math.round((user.totalHours / expectedTotalHours) * 100)) : 0;
      
      // Calculate billable percentage
      const billablePercentage = user.totalEntries > 0 ? 
        Math.round((user.billableEntries / user.totalEntries) * 100) : 0;
      
      // Calculate average hours per day based on actual days worked
      const averageHoursPerDay = user.totalDays > 0 ? 
        Math.round((user.totalHours / user.totalDays) * 100) / 100 : 0;
      
      return {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        totalHours: user.totalHours || 0,
        averageHoursPerDay: averageHoursPerDay,
        complianceRate: complianceRate,
        lastEntryDate: user.lastEntryDate,
        totalEntries: user.totalEntries || 0,
        billableEntries: user.billableEntries || 0,
        nonBillableEntries: user.nonBillableEntries || 0,
        billablePercentage: billablePercentage,
        totalDays: user.totalDays || 0,
        utilizationRate: utilizationRate
      };
    });

    res.json(response);
  } catch (error) {
    console.error('Frontend user analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Time trends endpoint
router.get('/time-trends', async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    const granularity = req.query.granularity || 'daily';
    
    // Build WHERE clause for role-based filtering
    const whereClauses = ['t.date BETWEEN ? AND ?'];
    const params = [startDate, endDate];

    if (req.user.role === 'SUPERVISOR') {
      whereClauses.push('u.department = ?');
      params.push(req.user.department);
    } else if (req.user.role === 'STAFF') {
      whereClauses.push('u.id = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'ADMIN' && req.query.department) {
      whereClauses.push('u.department = ?');
      params.push(req.query.department);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Generate date series based on granularity
    let dateFormat, groupBy;
    if (granularity === 'daily') {
      dateFormat = 'DATE(t.date)';
      groupBy = 'DATE(t.date)';
    } else if (granularity === 'weekly') {
      dateFormat = 'YEARWEEK(t.date, 1)';
      groupBy = 'YEARWEEK(t.date, 1)';
    } else if (granularity === 'monthly') {
      dateFormat = 'DATE_FORMAT(t.date, "%Y-%m")';
      groupBy = 'DATE_FORMAT(t.date, "%Y-%m")';
    }

    // Get real time trends data using the computed total_hours field
    const trendsSql = `
      SELECT 
        ${dateFormat} AS date,
        COUNT(DISTINCT t.user_id) AS userCount,
        ROUND(SUM(t.total_hours), 2) AS totalHours,
        ROUND(AVG(t.total_hours), 2) AS averageHoursPerUser,
        COUNT(*) AS totalEntries,
        COUNT(CASE WHEN t.billable = 1 THEN 1 END) AS billableEntries
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
      GROUP BY ${groupBy}
      ORDER BY date ASC
    `;

    const [trendsRows] = await query(trendsSql, params);

    // Calculate compliance rate for each period
    const response = trendsRows.map(row => {
      // Calculate compliance rate based on business hours (8 hours per day)
      const expectedHoursPerDay = 8;
      const actualHoursPerDay = row.userCount > 0 ? row.totalHours / row.userCount : 0;
      const complianceRate = actualHoursPerDay > 0 ? 
        Math.min(100, Math.round((actualHoursPerDay / expectedHoursPerDay) * 100)) : 100;
      
      // Calculate billable percentage
      const billablePercentage = row.totalEntries > 0 ? 
        Math.round((row.billableEntries / row.totalEntries) * 100) : 0;
      
      return {
        date: row.date,
        totalHours: row.totalHours || 0,
        userCount: row.userCount || 0,
        complianceRate: complianceRate,
        averageHoursPerUser: row.averageHoursPerUser || 0,
        totalEntries: row.totalEntries || 0,
        billableEntries: row.billableEntries || 0,
        billablePercentage: billablePercentage
      };
    });

    res.json(response);
  } catch (error) {
    console.error('Frontend time trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Project analytics endpoint - REMOVED since we don't have projects table
// This endpoint has been removed as the database schema doesn't include projects
// If you need project analytics, first create the projects table and related schema

// Custom reports endpoints
router.get('/custom-reports', async (req, res) => {
  try {
    // Build WHERE clause for role-based filtering
    const whereClauses = [];
    const params = [];

    if (req.user.role === 'SUPERVISOR') {
      whereClauses.push('department = ?');
      params.push(req.user.department);
    } else if (req.user.role === 'STAFF') {
      whereClauses.push('user_id = ?');
      params.push(req.user.id);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get real custom reports from database
    const reportsSql = `
      SELECT 
        id,
        name,
        description,
        filters,
        columns,
        schedule,
        recipients,
        last_run AS lastRun,
        next_run AS nextRun,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM custom_reports
      ${whereSql}
      ORDER BY created_at DESC
    `;

    const [reportsRows] = await query(reportsSql, params);

    // Parse JSON fields
    const response = reportsRows.map(report => ({
      id: report.id,
      name: report.name,
      description: report.description,
      filters: JSON.parse(report.filters || '{}'),
      columns: JSON.parse(report.columns || '[]'),
      schedule: report.schedule,
      recipients: JSON.parse(report.recipients || '[]'),
      lastRun: report.lastRun,
      nextRun: report.nextRun,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    }));
    
    res.json(response);
  } catch (error) {
    console.error('Frontend custom reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/custom-reports', async (req, res) => {
  try {
    const reportData = req.body;
    
    // Validate required fields
    if (!reportData.name || !reportData.description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    // Insert new custom report
    const insertSql = `
      INSERT INTO custom_reports (
        name, description, filters, columns, schedule, recipients, 
        user_id, department, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      reportData.name,
      reportData.description,
      JSON.stringify(reportData.filters || {}),
      JSON.stringify(reportData.columns || []),
      reportData.schedule || 'manual',
      JSON.stringify(reportData.recipients || []),
      req.user.id,
      req.user.department
    ];

    const [result] = await query(insertSql, params);
    
    // Get the created report
    const getSql = 'SELECT * FROM custom_reports WHERE id = ?';
    const [reportRows] = await query(getSql, [result.insertId]);
    
    if (reportRows && reportRows[0]) {
      const report = reportRows[0];
      const response = {
        id: report.id,
        name: report.name,
        description: report.description,
        filters: JSON.parse(report.filters || '{}'),
        columns: JSON.parse(report.columns || '[]'),
        schedule: report.schedule,
        recipients: JSON.parse(report.recipients || '[]'),
        createdAt: report.created_at,
        updatedAt: report.updated_at
      };
      
      res.status(201).json(response);
    } else {
      res.status(500).json({ error: 'Failed to retrieve created report' });
    }
  } catch (error) {
    console.error('Frontend save custom report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/custom-reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reportData = req.body;
    
    // Validate required fields
    if (!reportData.name || !reportData.description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    // Check if report exists and user has permission
    const checkSql = 'SELECT * FROM custom_reports WHERE id = ?';
    const [checkRows] = await query(checkSql, [id]);
    
    if (!checkRows || checkRows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = checkRows[0];
    
    // Check permissions (user can only update their own reports or admin can update any)
    if (req.user.role !== 'ADMIN' && report.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update the report
    const updateSql = `
      UPDATE custom_reports SET 
        name = ?, description = ?, filters = ?, columns = ?, 
        schedule = ?, recipients = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      reportData.name,
      reportData.description,
      JSON.stringify(reportData.filters || {}),
      JSON.stringify(reportData.columns || []),
      reportData.schedule || 'manual',
      JSON.stringify(reportData.recipients || []),
      id
    ];

    await query(updateSql, params);
    
    // Get the updated report
    const [updatedRows] = await query(checkSql, [id]);
    const updatedReport = updatedRows[0];
    
    const response = {
      id: updatedReport.id,
      name: updatedReport.name,
      description: updatedReport.description,
      filters: JSON.parse(updatedReport.filters || '{}'),
      columns: JSON.parse(updatedReport.columns || '[]'),
      schedule: updatedReport.schedule,
      recipients: JSON.parse(updatedReport.recipients || '[]'),
      createdAt: updatedReport.created_at,
      updatedAt: updatedReport.updated_at
    };
    
    res.json(response);
  } catch (error) {
    console.error('Frontend update custom report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/custom-reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if report exists and user has permission
    const checkSql = 'SELECT * FROM custom_reports WHERE id = ?';
    const [checkRows] = await query(checkSql, [id]);
    
    if (!checkRows || checkRows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = checkRows[0];
    
    // Check permissions (user can only delete their own reports or admin can delete any)
    if (req.user.role !== 'ADMIN' && report.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the report
    const deleteSql = 'DELETE FROM custom_reports WHERE id = ?';
    await query(deleteSql, [id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Frontend delete custom report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export analytics endpoint
router.post('/export', async (req, res) => {
  try {
    const { type, format, filters } = req.body;
    const { startDate, endDate } = getDateRange(req);
    
    // Build WHERE clause for role-based filtering
    const whereClauses = ['t.date BETWEEN ? AND ?'];
    const params = [startDate, endDate];

    if (req.user.role === 'SUPERVISOR') {
      whereClauses.push('u.department = ?');
      params.push(req.user.department);
    } else if (req.user.role === 'STAFF') {
      whereClauses.push('u.id = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'ADMIN' && filters?.department) {
      whereClauses.push('u.department = ?');
      params.push(filters.department);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get export data based on type
    let exportData = [];
    let filename = '';

    if (type === 'time-analytics') {
      const sql = `
        SELECT 
          DATE(t.date) AS date,
          u.first_name,
          u.last_name,
          u.department,
          t.start_time,
          t.end_time,
          t.total_hours AS hours,
          t.task,
          t.activity,
          t.priority,
          t.status,
          t.billable
        FROM timesheet_entries t
        JOIN users u ON u.id = t.user_id
        ${whereSql}
        ORDER BY t.date DESC, u.last_name, u.first_name
      `;
      
      const [rows] = await query(sql, params);
      exportData = rows;
      filename = `time_analytics_${startDate}_to_${endDate}.${format}`;
    } else if (type === 'department-analytics') {
      const sql = `
        SELECT 
          u.department,
          COUNT(DISTINCT u.id) AS userCount,
          COUNT(*) AS totalEntries,
          ROUND(SUM(t.total_hours), 2) AS totalHours,
          ROUND(AVG(t.total_hours), 2) AS averageHoursPerEntry,
          COUNT(CASE WHEN t.billable = 1 THEN 1 END) AS billableEntries,
          COUNT(CASE WHEN t.billable = 0 THEN 1 END) AS nonBillableEntries
        FROM timesheet_entries t
        JOIN users u ON u.id = t.user_id
        ${whereSql}
        GROUP BY u.department
        ORDER BY totalHours DESC
      `;
      
      const [rows] = await query(sql, params);
      exportData = rows;
      filename = `department_analytics_${startDate}_to_${endDate}.${format}`;
    } else if (type === 'user-analytics') {
      const sql = `
        SELECT 
          u.first_name,
          u.last_name,
          u.department,
          COUNT(*) AS totalEntries,
          ROUND(SUM(t.total_hours), 2) AS totalHours,
          COUNT(CASE WHEN t.billable = 1 THEN 1 END) AS billableEntries,
          COUNT(CASE WHEN t.billable = 0 THEN 1 END) AS nonBillableEntries,
          MAX(t.date) AS lastEntryDate
        FROM timesheet_entries t
        JOIN users u ON u.id = t.user_id
        ${whereSql}
        GROUP BY u.id
        ORDER BY totalHours DESC
      `;
      
      const [rows] = await query(sql, params);
      exportData = rows;
      filename = `user_analytics_${startDate}_to_${endDate}.${format}`;
    }

    // For now, return the data structure (in production, you'd generate actual files)
    const response = {
      data: exportData,
      filename: filename,
      recordCount: exportData.length,
      status: 'completed',
      generatedAt: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Frontend export analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate custom report endpoint
router.post('/generate-report', async (req, res) => {
  try {
    const { reportId, filters } = req.body;
    
    // Get the custom report configuration
    const reportSql = 'SELECT * FROM custom_reports WHERE id = ?';
    const [reportRows] = await query(reportSql, [reportId]);
    
    if (!reportRows || reportRows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportRows[0];
    
    // Check permissions
    if (req.user.role !== 'ADMIN' && report.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Parse report configuration
    const reportFilters = JSON.parse(report.filters || '{}');
    const reportColumns = JSON.parse(report.columns || '[]');
    
    // Merge with request filters
    const finalFilters = { ...reportFilters, ...filters };
    
    // Build WHERE clause
    const whereClauses = [];
    const params = [];
    
    if (finalFilters.startDate && finalFilters.endDate) {
      whereClauses.push('t.date BETWEEN ? AND ?');
      params.push(finalFilters.startDate, finalFilters.endDate);
    }
    
    if (finalFilters.department) {
      whereClauses.push('u.department = ?');
      params.push(finalFilters.department);
    }
    
    if (finalFilters.userId) {
      whereClauses.push('t.user_id = ?');
      params.push(finalFilters.userId);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Generate the report based on columns
    let reportData = [];
    let columns = reportColumns;

    if (columns.includes('department') || columns.includes('user')) {
      const sql = `
        SELECT 
          ${columns.includes('department') ? 'u.department,' : ''}
          ${columns.includes('user') ? 'CONCAT(u.first_name, " ", u.last_name) AS userName,' : ''}
          ${columns.includes('totalHours') ? 'ROUND(SUM(t.total_hours), 2) AS totalHours,' : ''}
          ${columns.includes('totalEntries') ? 'COUNT(*) AS totalEntries,' : ''}
          ${columns.includes('complianceRate') ? 'ROUND(AVG(t.total_hours) * 100 / 8, 2) AS complianceRate' : ''}
        FROM timesheet_entries t
        JOIN users u ON u.id = t.user_id
        ${whereSql}
        GROUP BY ${columns.includes('department') ? 'u.department' : 'u.id'}
        ORDER BY totalHours DESC
      `;
      
      const [rows] = await query(sql, params);
      reportData = rows;
    }

    // Update last run time
    await query('UPDATE custom_reports SET last_run = NOW() WHERE id = ?', [reportId]);

    const response = {
      reportId: reportId,
      reportName: report.name,
      status: 'completed',
      data: reportData,
      columns: columns,
      filters: finalFilters,
      recordCount: reportData.length,
      generatedAt: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Frontend generate report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Schedule report endpoint
router.post('/schedule-report', async (req, res) => {
  try {
    const { reportId, schedule } = req.body;
    
    // Validate schedule
    const validSchedules = ['daily', 'weekly', 'monthly', 'quarterly'];
    if (!validSchedules.includes(schedule)) {
      return res.status(400).json({ error: 'Invalid schedule. Must be one of: daily, weekly, monthly, quarterly' });
    }

    // Get the report
    const reportSql = 'SELECT * FROM custom_reports WHERE id = ?';
    const [reportRows] = await query(reportSql, [reportId]);
    
    if (!reportRows || reportRows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportRows[0];
    
    // Check permissions
    if (req.user.role !== 'ADMIN' && report.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate next run time based on schedule
    let nextRun = new Date();
    switch (schedule) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      case 'quarterly':
        nextRun.setMonth(nextRun.getMonth() + 3);
        break;
    }

    // Update the report schedule
    const updateSql = `
      UPDATE custom_reports SET 
        schedule = ?, next_run = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await query(updateSql, [schedule, nextRun, reportId]);

    const response = {
      reportId: reportId,
      reportName: report.name,
      schedule: schedule,
      status: 'scheduled',
      nextRun: nextRun.toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Frontend schedule report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Real-time dashboard endpoint
router.get('/real-time-dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const currentHour = new Date().getHours();
    
    // Build WHERE clause for role-based filtering
    const whereClauses = ['t.date = ?'];
    const params = [today];

    if (req.user.role === 'SUPERVISOR') {
      whereClauses.push('u.department = ?');
      params.push(req.user.department);
    } else if (req.user.role === 'STAFF') {
      whereClauses.push('u.id = ?');
      params.push(req.user.id);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get active users today
    const activeUsersSql = `
      SELECT COUNT(DISTINCT t.user_id) AS activeUsers
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
    `;

    const [activeUsersResult] = await query(activeUsersSql, params);
    const activeUsers = activeUsersResult[0]?.activeUsers || 0;

    // Get current hour total
    const currentHourSql = `
      SELECT ROUND(SUM(t.total_hours), 2) AS currentHour
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql} AND HOUR(t.start_time) = ?
    `;

    const [currentHourResult] = await query(currentHourSql, [...params, currentHour]);
    const currentHourTotal = currentHourResult[0]?.currentHour || 0;

    // Get today total
    const todayTotalSql = `
      SELECT ROUND(SUM(t.total_hours), 2) AS todayTotal
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
    `;

    const [todayTotalResult] = await query(todayTotalSql, params);
    const todayTotal = todayTotalResult[0]?.todayTotal || 0;

    // Get alerts (users approaching overtime, low compliance, etc.)
    const alertsSql = `
      SELECT 
        u.first_name,
        u.last_name,
        ROUND(SUM(t.total_hours), 2) AS hoursToday
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
      GROUP BY u.id
      HAVING hoursToday > 7.5
      ORDER BY hoursToday DESC
      LIMIT 5
    `;

    const [alertsResult] = await query(alertsSql, params);
    
    const alerts = alertsResult.map(user => ({
      type: 'warning',
      message: `${user.first_name} ${user.last_name} has logged ${user.hoursToday} hours today`
    }));

    // Add info alerts for high performers
    if (activeUsers > 0) {
      alerts.push({
        type: 'info',
        message: `${activeUsers} active users today with ${todayTotal.toFixed(1)} total hours`
      });
    }

    const response = {
      activeUsers: activeUsers,
      currentHour: currentHourTotal,
      todayTotal: todayTotal,
      alerts: alerts,
      lastUpdated: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Frontend real-time dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// KPI metrics endpoint
router.get('/kpi-metrics', async (req, res) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    // Build WHERE clause for role-based filtering
    const whereClauses = ['t.date BETWEEN ? AND ?'];
    const params = [startDate, endDate];

    if (req.user.role === 'SUPERVISOR') {
      whereClauses.push('u.department = ?');
      params.push(req.user.department);
    } else if (req.user.role === 'STAFF') {
      whereClauses.push('u.id = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'ADMIN' && req.query.department) {
      whereClauses.push('u.department = ?');
      params.push(req.query.department);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total hours and entries
    const totalsSql = `
      SELECT 
        COUNT(*) AS totalEntries,
        ROUND(SUM(t.total_hours), 2) AS totalHours,
        COUNT(DISTINCT t.user_id) AS uniqueUsers,
        COUNT(DISTINCT DATE(t.date)) AS totalDays
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
    `;

    const [totalsResult] = await query(totalsSql, params);
    const totals = totalsResult[0];

    // Calculate derived metrics
    const totalHours = totals.totalHours || 0;
    const totalDays = totals.totalDays || 1;
    const uniqueUsers = totals.uniqueUsers || 1;
    const totalEntries = totals.totalEntries || 0;

    // Calculate average hours per day
    const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;

    // Calculate compliance rate (based on 8-hour workday expectation)
    const expectedHours = uniqueUsers * 8 * totalDays;
    const complianceRate = expectedHours > 0 ? Math.min(100, (totalHours / expectedHours) * 100) : 100;

    // Calculate utilization rate (actual hours vs available hours)
    const availableHours = uniqueUsers * 8 * totalDays;
    const utilizationRate = availableHours > 0 ? Math.min(100, (totalHours / availableHours) * 100) : 100;

    // Calculate overtime hours (hours over 8 per day per user)
    const overtimeSql = `
      SELECT 
        ROUND(SUM(
          CASE 
            WHEN t.total_hours > 8 
            THEN t.total_hours - 8 
            ELSE 0 
          END
        ), 2) AS overtimeHours
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
    `;

    const [overtimeResult] = await query(overtimeSql, params);
    const overtimeHours = overtimeResult[0]?.overtimeHours || 0;

    // Calculate task completion rate instead of project completion rate
    const taskSql = `
      SELECT 
        COUNT(*) AS totalTasks,
        COUNT(CASE WHEN t.status IN ('Completed', 'CarriedOut') THEN 1 END) AS completedTasks
      FROM timesheet_entries t
      JOIN users u ON u.id = t.user_id
      ${whereSql}
    `;

    const [taskResult] = await query(taskSql, params);
    const totalTasks = taskResult[0]?.totalTasks || 0;
    const completedTasks = taskResult[0]?.completedTasks || 0;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const response = {
      totalHours: Math.round(totalHours * 100) / 100,
      averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
      complianceRate: Math.round(complianceRate * 100) / 100,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      totalEntries: totalEntries,
      uniqueUsers: uniqueUsers,
      totalDays: totalDays
    };
    
    res.json(response);
  } catch (error) {
    console.error('Frontend KPI metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
