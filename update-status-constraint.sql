-- Update status constraint for timesheet_entries table
-- This script updates the status column to allow the new status values

-- First, drop the existing constraint
ALTER TABLE timesheet_entries 
DROP CONSTRAINT IF EXISTS timesheet_entries_chk_1;

-- Add the new constraint with updated status values
ALTER TABLE timesheet_entries 
ADD CONSTRAINT timesheet_entries_status_check 
CHECK (status IN ('Completed', 'CarriedOut', 'NotStarted'));

-- Update the default value
ALTER TABLE timesheet_entries 
ALTER COLUMN status SET DEFAULT 'NotStarted';

-- Update any existing records with old status values to new ones
UPDATE timesheet_entries SET status = 'Completed' WHERE status = 'Closed';
UPDATE timesheet_entries SET status = 'CarriedOut' WHERE status = 'In Progress';
UPDATE timesheet_entries SET status = 'NotStarted' WHERE status = 'Pending'; 