const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing backend for cPanel deployment...');

// Copy production environment variables
const productionEnv = `
# Production Environment Variables for cPanel
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_USER=ajaco_timesheet
DB_PASSWORD=IyhpJL4+%Vl2P+k2
DB_NAME=ajaco_timesheet
DB_PORT=3306

# Email Configuration
EMAIL_HOST=mail.khumo.co.bw
EMAIL_PORT=465
EMAIL_USER=development@khumo.co.bw
EMAIL_PASS=x}@j@{qVQ2$Eg6+.

# CORS Configuration
FRONTEND_URL=https://timesheet.aja.co.bw
BACKEND_BASE=https://timesheetbackend.aja.co.bw
`;

// Write .env file for production
fs.writeFileSync('.env', productionEnv);
console.log('✅ Created .env file with production settings');

// Create package.json production script
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts.start = 'node server.js';
packageJson.scripts.prod = 'NODE_ENV=production node server.js';

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with production scripts');

// Create deployment instructions
const deploymentInstructions = `
# cPanel Deployment Instructions

## 1. Upload Files
Upload all backend files to your cPanel Node.js application root directory.

## 2. Install Dependencies
Run in cPanel terminal:
\`\`\`bash
npm install
\`\`\`

## 3. Environment Variables
The following environment variables are already configured in .env:
- NODE_ENV=production
- DB_HOST=localhost
- DB_USER=ajaco_timesheet
- DB_PASSWORD=IyhpJL4+%Vl2P+k2
- DB_NAME=ajaco_timesheet
- DB_PORT=3306

## 4. Database Setup
1. Create database: ajaco_timesheet
2. Create user: ajaco_timesheet
3. Grant privileges to user on database
4. Run database schema: node create-tables.js

## 5. Start Application
Set startup file to: server.js
Application will start automatically.

## 6. Test Endpoints
- Health check: https://timesheetbackend.aja.co.bw/api/health
- Login: https://timesheetbackend.aja.co.bw/api/auth/login

## 7. CORS Configuration
Frontend URL: https://timesheet.aja.co.bw
Backend URL: https://timesheetbackend.aja.co.bw
`;

fs.writeFileSync('DEPLOYMENT_INSTRUCTIONS.md', deploymentInstructions);
console.log('✅ Created deployment instructions');

console.log('\n🎉 Backend is ready for cPanel deployment!');
console.log('\n📋 Next steps:');
console.log('1. Upload all files to cPanel Node.js app root');
console.log('2. Set startup file to: server.js');
console.log('3. Add environment variables in cPanel');
console.log('4. Run: npm install');
console.log('5. Start the application');

