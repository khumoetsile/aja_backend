const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDatabase() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'aja_timesheet'
    });

    console.log('🔗 Connected to database');

    // Create tasks table
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
      )
    `;

    await connection.execute(createTasksTable);
    console.log('✅ Tasks table created');

    // Update departments table with new departments
    const updateDepartments = `
      INSERT IGNORE INTO departments (name, description) VALUES
      ('Sales', 'Sales and business development'),
      ('Support', 'Customer support and service'),
      ('IT Security', 'IT Security and cybersecurity'),
      ('Admin', 'Administrative services'),
      ('R&D', 'Research and Development'),
      ('Procurement', 'Procurement and supply chain')
    `;

    await connection.execute(updateDepartments);
    console.log('✅ Departments updated');

    // Insert tasks for each department
    const tasksData = [
      // IT Department Tasks
      ['IT', 'Setup server', 'Configure and deploy new server infrastructure'],
      ['IT', 'Deploy application', 'Deploy software applications to production'],
      ['IT', 'Configure firewall', 'Set up and configure network security'],
      ['IT', 'Manage backups', 'Perform system backups and recovery procedures'],

      // HR Department Tasks
      ['HR', 'Onboard employee', 'New employee onboarding and orientation'],
      ['HR', 'Process payroll', 'Payroll processing and administration'],
      ['HR', 'Conduct exit interviews', 'Employee exit interview procedures'],
      ['HR', 'Update policies', 'HR policy updates and documentation'],

      // Finance Department Tasks
      ['Finance', 'Prepare invoices', 'Invoice preparation and processing'],
      ['Finance', 'Reconcile accounts', 'Account reconciliation and auditing'],
      ['Finance', 'Budget forecasting', 'Financial planning and budget forecasting'],
      ['Finance', 'Expense approvals', 'Expense review and approval process'],

      // Sales Department Tasks
      ['Sales', 'Generate leads', 'Lead generation and prospecting'],
      ['Sales', 'Prepare proposals', 'Sales proposal preparation'],
      ['Sales', 'Client follow-up', 'Client relationship management'],
      ['Sales', 'Close deals', 'Sales deal closure and contract signing'],

      // Marketing Department Tasks
      ['Marketing', 'Campaign planning', 'Marketing campaign strategy and planning'],
      ['Marketing', 'Content creation', 'Marketing content development'],
      ['Marketing', 'Social media scheduling', 'Social media content management'],
      ['Marketing', 'Performance analysis', 'Marketing performance analytics'],

      // Operations Department Tasks
      ['Operations', 'Inventory check', 'Inventory management and auditing'],
      ['Operations', 'Vendor coordination', 'Vendor relationship management'],
      ['Operations', 'Logistics planning', 'Logistics and supply chain planning'],
      ['Operations', 'Quality audits', 'Quality control and audit procedures'],

      // Support Department Tasks
      ['Support', 'Ticket triage', 'Support ticket classification and routing'],
      ['Support', 'Customer follow-up', 'Customer support follow-up procedures'],
      ['Support', 'Issue escalation', 'Support issue escalation management'],
      ['Support', 'Knowledge-base updates', 'Support documentation updates'],

      // Legal Department Tasks
      ['Legal', 'Contract review', 'Legal contract review and analysis'],
      ['Legal', 'Compliance audit', 'Legal compliance auditing'],
      ['Legal', 'Policy drafting', 'Legal policy development'],
      ['Legal', 'Risk assessment', 'Legal risk assessment and mitigation'],

      // IT Security Department Tasks
      ['IT Security', 'Vulnerability scanning', 'Security vulnerability assessment'],
      ['IT Security', 'Penetration testing', 'Security penetration testing'],
      ['IT Security', 'Access reviews', 'User access review and management'],
      ['IT Security', 'Security training', 'Security awareness training'],

      // Admin Department Tasks
      ['Admin', 'Meeting scheduling', 'Meeting coordination and scheduling'],
      ['Admin', 'Office supplies', 'Office supply management'],
      ['Admin', 'Visitor reception', 'Visitor management and reception'],
      ['Admin', 'Facility maintenance', 'Facility maintenance coordination'],

      // R&D Department Tasks
      ['R&D', 'Prototype design', 'Product prototype development'],
      ['R&D', 'Testing', 'Research and development testing'],
      ['R&D', 'Documentation', 'R&D documentation and reporting'],
      ['R&D', 'Patent filing', 'Patent application and filing'],

      // Procurement Department Tasks
      ['Procurement', 'RFQ issuance', 'Request for quotation preparation'],
      ['Procurement', 'Bid evaluation', 'Vendor bid evaluation and analysis'],
      ['Procurement', 'Purchase order', 'Purchase order processing'],
      ['Procurement', 'Supplier onboarding', 'New supplier onboarding process']
    ];

    for (const [departmentName, taskName, description] of tasksData) {
      const insertTask = `
        INSERT IGNORE INTO tasks (department_id, name, description)
        SELECT d.id, ?, ?
        FROM departments d
        WHERE d.name = ?
      `;
      
      await connection.execute(insertTask, [taskName, description, departmentName]);
    }

    console.log('✅ Tasks inserted successfully');

    // Verify the data
    const [tasks] = await connection.execute(`
      SELECT d.name as department, t.name as task, t.description
      FROM tasks t
      JOIN departments d ON t.department_id = d.id
      WHERE t.is_active = true
      ORDER BY d.name, t.name
    `);

    console.log('📋 Total tasks in database:', tasks.length);
    console.log('📋 Sample tasks:');
    tasks.slice(0, 10).forEach(task => {
      console.log(`  - ${task.department}: ${task.task}`);
    });

  } catch (error) {
    console.error('❌ Error updating database:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔗 Database connection closed');
    }
  }
}

updateDatabase(); 