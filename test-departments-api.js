const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Test script for the departments API endpoint
async function testDepartmentsAPI() {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3001';
  const testData = {
    departments: [
      {
        name: "Test Department",
        description: "A test department for API testing",
        is_active: true,
        tasks: [
          {
            name: "Test Task 1",
            description: "First test task",
            is_active: true
          },
          {
            name: "Test Task 2", 
            description: "Second test task",
            is_active: true
          }
        ]
      }
    ]
  };

  try {
    console.log('🧪 Testing Departments API Endpoint');
    console.log('====================================\n');

    // First, let's try to authenticate (you'll need to replace with actual credentials)
    console.log('🔐 Attempting authentication...');
    
    // For testing purposes, you might want to create a test user first
    // or use existing admin credentials
    const authResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@aja.com', // Replace with actual admin email
      password: 'admin123'    // Replace with actual admin password
    });

    const token = authResponse.data.token;
    console.log('✅ Authentication successful');

    // Test 1: Get all departments
    console.log('\n📋 Test 1: Getting all departments');
    try {
      const getResponse = await axios.get(`${baseURL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Retrieved ${getResponse.data.departments.length} departments`);
      console.log(`📊 Total tasks: ${getResponse.data.total_tasks}`);
    } catch (error) {
      console.log('❌ Error getting departments:', error.response?.data || error.message);
    }

    // Test 2: Bulk upload departments
    console.log('\n📤 Test 2: Bulk uploading departments');
    try {
      const uploadResponse = await axios.post(`${baseURL}/api/departments/bulk-upload`, testData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Bulk upload successful');
      console.log(`📊 Results:`, uploadResponse.data.results);
    } catch (error) {
      console.log('❌ Error in bulk upload:', error.response?.data || error.message);
    }

    // Test 3: Get departments again to verify
    console.log('\n📋 Test 3: Verifying upload by getting departments again');
    try {
      const verifyResponse = await axios.get(`${baseURL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ Retrieved ${verifyResponse.data.departments.length} departments after upload`);
      
      // Find our test department
      const testDept = verifyResponse.data.departments.find(dept => dept.name === 'Test Department');
      if (testDept) {
        console.log(`✅ Test department found with ${testDept.tasks.length} tasks`);
      } else {
        console.log('⚠️  Test department not found');
      }
    } catch (error) {
      console.log('❌ Error verifying upload:', error.response?.data || error.message);
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure you have valid admin credentials');
      console.log('   You can create a test user or use existing admin credentials');
    }
  }
}

// Function to test with your actual JSON data
async function testWithRealData() {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3001';
  
  try {
    // Load your actual departments data
    const departmentsData = JSON.parse(fs.readFileSync('departments_tasks_from_E1_P1.json', 'utf8'));
    
    console.log('🧪 Testing with Real Departments Data');
    console.log('====================================\n');
    console.log(`📊 Loaded ${departmentsData.departments.length} departments from file`);

    // Authenticate
    const authResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@aja.com',
      password: 'admin123'
    });

    const token = authResponse.data.token;
    console.log('✅ Authentication successful');

    // Upload the real data
    console.log('\n📤 Uploading real departments data...');
    const uploadResponse = await axios.post(`${baseURL}/api/departments/bulk-upload`, departmentsData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Real data upload completed');
    console.log('📊 Results:', uploadResponse.data.results);

  } catch (error) {
    console.error('❌ Real data test failed:', error.response?.data || error.message);
  }
}

// CLI interface
async function main() {
  const testType = process.argv[2] || 'basic';
  
  if (testType === 'real') {
    await testWithRealData();
  } else {
    await testDepartmentsAPI();
  }
}

if (require.main === module) {
  main();
}

module.exports = { testDepartmentsAPI, testWithRealData };
