const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aja_timesheet',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️  Server will start without database connection');
    console.log('💡 To fix: Start MySQL and create database "aja_timesheet"');
    return false;
  }
};

// Only test connection in production or when explicitly requested
if (process.env.NODE_ENV === 'production') {
  testConnection();
}

// Export allowed origins helper for visibility if needed elsewhere
const allowedOrigins = [
  'http://aja.khumo.co.bw',
  'https://aja.khumo.co.bw',
  process.env.FRONTEND_URL,
  'http://localhost:4200'
].filter(Boolean);

module.exports = {
  query: (sql, params) => pool.execute(sql, params),
  pool
}; 