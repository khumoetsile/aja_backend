const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🔍 Debugging CORS Configuration...\n');

console.log('📋 Current Environment Variables:');
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);

console.log('\n🔧 CORS Configuration:');
const corsOrigin = process.env.FRONTEND_URL || 'https://aja.khumo.co.bw';
console.log(`Origin: ${corsOrigin}`);

console.log('\n🚀 Testing CORS Setup...');

const app = express();

// Test CORS configuration
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.get('/test-cors', (req, res) => {
  console.log('✅ CORS test endpoint hit');
  console.log(`Request Origin: ${req.headers.origin}`);
  console.log(`Allowed Origin: ${corsOrigin}`);
  
  res.json({ 
    message: 'CORS test successful',
    allowedOrigin: corsOrigin,
    requestOrigin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

app.listen(3001, () => {
  console.log('🔍 Debug server running on port 3001');
  console.log('📊 Test URL: http://localhost:3001/test-cors');
  console.log('\n💡 To test from your frontend:');
  console.log('fetch("http://localhost:3001/test-cors")');
}); 