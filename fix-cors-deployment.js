const fs = require('fs');

console.log('🔧 Fixing CORS configuration for production deployment...');

// Updated production environment variables with correct backend URL
const productionEnv = `
# Production Environment Variables for cPanel
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_USER=ajaco_timesheet
DB_PASSWORD=IyhpJL4+%Vl2P+k2
DB_NAME=ajaco_timesheet
DB_PORT=3306

# Email Configuration
EMAIL_HOST=mail.khumo.co.bw
EMAIL_PORT=465
EMAIL_USER=development@khumo.co.bw
EMAIL_PASS=x}@j@{qVQ2$Eg6+.

# CORS Configuration - FIXED URLs
FRONTEND_URL=https://timesheet.aja.co.bw
BACKEND_BASE=https://ajabackend.khumo.co.bw
`;

// Write updated .env file
fs.writeFileSync('.env', productionEnv);
console.log('✅ Updated .env file with correct backend URL');

// Create CORS fix instructions
const corsFixInstructions = `
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
`;

fs.writeFileSync('CORS_FIX_INSTRUCTIONS.md', corsFixInstructions);
console.log('✅ Created CORS fix instructions');

console.log('\n🎉 CORS configuration fixed!');
console.log('\n📋 Next steps:');
console.log('1. Upload updated files to cPanel');
console.log('2. Restart the Node.js application');
console.log('3. Test: https://ajabackend.khumo.co.bw/health');

