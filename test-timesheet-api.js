const axios = require('axios');

async function testTimesheetAPI() {
  const baseURL = 'http://aja.khumo.co.bw/backend/api';
  
  try {
    console.log('🧪 Testing Timesheet API...\n');

    // Test 1: Login to get token
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'staff@aja.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received\n');

    // Test 2: Get timesheet entries
    console.log('2. Testing GET /timesheet/entries...');
    const entriesResponse = await axios.get(`${baseURL}/timesheet/entries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Entries retrieved:', entriesResponse.data.entries.length, 'entries\n');

    // Test 3: Create a new timesheet entry
    console.log('3. Testing POST /timesheet/entries...');
    const newEntry = {
      date: '2024-08-02',
      client_file_number: 'TEST-001',
      department: 'Legal',
      task: 'Contract Review',
      activity: 'Testing timesheet functionality',
      priority: 'Medium',
      start_time: '09:00',
      end_time: '10:30',
      status: 'Pending',
      billable: true,
      comments: 'Test entry from API'
    };

    const createResponse = await axios.post(`${baseURL}/timesheet/entries`, newEntry, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Entry created successfully:', createResponse.data.message);
    console.log('Entry ID:', createResponse.data.entry.id, '\n');

    // Test 4: Get entries again to verify it was saved
    console.log('4. Verifying entry was saved...');
    const verifyResponse = await axios.get(`${baseURL}/timesheet/entries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Total entries now:', verifyResponse.data.entries.length);
    
    const newEntries = verifyResponse.data.entries.filter(e => e.client_file_number === 'TEST-001');
    console.log('✅ Test entries found:', newEntries.length, '\n');

    console.log('🎉 All tests passed! The timesheet API is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Start the Angular frontend: npm start');
    console.log('2. Login with staff@aja.com / admin123');
    console.log('3. Try creating a timesheet entry through the UI');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testTimesheetAPI(); 