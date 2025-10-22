const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Main bulk seeding function for departments and tasks
async function bulkSeedDepartments(departmentsData, options = {}) {
  const {
    skipDuplicates = true,
    batchSize = 5,
    delayBetweenBatches = 500
  } = options;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aja_timesheet',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔗 Connected to database');
    console.log(`📋 Processing ${departmentsData.length} departments...`);
    console.log(`⚙️  Options: Skip duplicates: ${skipDuplicates}, Batch size: ${batchSize}`);

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

    // Process departments in batches
    for (let i = 0; i < departmentsData.length; i += batchSize) {
      const batch = departmentsData.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(departmentsData.length / batchSize)} (${batch.length} departments)`);

      for (let j = 0; j < batch.length; j++) {
        const deptData = batch[j];
        const deptIndex = i + j + 1;
        
        console.log(`\n🏢 [${deptIndex}/${departmentsData.length}] Processing: ${deptData.name}`);

        try {
          // Validate required fields
          if (!deptData.name) {
            throw new Error('Department name is required');
          }

          // Check if department already exists
          let departmentId;
          let deptStatus = 'created';

          if (skipDuplicates) {
            const [existingDept] = await connection.execute(
              'SELECT id FROM departments WHERE name = ?',
              [deptData.name]
            );

            if (existingDept.length > 0) {
              departmentId = existingDept[0].id;
              deptStatus = 'skipped';
              console.log(`⚠️  Department already exists, using existing ID: ${departmentId}`);
              results.departments_skipped++;
            }
          }

          if (deptStatus === 'created') {
            // Create new department
            const [deptResult] = await connection.execute(`
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

          for (let k = 0; k < tasks.length; k++) {
            const taskData = tasks[k];
            const taskIndex = k + 1;
            
            try {
              console.log(`  📝 [${taskIndex}/${tasks.length}] Processing task: ${taskData.name}`);

              // Check if task already exists for this department
              if (skipDuplicates) {
                const [existingTask] = await connection.execute(
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
                  continue;
                }
              }

              // Create new task
              await connection.execute(`
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

      // Delay between batches to avoid overwhelming the system
      if (i + batchSize < departmentsData.length) {
        console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    // Print comprehensive summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BULK SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total departments processed: ${results.total_departments}`);
    console.log(`✅ Departments created: ${results.departments_created}`);
    console.log(`⚠️  Departments skipped: ${results.departments_skipped}`);
    console.log(`❌ Department errors: ${results.departments_errors}`);
    console.log(`📝 Total tasks processed: ${results.total_tasks}`);
    console.log(`✅ Tasks created: ${results.tasks_created}`);
    console.log(`⚠️  Tasks skipped: ${results.tasks_skipped}`);
    console.log(`❌ Task errors: ${results.tasks_errors}`);

    if (results.departments_errors > 0 || results.tasks_errors > 0) {
      console.log('\n❌ DETAILED ERROR REPORT:');
      console.log('-'.repeat(40));
      results.details
        .filter(detail => detail.status === 'error')
        .forEach(detail => {
          console.log(`  Department: ${detail.department}`);
          if (detail.error) console.log(`     Error: ${detail.error}`);
        });
    }

    console.log('\n🎉 Bulk seeding completed!');
    return results;

  } catch (error) {
    console.error('❌ Bulk seeding failed:', error);
    throw error;
  } finally {
    try { 
      await connection.end(); 
    } catch (_) {}
  }
}

// Function to load departments from JSON file
async function loadDepartmentsFromFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    
    // Handle both direct array and object with departments property
    if (Array.isArray(jsonData)) {
      return jsonData;
    } else if (jsonData.departments && Array.isArray(jsonData.departments)) {
      return jsonData.departments;
    } else {
      throw new Error('Invalid JSON format. Expected array of departments or object with departments property.');
    }
  } catch (error) {
    console.error('Error loading departments from file:', error.message);
    return [];
  }
}

// CLI interface
async function main() {
  console.log('🚀 AJA Timesheet Bulk Department & Task Seeding Script');
  console.log('====================================================\n');

  const departmentsFilePath = process.argv[2];
  const skipDuplicates = !process.argv.includes('--force');
  const batchSize = parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 5;

  if (!departmentsFilePath) {
    console.log('Usage: node bulk-seed-departments.js <departments-file> [options]');
    console.log('Options:');
    console.log('  --force           Overwrite existing departments and tasks');
    console.log('  --batch-size=N     Process N departments at a time (default: 5)');
    console.log('\nExample: node bulk-seed-departments.js departments.json --batch-size=3');
    process.exit(1);
  }

  console.log(`📁 Loading departments from: ${departmentsFilePath}`);
  const departmentsToSeed = await loadDepartmentsFromFile(departmentsFilePath);
  
  if (departmentsToSeed.length === 0) {
    console.log('❌ No departments found in file or file could not be read');
    process.exit(1);
  }

  console.log(`📊 Total departments to process: ${departmentsToSeed.length}`);
  console.log(`⚙️  Configuration: Skip duplicates: ${skipDuplicates}, Batch size: ${batchSize}\n`);

  const options = {
    skipDuplicates,
    batchSize,
    delayBetweenBatches: 500
  };

  try {
    const results = await bulkSeedDepartments(departmentsToSeed, options);
    
    // Save results to file
    const resultsFile = `department-seeding-results-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { bulkSeedDepartments, loadDepartmentsFromFile };
