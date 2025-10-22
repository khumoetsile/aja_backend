const https = require('https');

console.log('🧪 Testing CORS configuration...');

// Test function
function testCORS() {
  const options = {
    hostname: 'timesheetbackend.aja.co.bw',
    port: 443,
    path: '/health',
    method: 'GET',
    headers: {
      'Origin': 'https://timesheet.aja.co.bw',
      'User-Agent': 'CORS-Test-Script'
    }
  };

  const req = https.request(options, (res) => {
    console.log('✅ Status:', res.statusCode);
    console.log('✅ Headers:');
    console.log('  - Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
    console.log('  - Access-Control-Allow-Credentials:', res.headers['access-control-allow-credentials']);
    console.log('  - Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
    console.log('  - Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Response:', data);
      
      if (res.headers['access-control-allow-origin']) {
        console.log('🎉 CORS is working!');
      } else {
        console.log('❌ CORS headers missing!');
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Error:', e.message);
  });

  req.end();
}

// Test preflight request
function testPreflight() {
  const options = {
    hostname: 'timesheetbackend.aja.co.bw',
    port: 443,
    path: '/api/auth/login',
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://timesheet.aja.co.bw',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  };

  const req = https.request(options, (res) => {
    console.log('\n🔍 Preflight Test:');
    console.log('✅ Status:', res.statusCode);
    console.log('✅ CORS Headers:');
    console.log('  - Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
    console.log('  - Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
    console.log('  - Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
    
    if (res.statusCode === 200 && res.headers['access-control-allow-origin']) {
      console.log('🎉 Preflight CORS is working!');
    } else {
      console.log('❌ Preflight CORS failed!');
    }
  });

  req.on('error', (e) => {
    console.error('❌ Preflight Error:', e.message);
  });

  req.end();
}

console.log('Testing CORS for: https://timesheet.aja.co.bw → https://timesheetbackend.aja.co.bw');
testCORS();

setTimeout(() => {
  testPreflight();
}, 2000);

