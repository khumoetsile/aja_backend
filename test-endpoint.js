const axios = require('axios');

async function testEndpoint() {
  try {
    console.log('🔐 Testing login...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@aja.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    console.log('\n📊 Testing dashboard-metrics endpoint...');
    const metricsResponse = await axios.get('http://localhost:3001/api/analytics/dashboard-metrics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Dashboard metrics endpoint working!');
    console.log('Response:', JSON.stringify(metricsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('\n🔍 404 Error - Route not found. Checking if analytics route is registered...');
      
      // Test if analytics route exists at all
      try {
        const testResponse = await axios.get('http://localhost:3001/api/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Analytics base route exists:', testResponse.status);
      } catch (analyticsError) {
        console.log('Analytics base route error:', analyticsError.response?.status);
      }
    }
  }
}

testEndpoint();
