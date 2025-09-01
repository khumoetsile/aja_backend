const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Environment variables:');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***hidden***' : 'NOT SET');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    
    console.log('✅ Connected to MySQL server successfully!');
    
    // Test if database exists
    try {
      await connection.execute(`USE ${process.env.DB_NAME}`);
      console.log(`✅ Database '${process.env.DB_NAME}' exists and accessible!`);
    } catch (error) {
      console.log(`❌ Database '${process.env.DB_NAME}' does not exist or not accessible:`, error.message);
      console.log('💡 You may need to create the database first.');
    }
    
    await connection.end();
  } catch (error) {
    console.log('❌ Failed to connect to MySQL:', error.message);
    console.log('\n💡 Common solutions:');
    console.log('1. Check if MySQL server is running');
    console.log('2. Verify username and password in .env file');
    console.log('3. Make sure the user has proper permissions');
    console.log('4. Try connecting without password (empty string)');
  }
}

testConnection().then(() => {
  console.log('\n🏁 Test completed.');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});


