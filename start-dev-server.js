// Set development environment variables
process.env.NODE_ENV = 'development';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'aja_timesheet';
process.env.DB_PORT = '3306';
process.env.PORT = '3001';

console.log('🔧 Starting development server with correct database settings...');
console.log('Database:', process.env.DB_NAME);
console.log('User:', process.env.DB_USER);

// Start the server
require('./server.js');
