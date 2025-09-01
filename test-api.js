const axios = require('axios');

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');

    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://aja.khumo.co.bw/backend/health');
    console.log('✅ Health check passed:', healthResponse.data.message, '\n');

    // Test 2: Login
    console.log('2. Testing login...');
    const loginResponse = await axios.post('http://aja.khumo.co.bw/backend/api/auth/login', {
      email: 'staff@aja.com',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received\n');

    // Test 3: Get timesheet entries (should be empty initially)
    console.log('3. Testing GET /api/timesheet/entries...');
    const getResponse = await axios.get('http://aja.khumo.co.bw/backend/api/timesheet/entries', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ GET entries response:', getResponse.data);
    console.log('Entries count:', getResponse.data.entries.length, '\n');

    // Test 4: Create a timesheet entry
    console.log('4. Testing POST /api/timesheet/entries...');
    const newEntry = {
      date: '2024-08-02',
      client_file_number: 'TEST-001',
      department: 'Legal',
      task: 'Contract Review',
      activity: 'Testing API functionality',
      priority: 'Medium',
      start_time: '09:00',
      end_time: '10:30',
      status: 'Pending',
      billable: true,
      comments: 'Test entry from API'
    };

    const createResponse = await axios.post('http://aja.khumo.co.bw/backend/api/timesheet/entries', newEntry, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ POST entry response:', createResponse.data, '\n');

    // Test 5: Get entries again to verify it was saved
    console.log('5. Verifying entry was saved...');
    const verifyResponse = await axios.get('http://aja.khumo.co.bw/backend/api/timesheet/entries', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Verification response:', verifyResponse.data);
    console.log('Total entries now:', verifyResponse.data.entries.length);

    if (verifyResponse.data.entries.length > 0) {
      console.log('✅ Entry was successfully saved to database!');
    } else {
      console.log('❌ Entry was not saved to database');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testAPI(); 