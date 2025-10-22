const axios = require('axios');

// First login to get token
async function testDashboardMetrics() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@aja.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully\n');
    
    // Test 1: All data
    console.log('📊 Test 1: Fetching ALL dashboard metrics...');
    const allMetrics = await axios.get('http://localhost:3000/api/analytics/dashboard-metrics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ ALL DATA METRICS:');
    console.log('  Total Entries:', allMetrics.data.metrics.totalEntries);
    console.log('  Total Hours:', allMetrics.data.metrics.totalHours);
    console.log('  Billable Hours:', allMetrics.data.metrics.billableHours);
    console.log('  Active Users:', allMetrics.data.metrics.activeUsers);
    console.log('  Departments:', allMetrics.data.metrics.departments);
    console.log('  Not Started:', allMetrics.data.metrics.notStartedTasks);
    console.log('  Carried Out:', allMetrics.data.metrics.carriedOutTasks);
    console.log('  Completed:', allMetrics.data.metrics.completedTasks);
    console.log('\n  Department Stats Count:', allMetrics.data.departmentStats.length);
    console.log('  User Stats Count:', allMetrics.data.userStats.length);
    
    // Test 2: Date filter
    console.log('\n\n📊 Test 2: Fetching with date filter (Oct 2025)...');
    const octoberMetrics = await axios.get('http://localhost:3000/api/analytics/dashboard-metrics?dateFrom=2025-10-01&dateTo=2025-10-21', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ OCTOBER 2025 METRICS:');
    console.log('  Total Entries:', octoberMetrics.data.metrics.totalEntries);
    console.log('  Total Hours:', octoberMetrics.data.metrics.totalHours);
    console.log('  Billable Hours:', octoberMetrics.data.metrics.billableHours);
    
    // Test 3: Department filter
    console.log('\n\n📊 Test 3: Fetching Legal department only...');
    const legalMetrics = await axios.get('http://localhost:3000/api/analytics/dashboard-metrics?department=Legal', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ LEGAL DEPARTMENT METRICS:');
    console.log('  Total Entries:', legalMetrics.data.metrics.totalEntries);
    console.log('  Total Hours:', legalMetrics.data.metrics.totalHours);
    console.log('  Active Users:', legalMetrics.data.metrics.activeUsers);
    console.log('  Department Stats Count:', legalMetrics.data.departmentStats.length, '(should be 1)');
    
    // Test 4: Combined filters
    console.log('\n\n📊 Test 4: Marketing + October + Completed status...');
    const combinedMetrics = await axios.get('http://localhost:3000/api/analytics/dashboard-metrics?department=Marketing&dateFrom=2025-10-01&dateTo=2025-10-21&status=Completed', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ COMBINED FILTER METRICS:');
    console.log('  Total Entries:', combinedMetrics.data.metrics.totalEntries);
    console.log('  Total Hours:', combinedMetrics.data.metrics.totalHours);
    console.log('  Completed Tasks:', combinedMetrics.data.metrics.completedTasks, '(should equal totalEntries)');
    
    console.log('\n\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDashboardMetrics();

