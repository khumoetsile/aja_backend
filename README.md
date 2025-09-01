# AJA Law Firm Timesheet Backend

A Node.js + Express + PostgreSQL backend for the AJA Law Firm Timesheet Management System with role-based authentication.

## Features

- **Role-based Authentication**: ADMIN, SUPERVISOR, and STAFF roles
- **JWT Token Authentication**: Secure token-based authentication
- **PostgreSQL Database**: Robust database with optimized queries
- **Security Features**: Rate limiting, CORS, helmet security
- **API Endpoints**: RESTful API for authentication and user management

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your database credentials and JWT secret.

4. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb aja_timesheet
   
   # Run schema
   psql -d aja_timesheet -f database/schema.sql
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aja_timesheet
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:4200
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/users` - Get all users (Admin only)
- `PUT /api/auth/users/:userId/toggle-status` - Toggle user status (Admin only)

### Default Users

The system comes with default users for testing:

1. **Admin User:**
   - Email: `admin@aja.com`
   - Password: `admin123`
   - Role: `ADMIN`

2. **Supervisor User:**
   - Email: `supervisor@aja.com`
   - Password: `admin123`
   - Role: `SUPERVISOR`

3. **Staff User:**
   - Email: `staff@aja.com`
   - Password: `admin123`
   - Role: `STAFF`

## Role Permissions

### ADMIN
- Full access to all features
- Can create, edit, and delete users
- Can view all timesheet entries
- Can access analytics and reports
- Can manage system settings

### SUPERVISOR
- Can view and manage timesheet entries
- Can access analytics for their department
- Can approve/reject timesheet entries
- Cannot manage users (except their own profile)

### STAFF
- Can create and edit their own timesheet entries
- Can view their own entries and basic reports
- Cannot access user management
- Cannot access advanced analytics

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `email` (VARCHAR) - Unique email address
- `password` (VARCHAR) - Hashed password
- `first_name` (VARCHAR) - User's first name
- `last_name` (VARCHAR) - User's last name
- `role` (VARCHAR) - User role (ADMIN/SUPERVISOR/STAFF)
- `department` (VARCHAR) - User's department
- `is_active` (BOOLEAN) - Account status
- `last_login` (TIMESTAMP) - Last login time
- `created_at` (TIMESTAMP) - Account creation time
- `updated_at` (TIMESTAMP) - Last update time

### Timesheet Entries Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `date` (DATE) - Entry date
- `client_file_number` (VARCHAR) - Client file reference
- `department` (VARCHAR) - Department
- `task` (VARCHAR) - Task description
- `activity` (TEXT) - Detailed activity description
- `priority` (VARCHAR) - Priority level
- `start_time` (TIME) - Start time
- `end_time` (TIME) - End time
- `total_hours` (DECIMAL) - Calculated total hours
- `status` (VARCHAR) - Entry status
- `billable` (BOOLEAN) - Billable flag
- `comments` (TEXT) - Additional comments
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Last update time

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Rate Limiting**: Prevents abuse
- **CORS Protection**: Cross-origin request protection
- **Helmet Security**: Additional security headers
- **Input Validation**: Express-validator for request validation

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Start production server
npm start
```

## Health Check

The API includes a health check endpoint:

```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "message": "AJA Timesheet API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Next Steps

1. Implement timesheet CRUD operations
2. Add analytics and reporting endpoints
3. Implement file upload for attachments
4. Add email notifications
5. Create comprehensive test suite
6. Add API documentation with Swagger

## License

ISC License 