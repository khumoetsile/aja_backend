const bcrypt = require('bcryptjs');
const { query, pool } = require('./config/database');

async function setPassword(email, plainPassword) {
  try {
    if (!email || !plainPassword) {
      console.error('Usage: node set-user-password.js <email> <password>');
      process.exit(1);
    }
    const saltRounds = 12;
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    await query('UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?', [hash, email]);
    console.log(`✅ Password updated for ${email}`);
  } catch (e) {
    console.error('❌ Failed to update password:', e.message);
    process.exit(1);
  } finally {
    try { await pool.end(); } catch (_) {}
  }
}

const [,, email, pwd] = process.argv;
setPassword(email, pwd);


