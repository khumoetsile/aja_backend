const mysql = require('mysql2/promise');
require('dotenv').config();

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function generateClientFileNumber(index) {
  const year = new Date().getFullYear();
  const sequence = String(index).padStart(4, '0');
  return `CFN-${year}-${sequence}`;
}

function generateRandomDateWithinDays(daysBack) {
  const now = new Date();
  const past = new Date(now.getTime() - Math.floor(Math.random() * daysBack) * 24 * 60 * 60 * 1000);
  // Ensure we return YYYY-MM-DD
  return `${past.getFullYear()}-${pad2(past.getMonth() + 1)}-${pad2(past.getDate())}`;
}

function generateRandomTimeBlock() {
  // Workday 08:00 - 18:00. Durations 0.5h to 3h in 0.25h steps
  const startHour = 8 + Math.floor(Math.random() * 10); // 8..17
  const minuteSlots = [0, 15, 30, 45];
  const startMinute = randomItem(minuteSlots);
  const durationsInMinutes = [30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
  const duration = randomItem(durationsInMinutes);

  let endHour = startHour;
  let endMinute = startMinute + duration;
  endHour += Math.floor(endMinute / 60);
  endMinute = endMinute % 60;

  // Clamp to 18:00
  if (endHour > 18 || (endHour === 18 && endMinute > 0)) {
    endHour = 18;
    endMinute = 0;
  }

  return {
    start: `${pad2(startHour)}:${pad2(startMinute)}:00`,
    end: `${pad2(endHour)}:${pad2(endMinute)}:00`
  };
}

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aja_timesheet',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  try {
    console.log('🔗 Connected to database');

    // Ensure status constraint matches front-end statuses (best-effort, ignore errors on older MySQL)
    try {
      await connection.execute(`ALTER TABLE timesheet_entries DROP CONSTRAINT IF EXISTS timesheet_entries_chk_1`);
    } catch (_) {}
    try {
      await connection.execute(`ALTER TABLE timesheet_entries DROP CONSTRAINT IF EXISTS timesheet_entries_status_check`);
    } catch (_) {}
    try {
      await connection.execute(`ALTER TABLE timesheet_entries ADD CONSTRAINT timesheet_entries_status_check CHECK (status IN ('Completed','CarriedOut','NotStarted'))`);
    } catch (e) {
      // MySQL <8.0.16 may ignore CHECK or throw; it's safe to continue
    }

    // Ensure departments exist (idempotent)
    const departmentNames = [
      'Legal',
      'Finance',
      'IT',
      'HR',
      'Sales',
      'Marketing',
      'Operations',
      'Support'
    ];

    for (const dept of departmentNames) {
      await connection.execute(
        `INSERT IGNORE INTO departments (name, description) VALUES (?, ?)`,
        [dept, `${dept} department`]
      );
    }

    // Seed demo users (idempotent on unique email)
    const demoUsers = [
      // Admins
      { email: 'admin@aja.com', first_name: 'Admin', last_name: 'User', role: 'ADMIN', department: 'Operations' },
      // Supervisors
      { email: 'supervisor.legal@aja.com', first_name: 'Lebo', last_name: 'Molefe', role: 'SUPERVISOR', department: 'Legal' },
      { email: 'supervisor.it@aja.com', first_name: 'Neo', last_name: 'Dube', role: 'SUPERVISOR', department: 'IT' },
      // Staff
      { email: 'jane.legal@aja.com', first_name: 'Jane', last_name: 'Staff', role: 'STAFF', department: 'Legal' },
      { email: 'peter.it@aja.com', first_name: 'Peter', last_name: 'Khoza', role: 'STAFF', department: 'IT' },
      { email: 'thato.hr@aja.com', first_name: 'Thato', last_name: 'Gare', role: 'STAFF', department: 'HR' },
      { email: 'dineo.finance@aja.com', first_name: 'Dineo', last_name: 'Moyo', role: 'STAFF', department: 'Finance' },
      { email: 'kagiso.ops@aja.com', first_name: 'Kagiso', last_name: 'Ndlovu', role: 'STAFF', department: 'Operations' },
      { email: 'amina.support@aja.com', first_name: 'Amina', last_name: 'Hassan', role: 'STAFF', department: 'Support' },
    ];

    // Default password: admin123 (bcrypt hash reused from schema.sql)
    const defaultHash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

    for (const user of demoUsers) {
      await connection.execute(
        `INSERT INTO users (email, password, first_name, last_name, role, department, is_active)
         VALUES (?, ?, ?, ?, ?, ?, true)
         ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), role = VALUES(role), department = VALUES(department), is_active = VALUES(is_active)`,
        [user.email, defaultHash, user.first_name, user.last_name, user.role, user.department]
      );
    }

    // Map email -> id for inserting timesheet entries
    const [rows] = await connection.execute(`SELECT id, email, department FROM users WHERE email IN (${demoUsers.map(() => '?').join(',')})`, demoUsers.map(u => u.email));
    const emailToUser = new Map(rows.map(r => [r.email, { id: r.id, department: r.department }]));

    // Build a pool of tasks per department (fallback to generic ones)
    const departmentToTasks = new Map();
    const [taskRows] = await connection.execute(`
      SELECT d.name AS department, t.name AS task
      FROM tasks t JOIN departments d ON d.id = t.department_id
      WHERE t.is_active = true
    `);
    for (const row of taskRows) {
      if (!departmentToTasks.has(row.department)) {
        departmentToTasks.set(row.department, []);
      }
      departmentToTasks.get(row.department).push(row.task);
    }

    function pickTask(dept) {
      const list = departmentToTasks.get(dept);
      if (list && list.length > 0) return randomItem(list);
      return 'General Task';
    }

    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const statuses = ['Completed', 'CarriedOut', 'NotStarted'];

    // Target users for entries = staff only
    const staffEmails = demoUsers.filter(u => u.role === 'STAFF').map(u => u.email);

    let entriesInserted = 0;
    let clientCounter = 1;

    for (const email of staffEmails) {
      const user = emailToUser.get(email);
      if (!user) continue;

      // Generate 20-40 entries within past 45 days
      const numEntries = 20 + Math.floor(Math.random() * 21);
      for (let i = 0; i < numEntries; i++) {
        const date = generateRandomDateWithinDays(45);
        const { start, end } = generateRandomTimeBlock();
        const clientFile = generateClientFileNumber(clientCounter++);
        const task = pickTask(user.department);
        const activity = `Worked on ${task.toLowerCase()} for ${user.department}`;
        const priority = randomItem(priorities);
        const statusDistribution = Math.random();
        const status = statusDistribution < 0.6 ? 'Completed' : statusDistribution < 0.85 ? 'CarriedOut' : 'NotStarted';
        const billable = Math.random() < 0.75; // 75% billable

        await connection.execute(
          `INSERT INTO timesheet_entries
           (user_id, date, client_file_number, department, task, activity, priority, start_time, end_time, status, billable, comments, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [user.id, date, clientFile, user.department, task, activity, priority, start, end, status, billable ? 1 : 0, 'Seeded demo data']
        );

        entriesInserted++;
      }
    }

    console.log(`✅ Seed complete: ${demoUsers.length} users ensured, ${entriesInserted} timesheet entries inserted.`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  } finally {
    try { await connection.end(); } catch (_) {}
  }
}

seed();

