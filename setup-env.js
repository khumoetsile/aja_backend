const fs = require('fs');
const path = require('path');

// Environment configuration for hosted backend
const envConfig = `# AJA Timesheet Backend Environment Configuration

# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=khumocob_aja
DB_USER=khumocob_aja
DB_PASSWORD=khumocob_aja

# JWT Configuration
JWT_SECRET=aja-timesheet-super-secret-jwt-key-2024

# Frontend URL (for CORS)
FRONTEND_URL=http://aja.khumo.co.bw

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
`;

try {
  // Write the .env file
  fs.writeFileSync(path.join(__dirname, '.env'), envConfig);
  console.log('✅ Environment file (.env) created successfully!');
  console.log('📋 Database configuration:');
  console.log('   - Database: khumocob_aja');
  console.log('   - User: khumocob_aja');
  console.log('   - Password: khumocob_aja');
  console.log('   - Host: localhost');
  console.log('   - Port: 3306');
  console.log('\n🚀 Next steps:');
  console.log('1. Upload this .env file to your server');
  console.log('2. Restart your Node.js application');
  console.log('3. Test the connection with: node test-api.js');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
} 