const { query } = require('./config/database');

async function updateStatusConstraint() {
  try {
    console.log('Updating status constraint...');
    
    // Try to drop existing constraint (ignore errors if it doesn't exist)
    try {
      await query('ALTER TABLE timesheet_entries DROP CONSTRAINT timesheet_entries_chk_1');
      console.log('Dropped existing constraint');
    } catch (error) {
      console.log('No existing constraint to drop or different constraint name');
    }
    
    // Add new constraint
    await query(`
      ALTER TABLE timesheet_entries 
      ADD CONSTRAINT timesheet_entries_status_check 
      CHECK (status IN ('Completed', 'CarriedOut', 'NotStarted'))
    `);
    console.log('Added new constraint');
    
    // Update default value
    await query(`
      ALTER TABLE timesheet_entries 
      ALTER COLUMN status SET DEFAULT 'NotStarted'
    `);
    console.log('Updated default value');
    
    // Update existing records
    const [updateResult] = await query(`
      UPDATE timesheet_entries 
      SET status = CASE 
        WHEN status = 'Closed' THEN 'Completed'
        WHEN status = 'In Progress' THEN 'CarriedOut'
        WHEN status = 'Pending' THEN 'NotStarted'
        ELSE status
      END
    `);
    console.log('Updated existing records:', updateResult);
    
    console.log('Database constraint updated successfully!');
    
  } catch (error) {
    console.error('Error updating constraint:', error);
  } finally {
    process.exit(0);
  }
}

updateStatusConstraint(); 