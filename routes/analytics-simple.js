const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Simple test endpoint
router.get('/test', authenticateToken, (req, res) => {
  res.json({ message: 'Analytics route is working!', user: req.user.email });
});

// Simple dashboard metrics
router.get('/dashboard-metrics', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Dashboard metrics request from:', req.user.email);
    
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
    
    const [metricsResult] = await query(metricsQuery, []);
    const metrics = metricsResult[0];
    
    console.log('✅ Metrics calculated:', metrics);
    
    res.json({
      metrics: {
        totalEntries: parseInt(metrics.totalEntries) || 0,
        totalHours: parseFloat(metrics.totalHours) || 0,
        billableHours: parseFloat(metrics.billableHours) || 0,
        activeUsers: parseInt(metrics.activeUsers) || 0,
        departments: parseInt(metrics.departments) || 0,
        averageHoursPerEntry: parseFloat(metrics.averageHoursPerEntry) || 0,
        notStartedTasks: parseInt(metrics.notStartedTasks) || 0,
        carriedOutTasks: parseInt(metrics.carriedOutTasks) || 0,
        completedTasks: parseInt(metrics.completedTasks) || 0
      },
      departmentStats: [],
      userStats: []
    });
    
  } catch (error) {
    console.error('❌ Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

module.exports = router;
