# 🚀 cPanel Deployment Checklist

## ✅ **Backend Preparation Complete!**

### **📁 Files Ready for Upload:**
- ✅ All backend files
- ✅ `.env` file with production settings
- ✅ `package.json` with production scripts
- ✅ `server.js` (startup file)

### **🔧 cPanel Node.js Configuration:**

#### **Application Settings:**
- **Node.js version:** 18.20.8
- **Application mode:** Production
- **Application root:** timesheetbackend.aja.co.bw
- **Application URL:** timesheetbackend.aja.co.bw
- **Application startup file:** `server.js`

#### **Environment Variables to Add in cPanel:**
```
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_USER=ajaco_timesheet
DB_PASSWORD=IyhpJL4+%Vl2P+k2
DB_NAME=ajaco_timesheet
DB_PORT=3306
EMAIL_HOST=mail.khumo.co.bw
EMAIL_PORT=465
EMAIL_USER=development@khumo.co.bw
EMAIL_PASS=x}@j@{qVQ2$Eg6+.
FRONTEND_URL=https://timesheet.aja.co.bw
BACKEND_BASE=https://timesheetbackend.aja.co.bw
```

### **📋 Deployment Steps:**

1. **Upload Files:**
   - Upload entire `aja_backend` folder contents to cPanel Node.js app root
   - Ensure `server.js` is in the root directory

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Database Setup:**
   - Create database: `ajaco_timesheet`
   - Create user: `ajaco_timesheet` with password: `IyhpJL4+%Vl2P+k2`
   - Grant all privileges to user on database
   - Run: `node create-tables.js`

4. **Start Application:**
   - Set startup file to: `server.js`
   - Application will start automatically

### **🧪 Testing:**

1. **Health Check:**
   - URL: `https://timesheetbackend.aja.co.bw/api/health`
   - Should return: `{"status":"OK","message":"Server is running"}`

2. **Login Test:**
   - URL: `https://timesheetbackend.aja.co.bw/api/auth/login`
   - Test with: `admin@aja.com` / `admin123`

3. **CORS Test:**
   - Frontend should be able to connect to backend
   - No CORS errors in browser console

### **🔍 Troubleshooting:**

- **Port Issues:** Ensure PORT=3001 in environment variables
- **Database Connection:** Verify database credentials
- **CORS Issues:** Check FRONTEND_URL setting
- **Email Issues:** Verify email credentials

### **📞 Support:**
If issues occur, check:
1. cPanel error logs
2. Node.js application logs
3. Database connection status
4. Environment variables are set correctly

## 🎉 **Ready for Production!**

