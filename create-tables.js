const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function createTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'khumocob_aja',
    password: process.env.DB_PASSWORD || 'khumocob_aja',
    database: 'khumocob_aja',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔧 Creating database tables...');
    
    const sql = fs.readFileSync('./create-tables.sql', 'utf8');
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await connection.execute(command);
          console.log('✅ Executed:', command.substring(0, 50) + '...');
        } catch (error) {
          if (!error.message.includes('already exists') && !error.message.includes('Duplicate entry')) {
            console.error('Error executing command:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Tables created successfully!');
    console.log('\n👤 Default users created:');
    console.log('- Admin: admin@aja.com / admin123');
    console.log('- Supervisor: supervisor@aja.com / admin123');
    console.log('- Staff: staff@aja.com / admin123');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    await connection.end();
  }
}

createTables(); 