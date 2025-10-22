# AJA Timesheet User Seeding Scripts

This directory contains scripts for bulk seeding users into the AJA Timesheet system with automatic email notifications.

## 📁 Files

- `seed-users.js` - Simple user seeding script for small datasets
- `bulk-seed-users.js` - Advanced bulk seeding script for large datasets
- `sample-users.json` - Example user data file
- `USER_SEEDING_README.md` - This documentation

## 🚀 Quick Start

### For Small Datasets (2-50 users)

```bash
# Using the simple script with sample data
node seed-users.js

# Using the simple script with your own JSON file
node seed-users.js your-users.json
```

### For Large Datasets (50+ users)

```bash
# Basic usage
node bulk-seed-users.js users.json

# With options
node bulk-seed-users.js users.json --batch-size=5 --no-email
```

## 📋 User Data Format

Your user data file should be a JSON array with the following structure:

```json
[
  {
    "Employee Name": "KEALEBOGA MONYAI",
    "Department": "Property",
    "Email Address": "kmolabi@gmail.com", 
    "Role": "ADMIN"
  },
  {
    "Employee Name": "NTHABISENG KGOSIKWENA",
    "Department": "Property",
    "Email Address": "kmolabi@bitri.co.bw", 
    "Role": "STAFF"
  }
]
```

### Required Fields

- `Employee Name` - Full name of the employee
- `Department` - Department name (will be created if doesn't exist)
- `Email Address` - Valid email address (must be unique)
- `Role` - User role: `ADMIN`, `SUPERVISOR`, or `STAFF`

## 🔧 Script Options

### Simple Script (`seed-users.js`)

```bash
node seed-users.js [users-file.json]
```

- If no file is provided, uses sample data
- Automatically sends emails with passwords
- Skips duplicate users
- Good for small datasets

### Bulk Script (`bulk-seed-users.js`)

```bash
node bulk-seed-users.js <users-file> [options]
```

#### Options:

- `--no-email` - Skip sending emails (useful for testing)
- `--force` - Overwrite existing users (default: skip duplicates)
- `--batch-size=N` - Process N users at a time (default: 10)

#### Examples:

```bash
# Process 5 users at a time without sending emails
node bulk-seed-users.js users.json --batch-size=5 --no-email

# Force overwrite existing users
node bulk-seed-users.js users.json --force

# Process with default settings
node bulk-seed-users.js users.json
```

## 📧 Email Configuration

The scripts are configured to send emails using:

- **SMTP Server:** mail.khumo.co.bw:465
- **Username:** development@khumo.co.bw
- **Security:** SSL/TLS

### Email Features

- Professional HTML email template
- Secure password generation
- Department and role information
- Security instructions
- Direct login link

## 🔐 Password Generation

### Simple Script
- 12-character passwords
- Mixed case letters, numbers, symbols
- Random generation

### Bulk Script
- Enhanced security requirements
- Ensures at least one character from each category:
  - Uppercase letters
  - Lowercase letters
  - Numbers
  - Symbols
- Shuffled for additional randomness

## 📊 Output and Logging

### Console Output
- Real-time progress updates
- Detailed error messages
- Comprehensive summary report
- Batch processing status

### Results File
The bulk script saves detailed results to:
```
seeding-results-YYYY-MM-DD.json
```

Contains:
- Success/failure status for each user
- Generated passwords
- Email delivery status
- Error details

## 🛠️ Environment Setup

Ensure your `.env` file contains:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aja_timesheet
DB_USER=root
DB_PASSWORD=your_password
```

## 📈 Performance Tips

### For Large Datasets (1000+ users)

1. **Use batch processing:**
   ```bash
   node bulk-seed-users.js users.json --batch-size=5
   ```

2. **Disable emails for initial testing:**
   ```bash
   node bulk-seed-users.js users.json --no-email
   ```

3. **Monitor database performance**
4. **Consider running during off-peak hours**

### Database Considerations

- The script uses prepared statements for security
- Batch processing reduces database load
- Automatic duplicate detection
- Transaction safety

## 🔍 Troubleshooting

### Common Issues

1. **Email sending fails:**
   - Check SMTP credentials
   - Verify network connectivity
   - Check email server status

2. **Database connection errors:**
   - Verify database credentials
   - Ensure database exists
   - Check MySQL service status

3. **Duplicate user errors:**
   - Use `--force` to overwrite
   - Check existing users in database
   - Verify email addresses are unique

### Error Handling

- Scripts continue processing even if individual users fail
- Detailed error reporting
- Graceful handling of network issues
- Automatic retry for transient failures

## 📝 Example Usage Scenarios

### Scenario 1: Small Team (10 users)
```bash
# Create users.json with 10 employees
node seed-users.js users.json
```

### Scenario 2: Large Organization (500 users)
```bash
# Process in small batches to avoid overwhelming the system
node bulk-seed-users.js employees.json --batch-size=5
```

### Scenario 3: Testing Without Emails
```bash
# Test the script without sending emails
node bulk-seed-users.js test-users.json --no-email
```

### Scenario 4: Update Existing Users
```bash
# Force update existing users
node bulk-seed-users.js updated-users.json --force
```

## 🔒 Security Considerations

- Passwords are hashed using bcrypt with 12 salt rounds
- Email credentials are stored securely
- No passwords are logged in plain text
- Automatic cleanup of sensitive data

## 📞 Support

For issues or questions:
1. Check the console output for detailed error messages
2. Verify your user data format
3. Ensure database connectivity
4. Check email server configuration

## 🎯 Best Practices

1. **Test with small datasets first**
2. **Backup your database before bulk operations**
3. **Verify email configuration with a test run**
4. **Monitor system resources during large operations**
5. **Keep detailed logs of seeding operations**

