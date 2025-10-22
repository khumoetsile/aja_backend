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
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  keepAliveInitialDelay: 0,
  enableKeepAlive: true
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

// Enhanced query function with retry logic
const query = async (sql, params) => {
  let retries = 3;
  while (retries > 0) {
    try {
      const [rows] = await pool.execute(sql, params);
      return [rows];
    } catch (error) {
      console.error(`Database query error (${retries} retries left):`, error.message);
      if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
        retries--;
        if (retries > 0) {
          console.log('Retrying database connection...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
      throw error;
    }
  }
};

module.exports = {
  query,
  pool
}; 