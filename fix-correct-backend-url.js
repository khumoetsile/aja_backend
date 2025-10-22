const fs = require('fs');

console.log('🔧 Fixing backend URL configuration...');

// Corrected production environment variables
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

# CORS Configuration - CORRECT URLs
FRONTEND_URL=https://timesheet.aja.co.bw
BACKEND_BASE=https://timesheetbackend.aja.co.bw
`;

// Write corrected .env file
fs.writeFileSync('.env', productionEnv);
console.log('✅ Updated .env file with correct backend URL: timesheetbackend.aja.co.bw');

// Create corrected deployment instructions
const correctedInstructions = `
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
- Rebuild with: \`ng build --configuration=production\`
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
`;

fs.writeFileSync('CORRECTED_DEPLOYMENT_INSTRUCTIONS.md', correctedInstructions);
console.log('✅ Created corrected deployment instructions');

console.log('\n🎉 Backend URL configuration corrected!');
console.log('\n📋 Summary:');
console.log('• Frontend: https://timesheet.aja.co.bw');
console.log('• Backend: https://timesheetbackend.aja.co.bw');
console.log('• CORS: Fixed for correct domains');
console.log('\n🚀 Next steps:');
console.log('1. Upload updated backend files');
console.log('2. Rebuild and upload frontend');
console.log('3. Test: https://timesheetbackend.aja.co.bw/health');

