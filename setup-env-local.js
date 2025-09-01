const fs = require('fs');
const path = require('path');

// Environment configuration for local development
const envConfig = `# AJA Timesheet Backend Environment Configuration (Local Development)

# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (Local MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aja_timesheet
DB_USER=root
DB_PASSWORD=

# JWT Configuration
JWT_SECRET=aja-timesheet-dev-jwt-key-2024

# Frontend URL (for CORS) - Local development
FRONTEND_URL=http://localhost:4200

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=debug
`;

try {
  // Write the .env file
  fs.writeFileSync(path.join(__dirname, '.env'), envConfig);
  console.log('✅ Local development environment file (.env) created successfully!');
  console.log('📋 Database configuration:');
  console.log('   - Database: aja_timesheet');
  console.log('   - User: root');
  console.log('   - Password: (empty - update as needed)');
  console.log('   - Host: localhost');
  console.log('   - Port: 3306');
  console.log('\n🚀 Next steps:');
  console.log('1. Make sure MySQL is running locally');
  console.log('2. Create database: CREATE DATABASE aja_timesheet;');
  console.log('3. Update DB_PASSWORD in .env if needed');
  console.log('4. Run: npm install');
  console.log('5. Run: node create-tables.js');
  console.log('6. Start server: npm start');
  console.log('7. Test: http://localhost:3001/health');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
} 