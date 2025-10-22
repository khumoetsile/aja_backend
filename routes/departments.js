const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all departments with their tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Getting all departments and tasks');
    
    // Get all departments
    const [departments] = await query(`
      SELECT d.id, d.name, d.description, d.is_active, d.created_at,
             COUNT(t.id) as task_count
      FROM departments d
      LEFT JOIN tasks t ON d.id = t.department_id AND t.is_active = true
      GROUP BY d.id, d.name, d.description, d.is_active, d.created_at
      ORDER BY d.name
    `);

    // Get all tasks with department info
    const [tasks] = await query(`
      SELECT t.id, t.name, t.description, t.is_active, t.created_at, t.updated_at,
             d.name as department_name, d.id as department_id
      FROM tasks t
      JOIN departments d ON t.department_id = d.id
      ORDER BY d.name, t.name
    `);

    // Group tasks by department
    const departmentsWithTasks = departments.map(dept => ({
      ...dept,
      tasks: tasks.filter(task => task.department_id === dept.id)
    }));

    console.log(`✅ Retrieved ${departments.length} departments with ${tasks.length} tasks`);
    res.json({
      message: 'Departments and tasks retrieved successfully',
      departments: departmentsWithTasks,
      total_departments: departments.length,
      total_tasks: tasks.length
    });

  } catch (error) {
    console.error('❌ Error getting departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific department with tasks
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.params.id;
    console.log(`📋 Getting department ${departmentId} with tasks`);
    
    // Get department details
    const [departments] = await query(
      'SELECT * FROM departments WHERE id = ?',
      [departmentId]
    );

    if (departments.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Get tasks for this department
    const [tasks] = await query(`
      SELECT * FROM tasks 
      WHERE department_id = ? 
      ORDER BY name
    `, [departmentId]);

    const department = {
      ...departments[0],
      tasks: tasks
    };

    console.log(`✅ Retrieved department ${department.name} with ${tasks.length} tasks`);
    res.json({
      message: 'Department retrieved successfully',
      department: department
    });

  } catch (error) {
    console.error('❌ Error getting department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new department
router.post('/', [
  authenticateToken,
  body('name').notEmpty().withMessage('Department name is required'),
  body('description').optional().isString(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { name, description = '', is_active = true } = req.body;
    
    console.log(`📋 Creating new department: ${name}`);

    // Check if department already exists
    const [existing] = await query(
      'SELECT id FROM departments WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Department already exists' });
    }

    // Create department
    const [result] = await query(`
      INSERT INTO departments (name, description, is_active, created_at)
      VALUES (?, ?, ?, NOW())
    `, [name, description, is_active]);

    console.log(`✅ Department created with ID: ${result.insertId}`);
    res.status(201).json({
      message: 'Department created successfully',
      department: {
        id: result.insertId,
        name,
        description,
        is_active,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error creating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk upload departments and tasks
router.post('/bulk-upload', [
  authenticateToken,
  body('departments').isArray().withMessage('Departments must be an array'),
  body('departments.*.name').notEmpty().withMessage('Department name is required'),
  body('departments.*.description').optional().isString(),
  body('departments.*.is_active').optional().isBoolean(),
  body('departments.*.tasks').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { departments: departmentsData } = req.body;
    console.log(`📋 Bulk uploading ${departmentsData.length} departments`);
    
    const results = {
      total_departments: departmentsData.length,
      departments_created: 0,
      departments_skipped: 0,
      departments_errors: 0,
      total_tasks: 0,
      tasks_created: 0,
      tasks_skipped: 0,
      tasks_errors: 0,
      details: []
    };

    // Process each department
    for (let i = 0; i < departmentsData.length; i++) {
      const deptData = departmentsData[i];
      const deptIndex = i + 1;
      
      try {
        console.log(`\n📦 Processing department ${deptIndex}/${departmentsData.length}: ${deptData.name}`);

        // Check if department already exists
        const [existingDept] = await query(
          'SELECT id FROM departments WHERE name = ?',
          [deptData.name]
        );

        let departmentId;
        let deptStatus = 'created';

        if (existingDept.length > 0) {
          // Department exists, use existing ID
          departmentId = existingDept[0].id;
          deptStatus = 'skipped';
          results.departments_skipped++;
          console.log(`⚠️  Department already exists, using existing ID: ${departmentId}`);
        } else {
          // Create new department
          const [deptResult] = await query(`
            INSERT INTO departments (name, description, is_active, created_at)
            VALUES (?, ?, ?, NOW())
          `, [
            deptData.name,
            deptData.description || '',
            deptData.is_active !== undefined ? deptData.is_active : true
          ]);
          
          departmentId = deptResult.insertId;
          results.departments_created++;
          console.log(`✅ Department created with ID: ${departmentId}`);
        }

        // Process tasks for this department
        const tasks = deptData.tasks || [];
        results.total_tasks += tasks.length;
        
        const taskDetails = [];

        for (let j = 0; j < tasks.length; j++) {
          const taskData = tasks[j];
          const taskIndex = j + 1;
          
          try {
            console.log(`  📝 Processing task ${taskIndex}/${tasks.length}: ${taskData.name}`);

            // Check if task already exists for this department
            const [existingTask] = await query(
              'SELECT id FROM tasks WHERE department_id = ? AND name = ?',
              [departmentId, taskData.name]
            );

            if (existingTask.length > 0) {
              taskDetails.push({
                name: taskData.name,
                status: 'skipped',
                reason: 'Task already exists'
              });
              results.tasks_skipped++;
              console.log(`    ⚠️  Task already exists, skipping`);
            } else {
              // Create new task
              await query(`
                INSERT INTO tasks (department_id, name, description, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
              `, [
                departmentId,
                taskData.name,
                taskData.description || '',
                taskData.is_active !== undefined ? taskData.is_active : true
              ]);
              
              taskDetails.push({
                name: taskData.name,
                status: 'created'
              });
              results.tasks_created++;
              console.log(`    ✅ Task created successfully`);
            }

          } catch (taskError) {
            console.error(`    ❌ Error creating task ${taskData.name}:`, taskError.message);
            taskDetails.push({
              name: taskData.name,
              status: 'error',
              error: taskError.message
            });
            results.tasks_errors++;
          }
        }

        results.details.push({
          department: deptData.name,
          status: deptStatus,
          tasks_processed: tasks.length,
          task_details: taskDetails
        });

      } catch (deptError) {
        console.error(`❌ Error processing department ${deptData.name}:`, deptError.message);
        results.departments_errors++;
        results.details.push({
          department: deptData.name,
          status: 'error',
          error: deptError.message,
          tasks_processed: 0,
          task_details: []
        });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BULK UPLOAD SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total departments processed: ${results.total_departments}`);
    console.log(`✅ Departments created: ${results.departments_created}`);
    console.log(`⚠️  Departments skipped: ${results.departments_skipped}`);
    console.log(`❌ Department errors: ${results.departments_errors}`);
    console.log(`📝 Total tasks processed: ${results.total_tasks}`);
    console.log(`✅ Tasks created: ${results.tasks_created}`);
    console.log(`⚠️  Tasks skipped: ${results.tasks_skipped}`);
    console.log(`❌ Task errors: ${results.tasks_errors}`);

    res.json({
      message: 'Bulk upload completed',
      results: results
    });

  } catch (error) {
    console.error('❌ Error in bulk upload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update department
router.put('/:id', [
  authenticateToken,
  body('name').optional().notEmpty().withMessage('Department name cannot be empty'),
  body('description').optional().isString(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const departmentId = req.params.id;
    const { name, description, is_active } = req.body;
    
    console.log(`📋 Updating department ${departmentId}`);

    // Check if department exists
    const [existing] = await query(
      'SELECT id FROM departments WHERE id = ?',
      [departmentId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    updates.push('updated_at = NOW()');
    values.push(departmentId);

    await query(`
      UPDATE departments 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);

    console.log(`✅ Department updated successfully`);
    res.json({
      message: 'Department updated successfully',
      department_id: departmentId
    });

  } catch (error) {
    console.error('❌ Error updating department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete department (soft delete by setting is_active to false)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const departmentId = req.params.id;
    console.log(`📋 Soft deleting department ${departmentId}`);

    // Check if department exists
    const [existing] = await query(
      'SELECT id FROM departments WHERE id = ?',
      [departmentId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Soft delete department and its tasks
    await query(`
      UPDATE departments 
      SET is_active = false, updated_at = NOW()
      WHERE id = ?
    `, [departmentId]);

    await query(`
      UPDATE tasks 
      SET is_active = false, updated_at = NOW()
      WHERE department_id = ?
    `, [departmentId]);

    console.log(`✅ Department and its tasks soft deleted successfully`);
    res.json({
      message: 'Department and its tasks deactivated successfully',
      department_id: departmentId
    });

  } catch (error) {
    console.error('❌ Error deleting department:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
