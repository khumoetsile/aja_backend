
# cPanel Deployment Instructions

## 1. Upload Files
Upload all backend files to your cPanel Node.js application root directory.

## 2. Install Dependencies
Run in cPanel terminal:
```bash
npm install
```

## 3. Environment Variables
The following environment variables are already configured in .env:
- NODE_ENV=production
- DB_HOST=localhost
- DB_USER=ajaco_timesheet
- DB_PASSWORD=IyhpJL4+%Vl2P+k2
- DB_NAME=ajaco_timesheet
- DB_PORT=3306

## 4. Database Setup
1. Create database: ajaco_timesheet
2. Create user: ajaco_timesheet
3. Grant privileges to user on database
4. Run database schema: node create-tables.js

## 5. Start Application
Set startup file to: server.js
Application will start automatically.

## 6. Test Endpoints
- Health check: https://timesheetbackend.aja.co.bw/api/health
- Login: https://timesheetbackend.aja.co.bw/api/auth/login

## 7. CORS Configuration
Frontend URL: https://timesheet.aja.co.bw
Backend URL: https://timesheetbackend.aja.co.bw
