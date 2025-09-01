const { pool, query } = require('./config/database');

async function main() {
  try {
    console.log('🔎 DB DEBUG START');
    const [ver] = await query('SELECT VERSION() as version, DATABASE() as db');
    console.log('✅ Connected. MySQL version:', ver[0].version, ' DB:', ver[0].db);

    const [tables] = await query('SHOW TABLES');
    console.log('📋 Tables:', tables.map(Object.values).flat());

    const [usersCount] = await query('SELECT COUNT(*) as cnt FROM users');
    console.log('👤 users count:', usersCount[0].cnt);

    const [oneUser] = await query('SELECT id, email, role, department FROM users LIMIT 3');
    console.log('👤 sample users:', oneUser);

  } catch (e) {
    console.error('❌ DB error:', e && e.message ? e.message : e);
  } finally {
    try { await pool.end(); } catch(_) {}
  }
}

main();

