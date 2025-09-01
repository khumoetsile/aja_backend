-- Create custom_reports table for analytics system
CREATE TABLE IF NOT EXISTS custom_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  filters JSON,
  columns JSON,
  schedule ENUM('manual', 'daily', 'weekly', 'monthly', 'quarterly') DEFAULT 'manual',
  recipients JSON,
  user_id INT NOT NULL,
  department VARCHAR(100),
  last_run DATETIME,
  next_run DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_department (department),
  INDEX idx_schedule (schedule),
  INDEX idx_created_at (created_at)
);

-- Insert sample custom report for testing
INSERT INTO custom_reports (name, description, filters, columns, schedule, recipients, user_id, department) VALUES (
  'Weekly Department Summary',
  'Weekly summary of department performance metrics',
  '{"dateRange": "weekly", "department": "all"}',
  '["department", "totalHours", "complianceRate", "userCount"]',
  'weekly',
  '["admin@company.com"]',
  1,
  'IT'
);
