const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  // First connect without database to create it if needed
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'khumocob_aja',
    password: process.env.DB_PASSWORD || 'khumocob_aja',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔧 Setting up AJA Timesheet Database...');
    
    // Check if database exists
    const [databases] = await connection.execute(
      "SHOW DATABASES LIKE 'khumocob_aja'"
    );
    
    if (databases.length === 0) {
      console.log('📦 Creating database...');
      await connection.execute('CREATE DATABASE khumocob_aja');
      console.log('✅ Database created successfully');
    } else {
      console.log('✅ Database already exists');
    }
    
    await connection.end();
    
    // Connect to the new database and run schema
    const appConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'khumocob_aja',
      password: process.env.DB_PASSWORD || 'khumocob_aja',
      database: 'khumocob_aja',
      port: process.env.DB_PORT || 3306,
    });
    
    console.log('📋 Running database schema...');
    const fs = require('fs');
    const schema = fs.readFileSync('./database/schema.sql', 'utf8');
    
    // Split and execute schema commands (handle MySQL DELIMITER)
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await appConnection.execute(command);
        } catch (error) {
          if (!error.message.includes('already exists') && !error.message.includes('Duplicate key name')) {
            console.error('Error executing command:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Database schema applied successfully');
    await appConnection.end();
    
    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Update .env file with your MySQL credentials');
    console.log('2. Run: npm install');
    console.log('3. Run: npm run dev');
    console.log('\n👤 Default users:');
    console.log('- Admin: admin@aja.com / admin123');
    console.log('- Supervisor: supervisor@aja.com / admin123');
    console.log('- Staff: staff@aja.com / admin123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase(); 