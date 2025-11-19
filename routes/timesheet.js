const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get tasks by department (public for staff use)
router.get('/tasks/:department', async (req, res) => {
  try {
    const { department } = req.params;
    
    console.log('🔍 Fetching tasks for department:', department);
    
    const sqlQuery = `
      SELECT t.id, t.name, t.description, t.is_active, d.name AS department
      FROM tasks t
      JOIN departments d ON t.department_id = d.id
      WHERE d.name = ? AND t.is_active = true
      ORDER BY t.name ASC
    `;
    
    const result = await query(sqlQuery, [department]);
    
    console.log('📋 Tasks found:', result[0].length);
    
    res.json({
      success: true,
      department: department,
      tasks: result[0]
    });
    
  } catch (error) {
    console.error('❌ Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
});

// Admin/Supervisor: list tasks (optionally filter by department)
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { department } = req.query;
    let sqlQuery = `
      SELECT t.id, t.name, t.description, t.is_active, d.name AS department
      FROM tasks t
      JOIN departments d ON t.department_id = d.id
    `;
    const params = [];
    
    // Supervisors can only see tasks for their own department
    if (req.user.role === 'SUPERVISOR') {
      sqlQuery += ' WHERE d.name = ?';
      params.push(req.user.department);
    } else if (department) {
      // Admins can filter by department if specified
      sqlQuery += ' WHERE d.name = ?';
      params.push(department);
    }
    
    sqlQuery += ' ORDER BY d.name ASC, t.name ASC';

    const result = await query(sqlQuery, params);
    res.json({ success: true, tasks: result[0] });
  } catch (error) {
    console.error('❌ Error listing tasks:', error);
    res.status(500).json({ success: false, message: 'Failed to list tasks', error: error.message });
  }
});

// Admin/Supervisor: create task
router.post('/tasks', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { department, name, description } = req.body;
    if (!department || !name) return res.status(400).json({ success: false, message: 'department and name are required' });

    // Supervisors can only create tasks for their own department
    if (req.user.role === 'SUPERVISOR' && req.user.department !== department) {
      return res.status(403).json({ success: false, message: 'You can only create tasks for your own department' });
    }

    const [deptRows] = await query('SELECT id FROM departments WHERE name = ?', [department]);
    if (deptRows.length === 0) return res.status(400).json({ success: false, message: 'Invalid department' });
    const departmentId = deptRows[0].id;

    const insertSql = 'INSERT INTO tasks (department_id, name, description, is_active) VALUES (?,?,?, true)';
    const insertRes = await query(insertSql, [departmentId, name, description || '']);
    const id = insertRes[0].insertId;

    res.status(201).json({ success: true, task: { id, department, name, description: description || '', is_active: true } });
  } catch (error) {
    console.error('❌ Error creating task:', error);
    res.status(500).json({ success: false, message: 'Failed to create task', error: error.message });
  }
});

// Admin/Supervisor: update task
router.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { id } = req.params;
    const { department, name, description, is_active } = req.body;

    // For supervisors, check if they can modify this task
    if (req.user.role === 'SUPERVISOR') {
      const [taskRows] = await query(`
        SELECT d.name as department_name 
        FROM tasks t 
        JOIN departments d ON t.department_id = d.id 
        WHERE t.id = ?
      `, [id]);
      
      if (taskRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      
      if (taskRows[0].department_name !== req.user.department) {
        return res.status(403).json({ success: false, message: 'You can only modify tasks in your own department' });
      }
      
      // Supervisors cannot change the department of a task
      if (department && department !== req.user.department) {
        return res.status(403).json({ success: false, message: 'You cannot change the department of a task' });
      }
    }

    let departmentId = null;
    if (department) {
      const [deptRows] = await query('SELECT id FROM departments WHERE name = ?', [department]);
      if (deptRows.length === 0) return res.status(400).json({ success: false, message: 'Invalid department' });
      departmentId = deptRows[0].id;
    }

    const fields = [];
    const params = [];
    if (departmentId !== null) { fields.push('department_id = ?'); params.push(departmentId); }
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (is_active !== undefined) { fields.push('is_active = ?'); params.push(!!is_active); }
    if (fields.length === 0) return res.json({ success: true });
    const sql = `UPDATE tasks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    params.push(id);
    await query(sql, params);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating task:', error);
    res.status(500).json({ success: false, message: 'Failed to update task', error: error.message });
  }
});

// Admin/Supervisor: delete task (soft delete)
router.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { id } = req.params;
    
    // For supervisors, check if they can delete this task
    if (req.user.role === 'SUPERVISOR') {
      const [taskRows] = await query(`
        SELECT d.name as department_name 
        FROM tasks t 
        JOIN departments d ON t.department_id = d.id 
        WHERE t.id = ?
      `, [id]);
      
      if (taskRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      
      if (taskRows[0].department_name !== req.user.department) {
        return res.status(403).json({ success: false, message: 'You can only delete tasks in your own department' });
      }
    }
    
    await query('UPDATE tasks SET is_active = false, updated_at = NOW() WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task', error: error.message });
  }
});

// Helper function to validate 15-minute intervals
function isValidTimeInterval(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return minutes % 15 === 0;
}

// Helper function to get 15-minute intervals
function getTimeIntervals() {
  const intervals = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      intervals.push(time);
    }
  }
  return intervals;
}

// Get timesheet entries for current user
router.get('/entries', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 /entries request received with query params:', req.query);
    console.log('👤 User ID:', req.user.id);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'date';
    const sortOrder = req.query.sortOrder || 'desc';
    
    console.log('📊 Pagination params:', { page, limit, offset, sortBy, sortOrder });
    
    // Build WHERE clause for filters
    let whereClause = 'WHERE user_id = ?';
    let queryParams = [req.user.id];
    
    console.log('🔍 User ID from token:', req.user.id);
    console.log('🔍 User object:', req.user);
    
    // Add search filter
    if (req.query.search) {
      console.log('🔍 Adding search filter:', req.query.search);
      whereClause += ` AND (client_file_number LIKE ? OR department LIKE ? OR task LIKE ? OR activity LIKE ?)`;
      const searchTerm = `%${req.query.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Add date range filter
    if (req.query.dateFrom) {
      whereClause += ` AND date >= ?`;
      queryParams.push(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      whereClause += ` AND date <= ?`;
      queryParams.push(req.query.dateTo);
    }
    
    // Add status filter
    if (req.query.status) {
      console.log('📋 Adding status filter:', req.query.status);
      whereClause += ` AND status = ?`;
      queryParams.push(req.query.status);
    }
    
    // Add priority filter
    if (req.query.priority) {
      console.log('⚡ Adding priority filter:', req.query.priority);
      whereClause += ` AND priority = ?`;
      queryParams.push(req.query.priority);
    }
    
    // Add billable filter
    if (req.query.billable !== undefined && req.query.billable !== null && req.query.billable !== '') {
      console.log('💰 Adding billable filter:', req.query.billable);
      whereClause += ` AND billable = ?`;
      queryParams.push(req.query.billable === 'true' ? 1 : 0);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM timesheet_entries ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0][0].total;
    
    // Debug: Check total entries without user filter
    const totalAllQuery = `SELECT COUNT(*) as total FROM timesheet_entries`;
    const totalAllResult = await query(totalAllQuery);
    console.log('🔍 Total entries (all users):', totalAllResult[0][0].total);
    console.log('🔍 Total entries (current user):', total);
    
    // Get paginated data
    const dataQuery = `
      SELECT id, date, client_file_number, department, task, activity, priority, 
       start_time, end_time, total_hours, status, billable, comments, created_at 
       FROM timesheet_entries 
       ${whereClause}
       ORDER BY ${sortBy} ${sortOrder.toUpperCase()}, created_at DESC
       LIMIT ? OFFSET ?
    `;
    queryParams.push(limit, offset);
    
    const result = await query(dataQuery, queryParams);
    const totalPages = Math.ceil(total / limit);

    // Debug: Log the first few entries to see date format
    if (result[0] && result[0].length > 0) {
      console.log('📅 Sample entries from database:');
      result[0].slice(0, 3).forEach((entry, index) => {
        console.log(`Entry ${index + 1}:`, {
          id: entry.id,
          date: entry.date,
          dateType: typeof entry.date,
          dateString: String(entry.date)
        });
      });
    }

    res.json({ 
      entries: result[0], 
      total, 
      page, 
      limit, 
      totalPages 
    });
  } catch (error) {
    console.error('Get timesheet entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get timesheet entries for all users (Admin/Supervisor only)
router.get('/all-entries', authenticateToken, async (req, res) => {
  try {
    // Only ADMIN and SUPERVISOR can view all entries
    if (!['ADMIN', 'SUPERVISOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('🔍 /all-entries request received with query params:', req.query);
    console.log('👤 User role:', req.user.role);
    console.log('👤 User department:', req.user.department);
    console.log('👤 User details:', { id: req.user.id, email: req.user.email, role: req.user.role, department: req.user.department });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    let sortBy = req.query.sortBy || 'te.date';
    const sortOrder = req.query.sortOrder || 'desc';

    // Normalize sort column to avoid ambiguous field names
    const mapSort = (col) => {
      if (!col) return 'te.date';
      const lower = String(col).toLowerCase();
      if (lower === 'created_at' || lower === 'te.created_at') return 'te.created_at';
      if (lower === 'date' || lower === 'te.date') return 'te.date';
      if (lower === 'total_hours' || lower === 'te.total_hours') return 'te.total_hours';
      if (lower === 'status' || lower === 'te.status') return 'te.status';
      if (lower === 'priority' || lower === 'te.priority') return 'te.priority';
      if (lower === 'user_first_name' || lower === 'u.first_name') return 'u.first_name';
      if (lower === 'user_last_name' || lower === 'u.last_name') return 'u.last_name';
      return 'te.date';
    };
    sortBy = mapSort(sortBy);
    
    // Build WHERE clause for filters
    let whereClause = '';
    let queryParams = [];
    
    // If supervisor, filter by their department
    if (req.user.role === 'SUPERVISOR') {
      console.log('🔒 Applying supervisor department filter:', req.user.department);
      whereClause = 'WHERE te.department = ?';
      queryParams.push(req.user.department);
    }
    
    // Add search filter
    if (req.query.search) {
      const searchCondition = `(te.client_file_number LIKE ? OR te.department LIKE ? OR te.task LIKE ? OR te.activity LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      if (whereClause) {
        whereClause += ` AND ${searchCondition}`;
      } else {
        whereClause = `WHERE ${searchCondition}`;
      }
      const searchTerm = `%${req.query.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Add date range filter
    if (req.query.dateFrom) {
      const dateCondition = `te.date >= ?`;
      if (whereClause) {
        whereClause += ` AND ${dateCondition}`;
      } else {
        whereClause = `WHERE ${dateCondition}`;
      }
      queryParams.push(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      const dateCondition = `te.date <= ?`;
      if (whereClause) {
        whereClause += ` AND ${dateCondition}`;
      } else {
        whereClause = `WHERE ${dateCondition}`;
      }
      queryParams.push(req.query.dateTo);
    }
    
    // Add status filter
    if (req.query.status) {
      const statusCondition = `te.status = ?`;
      if (whereClause) {
        whereClause += ` AND ${statusCondition}`;
      } else {
        whereClause = `WHERE ${statusCondition}`;
      }
      queryParams.push(req.query.status);
    }
    
    // Add priority filter
    if (req.query.priority) {
      const priorityCondition = `te.priority = ?`;
      if (whereClause) {
        whereClause += ` AND ${priorityCondition}`;
      } else {
        whereClause = `WHERE ${priorityCondition}`;
      }
      queryParams.push(req.query.priority);
    }
    
    // Add billable filter
    if (req.query.billable !== undefined) {
      const billableCondition = `te.billable = ?`;
      if (whereClause) {
        whereClause += ` AND ${billableCondition}`;
      } else {
        whereClause = `WHERE ${billableCondition}`;
      }
      queryParams.push(req.query.billable === 'true' ? 1 : 0);
    }
    
    // Add department filter
    if (req.query.department) {
      console.log('🏢 Adding department filter:', req.query.department);
      const departmentCondition = `te.department = ?`;
      if (whereClause) {
        whereClause += ` AND ${departmentCondition}`;
      } else {
        whereClause = `WHERE ${departmentCondition}`;
      }
      queryParams.push(req.query.department);
    }
    
    // Add user email filter
    if (req.query.userEmail) {
      console.log('👤 Adding user email filter:', req.query.userEmail);
      const userEmailCondition = `u.email = ?`;
      if (whereClause) {
        whereClause += ` AND ${userEmailCondition}`;
      } else {
        whereClause = `WHERE ${userEmailCondition}`;
      }
      queryParams.push(req.query.userEmail);
    }
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM timesheet_entries te
      JOIN users u ON te.user_id = u.id
      ${whereClause || ''}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = countResult[0][0].total;
    
    // Get paginated data - optimized for large datasets
    const dataQuery = `
      SELECT te.id, te.date, te.client_file_number, te.department, te.task, te.activity, 
      te.priority, te.start_time, te.end_time, te.total_hours, te.status, te.billable, 
      te.comments, te.created_at, u.first_name as user_first_name, u.last_name as user_last_name, u.email as user_email
      FROM timesheet_entries te
      JOIN users u ON te.user_id = u.id
      ${whereClause || ''}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}, te.created_at DESC
      LIMIT ? OFFSET ?
    `;
    queryParams.push(limit, offset);
    
    console.log('🔍 Final query:', dataQuery);
    console.log('🔍 Query parameters:', queryParams);
    console.log('🔍 Where clause:', whereClause);
    
    const result = await query(dataQuery, queryParams);
    const totalPages = Math.ceil(total / limit);

    res.json({ 
      entries: result[0], 
      total, 
      page, 
      limit, 
      totalPages 
    });
  } catch (error) {
    console.error('Get all timesheet entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new timesheet entry
router.post('/entries', [
  authenticateToken,
  body('date').isISO8601().withMessage('Date must be in YYYY-MM-DD format'),
  body('client_file_number').trim().isLength({ min: 1 }).withMessage('Client file number is required'),
  body('department').trim().isLength({ min: 1 }).withMessage('Department is required'),
  body('task').trim().isLength({ min: 1 }).withMessage('Task is required'),
  body('activity').trim().isLength({ min: 1 }).withMessage('Activity is required'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Priority is required'),
  body('start_time').custom(value => {
    if (!isValidTimeInterval(value)) {
      throw new Error('Start time must be in 15-minute intervals');
    }
    return true;
  }),
  body('end_time').custom(value => {
    if (!isValidTimeInterval(value)) {
      throw new Error('End time must be in 15-minute intervals');
    }
    return true;
  }),
  body('status').isIn(['Completed', 'CarriedOut', 'NotStarted']).withMessage('Status must be one of: Completed, CarriedOut, NotStarted'),
  body('billable').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { 
      date, client_file_number, department, task, activity, priority, 
      start_time, end_time, status, billable, comments 
    } = req.body;

    // Process date to ensure it's stored correctly (avoid timezone issues)
    // Store the date as-is to avoid timezone conversion issues
    const processedDate = date; // Keep the original date string
    console.log('📅 Original date:', date, 'Processed date:', processedDate);

    // Validate that end time is after start time
    if (start_time >= end_time) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Check for overlapping entries on the same date
    const overlappingResult = await query(
      `SELECT id, date, start_time, end_time, client_file_number, task, activity 
       FROM timesheet_entries 
       WHERE user_id = ? AND date = ? 
       AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))`,
      [req.user.id, processedDate, start_time, start_time, end_time, end_time, start_time, end_time]
    );

    if (overlappingResult[0].length > 0) {
      const overlappingEntry = overlappingResult[0][0];
      return res.status(400).json({ 
        error: 'Time entry overlaps with existing entry',
        overlappingEntry: {
          date: overlappingEntry.date,
          start_time: overlappingEntry.start_time,
          end_time: overlappingEntry.end_time,
          client_file_number: overlappingEntry.client_file_number,
          task: overlappingEntry.task,
          activity: overlappingEntry.activity
        }
      });
    }

    const result = await query(
      `INSERT INTO timesheet_entries (user_id, date, client_file_number, department, task, activity, 
       priority, start_time, end_time, status, billable, comments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, processedDate, client_file_number, department, task, activity, 
       priority, start_time, end_time, status, billable, comments || '']
    );

    // Get the created entry
    const [newEntry] = await query(
      `SELECT id, DATE_FORMAT(date, '%Y-%m-%d') as date, client_file_number, department, task, activity, priority, 
       start_time, end_time, total_hours, status, billable, comments, created_at 
       FROM timesheet_entries WHERE id = ?`,
      [result[0].insertId]
    );

    // Get total count of entries for this user
    const [countResult] = await query(
      `SELECT COUNT(*) as total FROM timesheet_entries WHERE user_id = ?`,
      [req.user.id]
    );
    const totalEntries = countResult[0].total;

    res.status(201).json({ 
      message: 'Timesheet entry created successfully',
      entry: newEntry[0],
      totalEntries: totalEntries
    });

  } catch (error) {
    console.error('Create timesheet entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update timesheet entry
router.put('/entries/:id', [
  authenticateToken,
  body('date').isISO8601().withMessage('Date must be in YYYY-MM-DD format'),
  body('client_file_number').trim().isLength({ min: 1 }).withMessage('Client file number is required'),
  body('department').trim().isLength({ min: 1 }).withMessage('Department is required'),
  body('task').trim().isLength({ min: 1 }).withMessage('Task is required'),
  body('activity').trim().isLength({ min: 1 }).withMessage('Activity is required'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Priority is required'),
  body('start_time').custom(value => {
    if (!isValidTimeInterval(value)) {
      throw new Error('Start time must be in 15-minute intervals');
    }
    return true;
  }),
  body('end_time').custom(value => {
    if (!isValidTimeInterval(value)) {
      throw new Error('End time must be in 15-minute intervals');
    }
    return true;
  }),
  body('status').isIn(['Completed', 'CarriedOut', 'NotStarted']).withMessage('Status must be one of: Completed, CarriedOut, NotStarted'),
  body('billable').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { 
      date, client_file_number, department, task, activity, priority, 
      start_time, end_time, status, billable, comments 
    } = req.body;

    // Process date to ensure it's stored correctly (avoid timezone issues)
    const processedDate = date; // Keep the original date string
    console.log('📅 UPDATE - Original date:', date, 'Processed date:', processedDate);

    // Validate that end time is after start time
    if (start_time >= end_time) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Check if entry exists and belongs to user
    const existingEntry = await query(
      'SELECT id FROM timesheet_entries WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existingEntry[0].length === 0) {
      return res.status(404).json({ error: 'Timesheet entry not found' });
    }

    // Check for overlapping entries (excluding current entry)
    const overlappingResult = await query(
      `SELECT id, date, start_time, end_time, client_file_number, task, activity 
       FROM timesheet_entries 
       WHERE user_id = ? AND date = ? AND id != ? 
       AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (start_time >= ? AND end_time <= ?))`,
      [req.user.id, processedDate, id, start_time, start_time, end_time, end_time, start_time, end_time]
    );

    if (overlappingResult[0].length > 0) {
      const overlappingEntry = overlappingResult[0][0];
      return res.status(400).json({ 
        error: 'Time entry overlaps with existing entry',
        overlappingEntry: {
          date: overlappingEntry.date,
          start_time: overlappingEntry.start_time,
          end_time: overlappingEntry.end_time,
          client_file_number: overlappingEntry.client_file_number,
          task: overlappingEntry.task,
          activity: overlappingEntry.activity
        }
      });
    }

    await query(
      `UPDATE timesheet_entries 
       SET date = ?, client_file_number = ?, department = ?, task = ?, activity = ?, 
           priority = ?, start_time = ?, end_time = ?, status = ?, billable = ?, 
           comments = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [processedDate, client_file_number, department, task, activity, priority, 
       start_time, end_time, status, billable, comments || '', id, req.user.id]
    );

    // Get the updated entry
    const [updatedEntry] = await query(
      `SELECT id, DATE_FORMAT(date, '%Y-%m-%d') as date, client_file_number, department, task, activity, priority, 
       start_time, end_time, total_hours, status, billable, comments, updated_at 
       FROM timesheet_entries WHERE id = ?`,
      [id]
    );

    res.json({
      message: 'Timesheet entry updated successfully',
      entry: updatedEntry[0]
    });

  } catch (error) {
    console.error('Update timesheet entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete timesheet entry
router.delete('/entries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if entry exists and belongs to user
    const existingEntry = await query(
      'SELECT id FROM timesheet_entries WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existingEntry[0].length === 0) {
      return res.status(404).json({ error: 'Timesheet entry not found' });
    }

    await query('DELETE FROM timesheet_entries WHERE id = ? AND user_id = ?', [id, req.user.id]);

    res.json({ message: 'Timesheet entry deleted successfully' });

  } catch (error) {
    console.error('Delete timesheet entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to check authentication
router.get('/test-auth', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Test auth - User object:', req.user);
    console.log('🔍 Test auth - User ID:', req.user.id);
    
    // Test database query
    const testQuery = 'SELECT COUNT(*) as count FROM timesheet_entries WHERE user_id = ?';
    const testResult = await query(testQuery, [req.user.id]);
    
    res.json({ 
      user: req.user,
      entriesCount: testResult[0][0].count,
      message: 'Authentication test successful'
    });
  } catch (error) {
    console.error('Test auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get time intervals for dropdown
router.get('/time-intervals', (req, res) => {
  res.json({ intervals: getTimeIntervals() });
});

// Get departments list
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const sqlQuery = 'SELECT id, name, description, is_active FROM departments WHERE is_active = true ORDER BY name ASC';
    const result = await query(sqlQuery);
    res.json({ success: true, departments: result[0] });
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments', error: error.message });
  }
});

// Admin/Supervisor: Get users compliance data
router.get('/users-compliance', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERVISOR') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    console.log('🔍 Fetching users compliance data...');

    // Build the SQL query based on user role
    let sqlQuery = `
      SELECT 
        u.id as userId,
        u.email as userEmail,
        u.first_name as firstName,
        u.last_name as lastName,
        u.department,
        u.is_active,
        u.created_at,
        u.updated_at,
        u.last_login,
        MAX(t.created_at) as lastEntryDate
      FROM users u
      LEFT JOIN timesheet_entries t ON u.id = t.user_id
      WHERE u.role != 'ADMIN' AND u.is_active = true
    `;

    const params = [];

    // Supervisors can only see users in their department
    if (req.user.role === 'SUPERVISOR') {
      sqlQuery += ' AND u.department = ?';
      params.push(req.user.department);
      console.log(`🔍 Filtering for supervisor department: ${req.user.department}`);
    }

    sqlQuery += `
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.department, u.is_active, u.created_at, u.updated_at, u.last_login
      ORDER BY u.department ASC, u.first_name ASC, u.last_name ASC
    `;

    const result = await query(sqlQuery, params);
    
    console.log(`📊 Found ${result[0].length} users for compliance monitoring`);
    
    // Log first user for debugging
    if (result[0] && result[0].length > 0) {
      console.log('🔍 Sample user data:', JSON.stringify(result[0][0], null, 2));
    }

    res.json(result[0]);

  } catch (error) {
    console.error('❌ Error fetching users compliance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users compliance data',
      error: error.message
    });
  }
});

// Admin: Send compliance notification
router.post('/compliance-notification', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { userId, type, timestamp } = req.body;
    
    if (!userId || !type || !timestamp) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId, type, and timestamp are required' 
      });
    }

    // Here you would integrate with your notification system
    // For now, we'll log it and store in a notifications table if it exists
    console.log(`📢 Compliance notification sent to user ${userId}: ${type} at ${timestamp}`);

    // You could also store this in a notifications table for tracking
    // const insertSql = 'INSERT INTO compliance_notifications (user_id, type, sent_at, sent_by) VALUES (?, ?, ?, ?)';
    // await query(insertSql, [userId, type, timestamp, req.user.id]);

    res.json({
      success: true,
      message: `Compliance notification sent successfully`,
      notification: {
        userId,
        type,
        timestamp,
        sentBy: req.user.id
      }
    });

  } catch (error) {
    console.error('❌ Error sending compliance notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send compliance notification',
      error: error.message
    });
  }
});

module.exports = router; 