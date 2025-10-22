const fs = require('fs');

console.log('🔧 Applying ULTIMATE CORS fix...');

// Create a completely new server.js with bulletproof CORS
const serverContent = `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'ajaco_timesheet',
  password: process.env.DB_PASSWORD || 'IyhpJL4+%Vl2P+k2',
  database: process.env.DB_NAME || 'ajaco_timesheet',
  port: process.env.DB_PORT || 3306
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Security middleware
app.use(helmet());

// BULLETPROOF CORS CONFIGURATION
const allowedOrigins = [
  'https://timesheet.aja.co.bw',
  'http://timesheet.aja.co.bw',
  'https://timesheetbackend.aja.co.bw',
  'http://timesheetbackend.aja.co.bw',
  'https://aja.khumo.co.bw',
  'http://aja.khumo.co.bw',
  'http://localhost:4200',
  'http://localhost:3000'
];

// CORS middleware with detailed logging
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('Request origin:', origin);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    console.log('CORS: Allowed origin:', origin);
  } else if (!origin) {
    // Allow requests with no origin (server-to-server, mobile apps)
    console.log('CORS: No origin, allowing request');
  } else {
    console.log('CORS: Blocked origin:', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Vary', 'Origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS: Handling preflight request');
    res.status(200).end();
    return;
  }
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'Enabled'
  });
});

// Import and use routes
const authRoutes = require('./routes/auth');
const timesheetRoutes = require('./routes/timesheet');
const analyticsRoutes = require('./routes/analytics');
const frontendAnalyticsRoutes = require('./routes/frontend-analytics');
const settingsRoutes = require('./routes/settings');
const departmentsRoutes = require('./routes/departments');
const usersRoutes = require('./routes/users');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/timesheet', timesheetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/frontend-analytics', frontendAnalyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/users', usersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(\`🚀 AJA Timesheet API server running on port \${PORT}\`);
  console.log(\`📊 Health check: http://localhost:\${PORT}/health\`);
  console.log(\`🌐 CORS enabled for: \${allowedOrigins.join(', ')}\`);
});

module.exports = app;
`;

// Write the new server.js
fs.writeFileSync('server-cors-fixed.js', serverContent);
console.log('✅ Created server-cors-fixed.js with bulletproof CORS');

// Create deployment instructions
const deploymentInstructions = `
# 🚀 ULTIMATE CORS FIX - Deployment Instructions

## ✅ **Files Created:**
- \`server-cors-fixed.js\` - New server with bulletproof CORS
- Enhanced logging for debugging

## 🔧 **CORS Configuration:**
- ✅ Allows: https://timesheet.aja.co.bw
- ✅ Allows: https://timesheetbackend.aja.co.bw
- ✅ Handles preflight requests explicitly
- ✅ Detailed logging for debugging
- ✅ Credentials support
- ✅ All HTTP methods supported

## 🚀 **Deployment Steps:**

### **1. Backup Current Server:**
\`\`\`bash
cp server.js server-backup.js
\`\`\`

### **2. Replace Server File:**
\`\`\`bash
cp server-cors-fixed.js server.js
\`\`\`

### **3. Restart Application:**
- Restart Node.js application in cPanel
- Check logs for CORS messages

### **4. Test:**
- Health: https://timesheetbackend.aja.co.bw/health
- Login: https://timesheetbackend.aja.co.bw/api/auth/login

## 🧪 **Testing Commands:**

### **Test CORS Preflight:**
\`\`\`bash
curl -X OPTIONS https://timesheetbackend.aja.co.bw/api/auth/login \\
  -H "Origin: https://timesheet.aja.co.bw" \\
  -H "Access-Control-Request-Method: POST" \\
  -H "Access-Control-Request-Headers: Content-Type" \\
  -v
\`\`\`

### **Test Login:**
\`\`\`bash
curl -X POST https://timesheetbackend.aja.co.bw/api/auth/login \\
  -H "Origin: https://timesheet.aja.co.bw" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@aja.com","password":"admin123"}' \\
  -v
\`\`\`

## 🔍 **Debugging:**
- Check server logs for CORS messages
- Look for "Request origin:" and "CORS:" messages
- Verify allowed origins in logs

## ✅ **Expected Result:**
- No CORS errors in browser
- Login functionality working
- All API calls successful
`;

fs.writeFileSync('ULTIMATE_CORS_DEPLOYMENT.md', deploymentInstructions);
console.log('✅ Created deployment instructions');

console.log('\n🎉 ULTIMATE CORS fix ready!');
console.log('\n📋 Next steps:');
console.log('1. Backup current server.js');
console.log('2. Replace with server-cors-fixed.js');
console.log('3. Restart Node.js application');
console.log('4. Test: https://timesheetbackend.aja.co.bw/health');
console.log('\n🔍 Check logs for CORS debugging messages!');

