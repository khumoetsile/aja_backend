-- AJA Law Firm Timesheet Database Schema (MySQL)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SUPERVISOR', 'STAFF')),
    department VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create timesheet_entries table
CREATE TABLE IF NOT EXISTS timesheet_entries (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    client_file_number VARCHAR(50),
    department VARCHAR(100) NOT NULL,
    task VARCHAR(200) NOT NULL,
    activity TEXT,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours DECIMAL(5,2) GENERATED ALWAYS AS (
        TIMESTAMPDIFF(MINUTE, start_time, end_time) / 60
    ) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Closed')),
    billable BOOLEAN DEFAULT true,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create departments table for reference
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table for department-specific tasks
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- Insert default departments
INSERT INTO departments (name, description) VALUES
('Legal', 'Legal department handling court cases and legal advice'),
('Finance', 'Financial management and accounting'),
('IT', 'Information Technology and system support'),
('HR', 'Human Resources and personnel management'),
('Sales', 'Sales and business development'),
('Marketing', 'Marketing and business development'),
('Operations', 'General operations and administration'),
('Support', 'Customer support and service'),
('IT Security', 'IT Security and cybersecurity'),
('Admin', 'Administrative services'),
('R&D', 'Research and Development'),
('Procurement', 'Procurement and supply chain');

-- Insert default tasks for each department
INSERT INTO tasks (department_id, name, description) VALUES
-- IT Department Tasks
((SELECT id FROM departments WHERE name = 'IT'), 'Setup server', 'Configure and deploy new server infrastructure'),
((SELECT id FROM departments WHERE name = 'IT'), 'Deploy application', 'Deploy software applications to production'),
((SELECT id FROM departments WHERE name = 'IT'), 'Configure firewall', 'Set up and configure network security'),
((SELECT id FROM departments WHERE name = 'IT'), 'Manage backups', 'Perform system backups and recovery procedures'),

-- HR Department Tasks
((SELECT id FROM departments WHERE name = 'HR'), 'Onboard employee', 'New employee onboarding and orientation'),
((SELECT id FROM departments WHERE name = 'HR'), 'Process payroll', 'Payroll processing and administration'),
((SELECT id FROM departments WHERE name = 'HR'), 'Conduct exit interviews', 'Employee exit interview procedures'),
((SELECT id FROM departments WHERE name = 'HR'), 'Update policies', 'HR policy updates and documentation'),

-- Finance Department Tasks
((SELECT id FROM departments WHERE name = 'Finance'), 'Prepare invoices', 'Invoice preparation and processing'),
((SELECT id FROM departments WHERE name = 'Finance'), 'Reconcile accounts', 'Account reconciliation and auditing'),
((SELECT id FROM departments WHERE name = 'Finance'), 'Budget forecasting', 'Financial planning and budget forecasting'),
((SELECT id FROM departments WHERE name = 'Finance'), 'Expense approvals', 'Expense review and approval process'),

-- Sales Department Tasks
((SELECT id FROM departments WHERE name = 'Sales'), 'Generate leads', 'Lead generation and prospecting'),
((SELECT id FROM departments WHERE name = 'Sales'), 'Prepare proposals', 'Sales proposal preparation'),
((SELECT id FROM departments WHERE name = 'Sales'), 'Client follow-up', 'Client relationship management'),
((SELECT id FROM departments WHERE name = 'Sales'), 'Close deals', 'Sales deal closure and contract signing'),

-- Marketing Department Tasks
((SELECT id FROM departments WHERE name = 'Marketing'), 'Campaign planning', 'Marketing campaign strategy and planning'),
((SELECT id FROM departments WHERE name = 'Marketing'), 'Content creation', 'Marketing content development'),
((SELECT id FROM departments WHERE name = 'Marketing'), 'Social media scheduling', 'Social media content management'),
((SELECT id FROM departments WHERE name = 'Marketing'), 'Performance analysis', 'Marketing performance analytics'),

-- Operations Department Tasks
((SELECT id FROM departments WHERE name = 'Operations'), 'Inventory check', 'Inventory management and auditing'),
((SELECT id FROM departments WHERE name = 'Operations'), 'Vendor coordination', 'Vendor relationship management'),
((SELECT id FROM departments WHERE name = 'Operations'), 'Logistics planning', 'Logistics and supply chain planning'),
((SELECT id FROM departments WHERE name = 'Operations'), 'Quality audits', 'Quality control and audit procedures'),

-- Support Department Tasks
((SELECT id FROM departments WHERE name = 'Support'), 'Ticket triage', 'Support ticket classification and routing'),
((SELECT id FROM departments WHERE name = 'Support'), 'Customer follow-up', 'Customer support follow-up procedures'),
((SELECT id FROM departments WHERE name = 'Support'), 'Issue escalation', 'Support issue escalation management'),
((SELECT id FROM departments WHERE name = 'Support'), 'Knowledge-base updates', 'Support documentation updates'),

-- Legal Department Tasks
((SELECT id FROM departments WHERE name = 'Legal'), 'Contract review', 'Legal contract review and analysis'),
((SELECT id FROM departments WHERE name = 'Legal'), 'Compliance audit', 'Legal compliance auditing'),
((SELECT id FROM departments WHERE name = 'Legal'), 'Policy drafting', 'Legal policy development'),
((SELECT id FROM departments WHERE name = 'Legal'), 'Risk assessment', 'Legal risk assessment and mitigation'),

-- IT Security Department Tasks
((SELECT id FROM departments WHERE name = 'IT Security'), 'Vulnerability scanning', 'Security vulnerability assessment'),
((SELECT id FROM departments WHERE name = 'IT Security'), 'Penetration testing', 'Security penetration testing'),
((SELECT id FROM departments WHERE name = 'IT Security'), 'Access reviews', 'User access review and management'),
((SELECT id FROM departments WHERE name = 'IT Security'), 'Security training', 'Security awareness training'),

-- Admin Department Tasks
((SELECT id FROM departments WHERE name = 'Admin'), 'Meeting scheduling', 'Meeting coordination and scheduling'),
((SELECT id FROM departments WHERE name = 'Admin'), 'Office supplies', 'Office supply management'),
((SELECT id FROM departments WHERE name = 'Admin'), 'Visitor reception', 'Visitor management and reception'),
((SELECT id FROM departments WHERE name = 'Admin'), 'Facility maintenance', 'Facility maintenance coordination'),

-- R&D Department Tasks
((SELECT id FROM departments WHERE name = 'R&D'), 'Prototype design', 'Product prototype development'),
((SELECT id FROM departments WHERE name = 'R&D'), 'Testing', 'Research and development testing'),
((SELECT id FROM departments WHERE name = 'R&D'), 'Documentation', 'R&D documentation and reporting'),
((SELECT id FROM departments WHERE name = 'R&D'), 'Patent filing', 'Patent application and filing'),

-- Procurement Department Tasks
((SELECT id FROM departments WHERE name = 'Procurement'), 'RFQ issuance', 'Request for quotation preparation'),
((SELECT id FROM departments WHERE name = 'Procurement'), 'Bid evaluation', 'Vendor bid evaluation and analysis'),
((SELECT id FROM departments WHERE name = 'Procurement'), 'Purchase order', 'Purchase order processing'),
((SELECT id FROM departments WHERE name = 'Procurement'), 'Supplier onboarding', 'New supplier onboarding process');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_timesheet_user_id ON timesheet_entries(user_id);
CREATE INDEX idx_timesheet_date ON timesheet_entries(date);
CREATE INDEX idx_timesheet_department ON timesheet_entries(department);
CREATE INDEX idx_timesheet_status ON timesheet_entries(status);
CREATE INDEX idx_timesheet_priority ON timesheet_entries(priority);

-- Insert default admin user (password: admin123)
-- Note: In production, change this password immediately
INSERT INTO users (email, password, first_name, last_name, role, department) VALUES
('admin@aja.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'ADMIN', 'Operations');

-- Insert sample users for testing
INSERT INTO users (email, password, first_name, last_name, role, department) VALUES
('supervisor@aja.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Supervisor', 'SUPERVISOR', 'Legal'),
('staff@aja.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Staff', 'STAFF', 'Legal');

-- Create views for analytics
CREATE OR REPLACE VIEW department_utilization AS
SELECT 
    department,
    COUNT(*) as total_entries,
    SUM(total_hours) as total_hours,
    AVG(total_hours) as avg_hours_per_entry,
    COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN billable = true THEN 1 END) as billable_entries,
    SUM(CASE WHEN billable = true THEN total_hours ELSE 0 END) as billable_hours
FROM timesheet_entries 
GROUP BY department;

CREATE OR REPLACE VIEW user_performance AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.department,
    u.role,
    COUNT(te.id) as total_entries,
    SUM(te.total_hours) as total_hours,
    AVG(te.total_hours) as avg_hours_per_entry,
    COUNT(CASE WHEN te.status = 'Completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN te.billable = true THEN 1 END) as billable_entries,
    SUM(CASE WHEN te.billable = true THEN te.total_hours ELSE 0 END) as billable_hours
FROM users u
LEFT JOIN timesheet_entries te ON u.id = te.user_id
WHERE u.is_active = true
GROUP BY u.id, u.first_name, u.last_name, u.department, u.role;

-- Create function to get monthly statistics
DELIMITER //
CREATE FUNCTION get_monthly_stats(year_param INT, month_param INT)
RETURNS TEXT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result TEXT DEFAULT '';
    DECLARE done INT DEFAULT FALSE;
    DECLARE dept_name VARCHAR(100);
    DECLARE total_hours DECIMAL(10,2);
    DECLARE total_entries INT;
    DECLARE completed_tasks INT;
    DECLARE billable_hours DECIMAL(10,2);
    
    DECLARE cur CURSOR FOR
        SELECT 
            te.department,
            SUM(te.total_hours) as total_hours,
            COUNT(te.id) as total_entries,
            COUNT(CASE WHEN te.status = 'Completed' THEN 1 END) as completed_tasks,
            SUM(CASE WHEN te.billable = true THEN te.total_hours ELSE 0 END) as billable_hours
        FROM timesheet_entries te
        WHERE YEAR(te.date) = year_param 
          AND MONTH(te.date) = month_param
        GROUP BY te.department
        ORDER BY total_hours DESC;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO dept_name, total_hours, total_entries, completed_tasks, billable_hours;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET result = CONCAT(result, 
            IF(result = '', '', '\n'),
            dept_name, '|', 
            total_hours, '|', 
            total_entries, '|', 
            completed_tasks, '|', 
            billable_hours
        );
    END LOOP;
    
    CLOSE cur;
    RETURN result;
END //
DELIMITER ; 