const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const timesheetRoutes = require('./routes/timesheet');
const analyticsRoutes = require('./routes/analytics');
const frontendAnalyticsRoutes = require('./routes/frontend-analytics');
const settingsRoutes = require('./routes/settings');
const departmentsRoutes = require('./routes/departments');
const usersRoutes = require('./routes/users');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);

// CRITICAL: Disable helmet for CORS to work properly
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// ULTIMATE CORS FIX - This MUST work!
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  console.log('=== CORS DEBUG ===');
  console.log('Origin:', origin);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  // Always set CORS headers for ANY origin (temporary fix to diagnose)
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-HTTP-Method-Override');
  res.setHeader('Access-Control-Expose-Headers', 'Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
  
  console.log('✅ CORS headers set for:', origin || 'no-origin');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling preflight OPTIONS request');
    res.status(204).end();
    return;
  }
  
  next();
});

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running with CORS enabled',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'FULLY ENABLED FOR ALL ORIGINS'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/timesheet', authenticateToken, timesheetRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/frontend-analytics', authenticateToken, frontendAnalyticsRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/departments', authenticateToken, departmentsRoutes);
app.use('/api/users', authenticateToken, usersRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS: FULLY ENABLED FOR ALL ORIGINS`);
});

module.exports = app;


