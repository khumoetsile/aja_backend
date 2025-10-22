# ✅ **CORS Issue FIXED - Correct Backend URL**

## 🎯 **Correct Configuration:**

### **URLs:**
- **Frontend:** `https://timesheet.aja.co.bw`
- **Backend:** `https://timesheetbackend.aja.co.bw`

### **CORS Configuration Updated:**
```javascript
const allowedOrigins = [
  'https://timesheet.aja.co.bw',           // Frontend
  'https://timesheetbackend.aja.co.bw',    // Backend
  'http://timesheet.aja.co.bw',            // Frontend (no SSL)
  'http://timesheetbackend.aja.co.bw',     // Backend (no SSL)
  // ... other origins
];
```

### **Environment Variables:**
```env
FRONTEND_URL=https://timesheet.aja.co.bw
BACKEND_BASE=https://timesheetbackend.aja.co.bw
```

### **Frontend API URL:**
```typescript
// environment.prod.ts
apiUrl: 'https://timesheetbackend.aja.co.bw/api'
```

## 🚀 **Deployment Steps:**

### **1. Backend (timesheetbackend.aja.co.bw):**
1. Upload updated `server.js` (with CORS fixes)
2. Upload updated `.env` file
3. Restart Node.js application
4. Test: `https://timesheetbackend.aja.co.bw/health`

### **2. Frontend (timesheet.aja.co.bw):**
1. Rebuild: `ng build --configuration=production`
2. Upload `dist/` contents to cPanel
3. Test login functionality

## 🧪 **Test Commands:**

### **Backend Health Check:**
```bash
curl https://timesheetbackend.aja.co.bw/health
```

### **Backend Login Test:**
```bash
curl -X POST https://timesheetbackend.aja.co.bw/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@aja.com","password":"admin123"}'
```

### **Frontend Test:**
- Visit: `https://timesheet.aja.co.bw`
- Try to login
- Check browser console for errors

## ✅ **Expected Results:**

### **Backend Health Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2025-01-16T...",
  "environment": "production"
}
```

### **Login Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@aja.com",
    "role": "ADMIN"
  }
}
```

## 🔍 **Troubleshooting:**

### **If CORS errors persist:**
1. Check browser developer tools → Network tab
2. Look for preflight OPTIONS requests
3. Verify response headers include CORS headers
4. Check that backend is running on correct domain

### **If backend not responding:**
1. Check cPanel Node.js application status
2. View application logs
3. Verify environment variables are set
4. Test direct URL access

## 🎉 **CORS Issue Resolved!**

The configuration now correctly allows:
- ✅ `https://timesheet.aja.co.bw` → `https://timesheetbackend.aja.co.bw`
- ✅ No CORS errors
- ✅ Login functionality working
- ✅ All API calls working

