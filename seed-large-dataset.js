const mysql = require('mysql2/promise');
require('dotenv').config();

// ========== CONFIGURATION ==========
const CONFIG = {
  NUM_STAFF: 50,           // Staff members
  NUM_SUPERVISORS: 10,     // Supervisors
  ENTRIES_PER_USER_MIN: 60,    // Min timesheet entries per user
  ENTRIES_PER_USER_MAX: 150,   // Max timesheet entries per user
  DAYS_BACK: 180,          // Generate data for past 6 months
};

// ========== DATA POOLS ==========
const FIRST_NAMES = [
  'Thabo', 'Lerato', 'Sipho', 'Naledi', 'Kagiso', 'Boitumelo', 'Tshepo', 'Neo',
  'Keabetswe', 'Rethabile', 'Dineo', 'Lebo', 'Mpho', 'Lesedi', 'Karabo', 'Tebogo',
  'Kgotso', 'Phenyo', 'Amogelang', 'Refilwe', 'Thato', 'Kelebogile', 'Goitse',
  'Mmabatho', 'Kefilwe', 'Oratile', 'Tumelo', 'Lorato', 'Boipelo', 'Kitso',
  'Obakeng', 'Masego', 'Onthatile', 'Tlotlo', 'Khumo', 'Gofaone', 'Bontle',
  'Omphile', 'Tlhalefo', 'Keitumetse', 'Motheo', 'Molebogeng', 'Botlhale',
  'Kutlwano', 'Lethabo', 'Itumeleng', 'Palesa', 'Tshegofatso', 'Keorapetse'
];

const LAST_NAMES = [
  'Molefe', 'Mokwena', 'Dube', 'Khoza', 'Nkosi', 'Mokoena', 'Sithole', 'Ndlovu',
  'Mthembu', 'Mahlangu', 'Khumalo', 'Naidoo', 'Pillay', 'Reddy', 'Govender',
  'Moodley', 'Nair', 'Chetty', 'Padayachee', 'Naicker', 'Van der Merwe', 'Botha',
  'Pretorius', 'Du Plessis', 'Fourie', 'Nel', 'De Wet', 'Venter', 'Coetzee',
  'Steyn', 'Kruger', 'Smit', 'Visser', 'Meyer', 'Swart', 'Terreblanche',
  'Hassan', 'Mohamed', 'Ahmed', 'Ali', 'Khan', 'Patel', 'Singh', 'Sharma',
  'Moyo', 'Ncube', 'Sibanda', 'Mpofu', 'Nyathi', 'Ngwenya'
];

const DEPARTMENTS = [
  'Legal', 'Finance', 'IT', 'HR', 'Marketing', 'Operations',
  'Litigation', 'KYC_Compliance', 'CRM', 'Front_Office',
  'Healthcare_dept', 'Hospitality', 'Accounts'
];

const LEGAL_TASKS = [
  'Contract Review', 'Legal Research', 'Court Filing', 'Client Consultation',
  'Document Drafting', 'Case Preparation', 'Legal Opinion', 'Compliance Review',
  'Discovery Process', 'Deposition Preparation', 'Brief Writing', 'Motion Filing',
  'Settlement Negotiation', 'Due Diligence', 'Regulatory Filing', 'Appeal Preparation'
];

const FINANCE_TASKS = [
  'Invoice Processing', 'Account Reconciliation', 'Budget Forecasting', 'Expense Approval',
  'Financial Reporting', 'Audit Preparation', 'Tax Filing', 'Payroll Processing',
  'Credit Analysis', 'Cash Flow Management', 'Risk Assessment', 'Investment Analysis',
  'Cost Allocation', 'Variance Analysis', 'Monthly Close', 'Quarterly Review'
];

const IT_TASKS = [
  'Server Maintenance', 'Application Deployment', 'Firewall Configuration', 'Backup Management',
  'Bug Fixing', 'Code Review', 'Database Optimization', 'Security Patch',
  'Network Troubleshooting', 'System Upgrade', 'User Support', 'Documentation Update',
  'Testing', 'Performance Tuning', 'API Integration', 'Infrastructure Setup'
];

const HR_TASKS = [
  'Employee Onboarding', 'Payroll Processing', 'Exit Interview', 'Policy Update',
  'Performance Review', 'Recruitment', 'Training Coordination', 'Benefits Administration',
  'Conflict Resolution', 'Employee Engagement', 'Compliance Training', 'Job Posting',
  'Background Check', 'Offer Letter Preparation', 'Employee Relations', 'Compensation Analysis'
];

const MARKETING_TASKS = [
  'Campaign Planning', 'Content Creation', 'Social Media Management', 'Performance Analysis',
  'Email Marketing', 'SEO Optimization', 'Brand Strategy', 'Market Research',
  'Event Coordination', 'Media Relations', 'Graphic Design', 'Video Production',
  'Customer Surveys', 'Competitor Analysis', 'Budget Planning', 'ROI Reporting'
];

const OPERATIONS_TASKS = [
  'Inventory Check', 'Vendor Coordination', 'Logistics Planning', 'Quality Audit',
  'Process Improvement', 'SOP Documentation', 'Resource Allocation', 'Capacity Planning',
  'Facility Management', 'Supply Chain Coordination', 'Risk Management', 'Performance Monitoring',
  'Workflow Optimization', 'Service Delivery', 'Contract Management', 'Compliance Check'
];

const GENERIC_TASKS = [
  'Client Meeting', 'Team Meeting', 'Project Planning', 'Report Preparation',
  'Email Correspondence', 'File Organization', 'Research', 'Data Entry',
  'Presentation Preparation', 'Training Session', 'Quality Review', 'Administrative Work'
];

const TASK_MAP = {
  'Legal': LEGAL_TASKS,
  'Litigation': LEGAL_TASKS,
  'Finance': FINANCE_TASKS,
  'Accounts': FINANCE_TASKS,
  'IT': IT_TASKS,
  'HR': HR_TASKS,
  'Marketing': MARKETING_TASKS,
  'Operations': OPERATIONS_TASKS,
  'KYC_Compliance': [...LEGAL_TASKS, ...OPERATIONS_TASKS],
  'CRM': [...MARKETING_TASKS, ...OPERATIONS_TASKS],
  'Front_Office': [...GENERIC_TASKS, ...OPERATIONS_TASKS],
  'Healthcare_dept': [...LEGAL_TASKS, ...OPERATIONS_TASKS],
  'Hospitality': [...OPERATIONS_TASKS, ...MARKETING_TASKS]
};

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Completed', 'CarriedOut', 'NotStarted'];

const ACTIVITIES = [
  'Reviewed and analyzed documentation',
  'Conducted thorough research on the matter',
  'Prepared comprehensive report',
  'Attended client meeting and discussed requirements',
  'Completed administrative tasks and follow-ups',
  'Performed quality control checks',
  'Coordinated with team members on project deliverables',
  'Updated records and maintained documentation',
  'Provided consultation and expert advice',
  'Monitored progress and ensured compliance',
  'Executed planned activities and tasks',
  'Collaborated with stakeholders on key initiatives',
  'Analyzed data and prepared insights',
  'Facilitated communication between departments',
  'Managed resources and optimized workflow'
];

// ========== HELPER FUNCTIONS ==========
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function generateEmail(firstName, lastName, counter = null) {
  const first = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const last = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const suffix = counter ? counter : '';
  return `${first}.${last}${suffix}@aja.com`;
}

function generateDateInRange(daysBack) {
  const now = new Date();
  const randomDays = Math.floor(Math.random() * daysBack);
  const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function generateTimeBlock() {
  // Work hours: 08:00 - 18:00
  const startHour = randomInt(8, 17);
  const startMinute = randomItem([0, 15, 30, 45]);
  
  // Duration: 30 minutes to 4 hours
  const durationMinutes = randomItem([30, 45, 60, 90, 120, 150, 180, 240]);
  
  let endMinutes = startMinute + durationMinutes;
  let endHour = startHour + Math.floor(endMinutes / 60);
  endMinutes = endMinutes % 60;
  
  // Cap at 18:00
  if (endHour > 18 || (endHour === 18 && endMinutes > 0)) {
    endHour = 18;
    endMinutes = 0;
  }
  
  return {
    start: `${pad2(startHour)}:${pad2(startMinute)}:00`,
    end: `${pad2(endHour)}:${pad2(endMinutes)}:00`
  };
}

function generateClientFileNumber(counter) {
  const year = new Date().getFullYear();
  return `CFN-${year}-${String(counter).padStart(5, '0')}`;
}

function getTasksForDepartment(dept) {
  return TASK_MAP[dept] || GENERIC_TASKS;
}

function generateActivity(task, department) {
  const base = randomItem(ACTIVITIES);
  return `${base} related to ${task} in ${department} department`;
}

// ========== MAIN SEED FUNCTION ==========
async function seedLargeDataset() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aja_timesheet',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  console.log('🚀 Starting large dataset seeding...\n');

  try {
    // Step 1: Ensure departments exist
    console.log('📁 Creating departments...');
    for (const dept of DEPARTMENTS) {
      await connection.execute(
        `INSERT IGNORE INTO departments (name, description, is_active) VALUES (?, ?, true)`,
        [dept, `${dept} department - Auto-generated`]
      );
    }
    console.log(`✅ ${DEPARTMENTS.length} departments ensured\n`);

    // Step 2: Generate users
    console.log('👥 Generating users...');
    const users = [];
    const usedEmails = new Set(['admin@aja.com']);
    
    // Default password hash for 'admin123'
    const defaultHash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

    // Generate SUPERVISORS
    for (let i = 0; i < CONFIG.NUM_SUPERVISORS; i++) {
      const firstName = randomItem(FIRST_NAMES);
      const lastName = randomItem(LAST_NAMES);
      let email = generateEmail(firstName, lastName);
      let counter = 1;
      
      while (usedEmails.has(email)) {
        email = generateEmail(firstName, lastName, counter++);
      }
      usedEmails.add(email);
      
      const department = randomItem(DEPARTMENTS);
      
      await connection.execute(
        `INSERT INTO users (email, password, first_name, last_name, role, department, is_active) 
         VALUES (?, ?, ?, ?, 'SUPERVISOR', ?, true)
         ON DUPLICATE KEY UPDATE first_name = VALUES(first_name)`,
        [email, defaultHash, firstName, lastName, department]
      );
      
      users.push({ email, firstName, lastName, role: 'SUPERVISOR', department });
    }

    // Generate STAFF
    for (let i = 0; i < CONFIG.NUM_STAFF; i++) {
      const firstName = randomItem(FIRST_NAMES);
      const lastName = randomItem(LAST_NAMES);
      let email = generateEmail(firstName, lastName);
      let counter = 1;
      
      while (usedEmails.has(email)) {
        email = generateEmail(firstName, lastName, counter++);
      }
      usedEmails.add(email);
      
      const department = randomItem(DEPARTMENTS);
      
      await connection.execute(
        `INSERT INTO users (email, password, first_name, last_name, role, department, is_active) 
         VALUES (?, ?, ?, ?, 'STAFF', ?, true)
         ON DUPLICATE KEY UPDATE first_name = VALUES(first_name)`,
        [email, defaultHash, firstName, lastName, department]
      );
      
      users.push({ email, firstName, lastName, role: 'STAFF', department });
    }
    
    console.log(`✅ Created ${CONFIG.NUM_SUPERVISORS} supervisors`);
    console.log(`✅ Created ${CONFIG.NUM_STAFF} staff members`);
    console.log(`✅ Total: ${users.length} users (all with password: admin123)\n`);

    // Step 3: Get user IDs
    console.log('🔍 Fetching user IDs...');
    const [userRows] = await connection.execute(
      `SELECT id, email, department FROM users WHERE email IN (${users.map(() => '?').join(',')})`,
      users.map(u => u.email)
    );
    
    const emailToUserId = new Map(userRows.map(r => [r.email, { id: r.id, department: r.department }]));
    console.log(`✅ Mapped ${emailToUserId.size} user IDs\n`);

    // Step 4: Generate timesheet entries
    console.log('📊 Generating timesheet entries (this may take a while)...');
    let totalEntries = 0;
    let clientCounter = 1;
    let batchSize = 0;
    const batchLimit = 100;

    for (const user of users) {
      const userData = emailToUserId.get(user.email);
      if (!userData) continue;

      const numEntries = randomInt(CONFIG.ENTRIES_PER_USER_MIN, CONFIG.ENTRIES_PER_USER_MAX);
      const tasks = getTasksForDepartment(userData.department);

      for (let i = 0; i < numEntries; i++) {
        const date = generateDateInRange(CONFIG.DAYS_BACK);
        const { start, end } = generateTimeBlock();
        const task = randomItem(tasks);
        const activity = generateActivity(task, userData.department);
        const priority = randomItem(PRIORITIES);
        
        // Status distribution: 60% Completed, 25% CarriedOut, 15% NotStarted
        const rand = Math.random();
        const status = rand < 0.60 ? 'Completed' : 
                      rand < 0.85 ? 'CarriedOut' : 'NotStarted';
        
        const billable = Math.random() < 0.70; // 70% billable
        const clientFile = generateClientFileNumber(clientCounter++);
        
        const comments = Math.random() < 0.3 ? randomItem([
          'Task completed successfully',
          'Requires follow-up',
          'Client satisfied with outcome',
          'Additional time may be needed',
          'Coordinated with team members',
          'Documentation updated',
          'Quality standards met',
          'Urgent priority item',
          'Standard procedure followed',
          'Exceptional circumstances noted'
        ]) : null;

        await connection.execute(
          `INSERT INTO timesheet_entries 
           (user_id, date, client_file_number, department, task, activity, priority, start_time, end_time, status, billable, comments, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [userData.id, date, clientFile, userData.department, task, activity, priority, start, end, status, billable ? 1 : 0, comments]
        );

        totalEntries++;
        batchSize++;

        if (batchSize >= batchLimit) {
          process.stdout.write(`\r   Inserted ${totalEntries} entries...`);
          batchSize = 0;
        }
      }
    }

    console.log(`\n✅ Successfully inserted ${totalEntries} timesheet entries\n`);

    // Step 5: Summary statistics
    console.log('📈 Generating summary statistics...\n');
    
    const [deptStats] = await connection.execute(`
      SELECT 
        department,
        COUNT(*) as total_entries,
        ROUND(SUM(total_hours), 2) as total_hours,
        ROUND(AVG(total_hours), 2) as avg_hours,
        COUNT(CASE WHEN billable = 1 THEN 1 END) as billable_count
      FROM timesheet_entries
      GROUP BY department
      ORDER BY total_hours DESC
    `);

    console.log('📊 Department Statistics:');
    console.log('─'.repeat(80));
    console.log(sprintf('%-20s %12s %12s %12s %12s', 'Department', 'Entries', 'Total Hrs', 'Avg Hrs', 'Billable'));
    console.log('─'.repeat(80));
    for (const row of deptStats) {
      console.log(sprintf('%-20s %12d %12.2f %12.2f %12d',
        row.department,
        row.total_entries,
        row.total_hours,
        row.avg_hours,
        row.billable_count
      ));
    }
    console.log('─'.repeat(80));

    const [statusStats] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM timesheet_entries
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('\n📊 Status Distribution:');
    console.log('─'.repeat(40));
    for (const row of statusStats) {
      console.log(sprintf('%-20s %12d', row.status, row.count));
    }
    console.log('─'.repeat(40));

    console.log('\n🎉 SEEDING COMPLETED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log(`  • Users created: ${users.length} (${CONFIG.NUM_SUPERVISORS} supervisors, ${CONFIG.NUM_STAFF} staff)`);
    console.log(`  • Departments: ${DEPARTMENTS.length}`);
    console.log(`  • Timesheet entries: ${totalEntries}`);
    console.log(`  • Date range: Past ${CONFIG.DAYS_BACK} days`);
    console.log(`  • Default password: admin123`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

// Simple sprintf implementation for formatting
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

// Run the seeder
seedLargeDataset();

