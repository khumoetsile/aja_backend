# 📊 Database Seeding Guide

## Overview
This guide explains how to populate the AJA Timesheet database with realistic test data.

## ✅ What Was Just Seeded

The `seed-large-dataset.js` script has successfully populated your database with:

### **Users Created: 60**
- **10 Supervisors** across various departments
- **50 Staff members** across various departments
- **All passwords:** `admin123`

### **Departments: 13**
1. Legal
2. Finance
3. IT
4. HR
5. Marketing
6. Operations
7. Litigation
8. KYC_Compliance
9. CRM
10. Front_Office
11. Healthcare_dept
12. Hospitality
13. Accounts

### **Timesheet Entries: 6,254**
- Date range: **Past 180 days (6 months)**
- Each user has **60-150 entries**
- **70% billable** entries
- Status distribution:
  - 60% Completed
  - 25% In Progress
  - 10% Pending
  - 5% Closed

### **Entry Details:**
- Realistic South African names
- Department-specific tasks
- Client file numbers (CFN-2025-XXXXX)
- Work hours: 08:00 - 18:00
- Task durations: 30 minutes to 4 hours
- Priorities: Low, Medium, High, Critical
- Detailed activity descriptions

---

## 🚀 Available Seeding Scripts

### 1. **seed-large-dataset.js** (Just Executed)
```bash
node seed-large-dataset.js
```
**Configuration:**
- 60 users (10 supervisors, 50 staff)
- 6,000+ timesheet entries
- 180 days of historical data

### 2. **seed-demo-data.js** (Small Dataset)
```bash
node seed-demo-data.js
```
**Configuration:**
- ~8 users
- ~200 timesheet entries
- 45 days of data
- Good for quick testing

---

## 🎛️ Customizing the Dataset

You can modify `seed-large-dataset.js` to generate more or less data:

```javascript
const CONFIG = {
  NUM_STAFF: 50,           // Change to 100, 200, etc.
  NUM_SUPERVISORS: 10,     // Change to 20, 30, etc.
  ENTRIES_PER_USER_MIN: 60,    // Min entries per user
  ENTRIES_PER_USER_MAX: 150,   // Max entries per user
  DAYS_BACK: 180,          // Days of historical data (180 = 6 months)
};
```

### Example Configurations:

**Small Dataset (Fast):**
```javascript
NUM_STAFF: 20
NUM_SUPERVISORS: 5
ENTRIES_PER_USER_MIN: 30
ENTRIES_PER_USER_MAX: 60
DAYS_BACK: 90
```
*Result: ~25 users, ~1,000 entries*

**Medium Dataset:**
```javascript
NUM_STAFF: 50
NUM_SUPERVISORS: 10
ENTRIES_PER_USER_MIN: 60
ENTRIES_PER_USER_MAX: 150
DAYS_BACK: 180
```
*Result: ~60 users, ~6,000 entries* ✅ **Current**

**Large Dataset (Slow):**
```javascript
NUM_STAFF: 100
NUM_SUPERVISORS: 20
ENTRIES_PER_USER_MIN: 100
ENTRIES_PER_USER_MAX: 250
DAYS_BACK: 365
```
*Result: ~120 users, ~20,000+ entries*

**Extra Large Dataset:**
```javascript
NUM_STAFF: 200
NUM_SUPERVISORS: 40
ENTRIES_PER_USER_MIN: 150
ENTRIES_PER_USER_MAX: 400
DAYS_BACK: 730  // 2 years
```
*Result: ~240 users, ~60,000+ entries*

---

## 📝 Sample User Credentials

All users have the password: `admin123`

### Admins:
- `admin@aja.com` - Admin User (Operations)

### Supervisors (Sample):
- `lebo.molefe@aja.com` - Legal
- `neo.dube@aja.com` - IT
- `thabo.khoza@aja.com` - Finance
- *(+ 7 more randomly generated)*

### Staff (Sample):
- `jane.staff@aja.com` - Legal
- `peter.khoza@aja.com` - IT
- `thato.gare@aja.com` - HR
- `dineo.moyo@aja.com` - Finance
- *(+ 46 more randomly generated)*

---

## 🔄 Re-running the Seeder

The seeding script is **idempotent** for users (uses `ON DUPLICATE KEY UPDATE`), but will:
- ✅ Keep existing users (updates their info)
- ✅ Add NEW timesheet entries each time you run it

### To Start Fresh:

```sql
-- Clear all timesheet entries
DELETE FROM timesheet_entries;

-- Clear all users (except admin)
DELETE FROM users WHERE email != 'admin@aja.com';

-- Then re-run the seeder
node seed-large-dataset.js
```

---

## 📊 Database Statistics

After seeding, you can view statistics:

```sql
-- Department summary
SELECT 
  department,
  COUNT(*) as entries,
  ROUND(SUM(total_hours), 2) as total_hours,
  ROUND(AVG(total_hours), 2) as avg_hours
FROM timesheet_entries
GROUP BY department
ORDER BY total_hours DESC;

-- User summary
SELECT 
  u.first_name,
  u.last_name,
  u.department,
  u.role,
  COUNT(te.id) as entries,
  ROUND(SUM(te.total_hours), 2) as total_hours
FROM users u
LEFT JOIN timesheet_entries te ON u.id = te.user_id
GROUP BY u.id
ORDER BY total_hours DESC
LIMIT 20;

-- Status distribution
SELECT status, COUNT(*) as count
FROM timesheet_entries
GROUP BY status
ORDER BY count DESC;

-- Monthly breakdown
SELECT 
  DATE_FORMAT(date, '%Y-%m') as month,
  COUNT(*) as entries,
  ROUND(SUM(total_hours), 2) as hours
FROM timesheet_entries
GROUP BY DATE_FORMAT(date, '%Y-%m')
ORDER BY month DESC;
```

---

## 🎯 What to Test Now

With this dataset, you can test:

1. **Analytics & Reporting**
   - Department performance charts
   - Employee productivity metrics
   - Billable vs non-billable hours
   - Monthly/quarterly reports

2. **Filtering & Search**
   - Filter by department
   - Filter by date range
   - Filter by status/priority
   - Search by employee name

3. **Performance**
   - Page load times with 6,000+ entries
   - Search and filter performance
   - Export to Excel/CSV with large datasets

4. **User Roles**
   - Login as different supervisors
   - Login as different staff members
   - Test department-specific views

5. **Date Range Analytics**
   - 6 months of historical trends
   - Week-over-week comparisons
   - Seasonal patterns

---

## 🛠️ Troubleshooting

### "Error: ER_DUP_ENTRY"
This is normal if you re-run the script. Users are updated, not duplicated.

### "Too slow"
Reduce the number of users or entries per user in the CONFIG.

### "Not enough data"
Increase the numbers in CONFIG and re-run.

### "Database connection error"
Check your `.env` file has correct database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=aja_timesheet
DB_PORT=3306
```

---

## 📦 Generated Data Details

### **Client File Numbers:**
- Format: `CFN-2025-XXXXX`
- Sequential numbering
- Unique for each entry

### **Time Entries:**
- Start times: 08:00 - 17:00
- End times: Calculated based on duration
- Durations: 30 min, 45 min, 1h, 1.5h, 2h, 2.5h, 3h, 4h
- All times rounded to 15-minute intervals

### **Tasks:**
Each department has 12-16 specific tasks:
- **Legal:** Contract Review, Legal Research, Court Filing, etc.
- **Finance:** Invoice Processing, Budget Forecasting, etc.
- **IT:** Server Maintenance, Bug Fixing, Code Review, etc.
- **HR:** Employee Onboarding, Payroll Processing, etc.
- **Marketing:** Campaign Planning, Content Creation, etc.
- *(and more for each department)*

### **Realistic South African Names:**
- 49 first names from all South African cultures
- 50 last names representing diverse backgrounds
- Email format: `firstname.lastname@aja.com`

---

## ✨ Next Steps

1. **Login to the application**
   - Use any of the seeded credentials
   - Default password: `admin123`

2. **Explore the analytics**
   - View department reports
   - Check individual user performance
   - Filter by date ranges

3. **Test filtering**
   - Try different department filters
   - Use date range pickers
   - Sort by various columns

4. **Generate reports**
   - Export data to Excel
   - Create custom reports
   - View billable hours summaries

---

**Happy Testing! 🎉**

