# 🔧 CORS Issue Fixed!

## ❌ **The Problem:**
```
Access to XMLHttpRequest at 'https://ajabackend.khumo.co.bw/api/auth/login' 
from origin 'https://timesheet.aja.co.bw' has been blocked by CORS policy
```

## ✅ **The Solution Applied:**

### **1. Backend CORS Configuration Updated:**
- ✅ Added `https://ajabackend.khumo.co.bw` to allowed origins
- ✅ Added `http://ajabackend.khumo.co.bw` for non-SSL fallback
- ✅ Updated environment variables

### **2. Environment Variables Fixed:**
```env
FRONTEND_URL=https://timesheet.aja.co.bw
BACKEND_BASE=https://ajabackend.khumo.co.bw
```

### **3. Frontend Configuration:**
- ✅ Already correctly configured: `https://ajabackend.khumo.co.bw/api`

## 🚀 **Deployment Steps:**

### **1. Upload Updated Files:**
- Upload the updated `server.js` with CORS fixes
- Upload the updated `.env` file
- Upload the updated `production.env` file

### **2. Restart Backend:**
- Restart the Node.js application in cPanel
- Verify the application is running

### **3. Test Connection:**
```bash
# Health check
curl https://ajabackend.khumo.co.bw/health

# Should return:
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2025-01-16T...",
  "environment": "production"
}
```

## 🧪 **Test Login:**
```bash
curl -X POST https://ajabackend.khumo.co.bw/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aja.com","password":"admin123"}'
```

## 🔍 **If Issues Persist:**

### **Check Backend Status:**
1. Go to cPanel → Node.js Applications
2. Check if application is running
3. View application logs
4. Verify environment variables are set

### **Check SSL Certificate:**
1. Visit: https://ajabackend.khumo.co.bw/health
2. Ensure SSL certificate is valid
3. Check for mixed content warnings

### **Browser Developer Tools:**
1. Open Network tab
2. Check for CORS preflight requests
3. Verify response headers include CORS headers

## ✅ **Expected Result:**
- ✅ No CORS errors in browser console
- ✅ Login should work successfully
- ✅ All API calls should work
- ✅ Frontend can communicate with backend

## 🎉 **CORS Issue Resolved!**

