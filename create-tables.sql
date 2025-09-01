-- AJA Law Firm Timesheet Database Tables (MySQL)

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

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default departments
INSERT INTO departments (name, description) VALUES
('Legal', 'Legal department handling court cases and legal advice'),
('Finance', 'Financial management and accounting'),
('IT', 'Information Technology and system support'),
('HR', 'Human Resources and personnel management'),
('Marketing', 'Marketing and business development'),
('Operations', 'General operations and administration'),
('Litigation', 'Court litigation and legal proceedings'),
('KYC_Compliance', 'Know Your Customer and compliance procedures'),
('CRM', 'Customer Relationship Management'),
('Front_Office', 'Front office and client services'),
('Healthcare_dept', 'Healthcare legal services'),
('Hospitality', 'Hospitality industry legal services'),
('Accounts', 'Accounting and financial services');

-- Insert default users
INSERT INTO users (email, password, first_name, last_name, role, department) VALUES
('admin@aja.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'ADMIN', 'Operations'),
('supervisor@aja.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Supervisor', 'SUPERVISOR', 'Legal'),
('staff@aja.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Staff', 'STAFF', 'Legal'); 