
# 🚀 ULTIMATE CORS FIX - Deployment Instructions

## ✅ **Files Created:**
- `server-cors-fixed.js` - New server with bulletproof CORS
- Enhanced logging for debugging

## 🔧 **CORS Configuration:**
- ✅ Allows: https://timesheet.aja.co.bw
- ✅ Allows: https://timesheetbackend.aja.co.bw
- ✅ Handles preflight requests explicitly
- ✅ Detailed logging for debugging
- ✅ Credentials support
- ✅ All HTTP methods supported

## 🚀 **Deployment Steps:**

### **1. Backup Current Server:**
```bash
cp server.js server-backup.js
```

### **2. Replace Server File:**
```bash
cp server-cors-fixed.js server.js
```

### **3. Restart Application:**
- Restart Node.js application in cPanel
- Check logs for CORS messages

### **4. Test:**
- Health: https://timesheetbackend.aja.co.bw/health
- Login: https://timesheetbackend.aja.co.bw/api/auth/login

## 🧪 **Testing Commands:**

### **Test CORS Preflight:**
```bash
curl -X OPTIONS https://timesheetbackend.aja.co.bw/api/auth/login \
  -H "Origin: https://timesheet.aja.co.bw" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

### **Test Login:**
```bash
curl -X POST https://timesheetbackend.aja.co.bw/api/auth/login \
  -H "Origin: https://timesheet.aja.co.bw" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aja.com","password":"admin123"}' \
  -v
```

## 🔍 **Debugging:**
- Check server logs for CORS messages
- Look for "Request origin:" and "CORS:" messages
- Verify allowed origins in logs

## ✅ **Expected Result:**
- No CORS errors in browser
- Login functionality working
- All API calls successful
