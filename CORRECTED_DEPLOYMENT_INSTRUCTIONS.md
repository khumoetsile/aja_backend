
# ✅ CORRECTED Backend URL Configuration

## 🎯 **Correct URLs:**
- **Frontend:** https://timesheet.aja.co.bw
- **Backend:** https://timesheetbackend.aja.co.bw

## 🔧 **Files Updated:**
1. ✅ **server.js** - CORS configuration updated
2. ✅ **.env** - Environment variables corrected
3. ✅ **production.env** - Production config corrected
4. ✅ **environment.prod.ts** - Frontend API URL corrected

## 🚀 **Deployment Steps:**

### **1. Backend (timesheetbackend.aja.co.bw):**
- Upload updated files to cPanel
- Restart Node.js application
- Test: https://timesheetbackend.aja.co.bw/health

### **2. Frontend (timesheet.aja.co.bw):**
- Rebuild with: `ng build --configuration=production`
- Upload dist files to cPanel
- Test login functionality

## 🧪 **Test URLs:**
- **Backend Health:** https://timesheetbackend.aja.co.bw/health
- **Backend Login:** https://timesheetbackend.aja.co.bw/api/auth/login
- **Frontend:** https://timesheet.aja.co.bw

## ✅ **Expected Result:**
- No CORS errors
- Login should work
- Frontend ↔ Backend communication working
