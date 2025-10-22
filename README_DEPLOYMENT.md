# 🚀 AJA Timesheet Backend - cPanel Deployment

## ✅ **Ready for Production Deployment!**

### **📦 What's Included:**
- ✅ Complete backend API
- ✅ Database schema and seeding scripts
- ✅ Production environment configuration
- ✅ Health check endpoint
- ✅ CORS configuration for frontend
- ✅ Email service integration

### **🔧 Database Configuration:**
- **Database:** `ajaco_timesheet`
- **User:** `ajaco_timesheet`
- **Password:** `IyhpJL4+%Vl2P+k2`
- **Host:** `localhost`
- **Port:** `3306`

### **🌐 URLs:**
- **Backend:** `https://timesheetbackend.aja.co.bw`
- **Frontend:** `https://timesheet.aja.co.bw`
- **Health Check:** `https://timesheetbackend.aja.co.bw/health`

### **📋 Quick Deployment:**

1. **Upload all files** to cPanel Node.js app root
2. **Set startup file:** `server.js`
3. **Add environment variables** (see checklist)
4. **Run:** `npm install`
5. **Start application**

### **🧪 Test After Deployment:**
```bash
# Health check
curl https://timesheetbackend.aja.co.bw/health

# Login test
curl -X POST https://timesheetbackend.aja.co.bw/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aja.com","password":"admin123"}'
```

### **📁 Key Files:**
- `server.js` - Main application file
- `.env` - Production environment variables
- `package.json` - Dependencies and scripts
- `create-tables.js` - Database setup
- `bulk-seed-departments.js` - Department seeding
- `bulk-seed-users.js` - User seeding

### **🎯 Features Ready:**
- ✅ User authentication
- ✅ Timesheet management
- ✅ Department & task management
- ✅ Analytics & reporting
- ✅ User management
- ✅ Email notifications
- ✅ CORS support

## 🎉 **Production Ready!**

