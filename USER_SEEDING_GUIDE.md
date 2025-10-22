# 🚀 User Seeding Guide

## 📋 **Step-by-Step Process**

### **Step 1: Fix User Data Issues**
```bash
cd aja_backend
node fix-user-data.js
```
This will:
- Fix empty department fields for ADMIN users
- Map inconsistent department names
- Fix email domain issues
- Create `users_roles_departments_fixed.json`

### **Step 2: Seed Departments & Tasks First**
```bash
# Make sure departments exist before creating users
node bulk-seed-departments.js ../Downloads/departments_tasks_from_E1_P1.json
```

### **Step 3: Seed Users (Without Emails)**
```bash
# Seed users without sending emails
node bulk-seed-users.js users_roles_departments_fixed.json --no-email
```

### **Step 4: Send Welcome Emails Later (Optional)**
```bash
# If you want to send emails later, you can create a separate script
# or use the existing script with email functionality
```

## 🔧 **Data Issues Fixed**

### **Before Fixes:**
- ❌ 4 users with empty departments
- ❌ Inconsistent department names (OPS, Corporate, Registry, etc.)
- ❌ One email with wrong domain (@co.bw)

### **After Fixes:**
- ✅ All users have valid departments
- ✅ Department names match your departments JSON
- ✅ All emails use @aja.co.bw domain
- ✅ Proper department mapping

## 📊 **Department Mapping Applied**

| Original Department | Mapped To | Reason |
|-------------------|-----------|---------|
| `OPS` | `Operations` | Standardize naming |
| `Corporate` | `Litigation` | Closest match |
| `Registry` | `Operations` | Administrative function |
| `logistics and fleet` | `Operations` | Administrative function |
| Empty (ADMIN users) | `Operations` | Default for admin users |

## 🎯 **Expected Results**

After seeding, you should have:
- **~50 users** created successfully
- **All users assigned to valid departments**
- **No email sending** (as requested)
- **Detailed results** saved to `seeding-results-YYYY-MM-DD.json`

## 🔍 **Verification Steps**

1. **Check database:**
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT department, COUNT(*) FROM users GROUP BY department;
   ```

2. **Check for errors:**
   - Review the results file
   - Check console output for any failures

3. **Test login:**
   - Try logging in with a few user accounts
   - Verify department assignments

## 🚨 **Important Notes**

- **No emails will be sent** (using `--no-email` flag)
- **Duplicate users will be skipped** (using default behavior)
- **All users get random passwords** (generated securely)
- **Passwords are not displayed** (for security)

## 📞 **Support**

If you encounter issues:
1. Check the results file for detailed error messages
2. Verify database connection
3. Ensure departments were seeded first
4. Check console output for specific errors
