
# 🔧 CORS Fix Applied

## ✅ **Updated Configuration:**

### **Backend URL Fixed:**
- **Old:** https://timesheetbackend.aja.co.bw
- **New:** https://ajabackend.khumo.co.bw

### **CORS Origins Added:**
- ✅ https://timesheet.aja.co.bw (frontend)
- ✅ https://ajabackend.khumo.co.bw (backend)
- ✅ http://ajabackend.khumo.co.bw (backend no SSL)

### **Environment Variables Updated:**
- FRONTEND_URL=https://timesheet.aja.co.bw
- BACKEND_BASE=https://ajabackend.khumo.co.bw

## 🚀 **Next Steps:**

1. **Upload updated files** to cPanel
2. **Restart the Node.js application**
3. **Test the connection**

## 🧪 **Test URLs:**
- **Health:** https://ajabackend.khumo.co.bw/health
- **Login:** https://ajabackend.khumo.co.bw/api/auth/login

## 🔍 **If Still Having Issues:**
1. Check that the backend is running
2. Verify SSL certificate is valid
3. Check cPanel Node.js logs
4. Ensure environment variables are set correctly
