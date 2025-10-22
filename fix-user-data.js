const fs = require('fs');
const path = require('path');

// Fix user data issues
function fixUserData() {
  console.log('🔧 Fixing user data issues...');
  
  // Read the original user data
  const userDataPath = path.join(__dirname, '../Downloads/users_roles_departments.json');
  const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
  
  console.log(`📊 Found ${userData.length} users`);
  
  // Department mapping for missing departments
  const departmentMapping = {
    'OPS': 'Operations',  // Map OPS to Operations
    'Corporate': 'Litigation',  // Map Corporate to Litigation (closest match)
    'Registry': 'Operations',  // Map Registry to Operations
    'logistics and fleet': 'Operations'  // Map logistics to Operations
  };
  
  // Fix empty departments for ADMIN users
  const adminDepartments = ['Operations', 'Litigation', 'Property_Conveyancing'];
  
  let fixedCount = 0;
  let issuesFound = [];
  
  userData.forEach((user, index) => {
    const originalUser = { ...user };
    let hasChanges = false;
    
    // Fix empty department for ADMIN users
    if (user.Department === '' && user.Role === 'ADMIN') {
      user.Department = 'Operations';  // Default ADMIN to Operations
      hasChanges = true;
      issuesFound.push(`User ${user['Employee Name']}: Assigned empty department to Operations`);
    }
    
    // Fix department name inconsistencies
    if (departmentMapping[user.Department]) {
      const oldDept = user.Department;
      user.Department = departmentMapping[user.Department];
      hasChanges = true;
      issuesFound.push(`User ${user['Employee Name']}: Changed department from "${oldDept}" to "${user.Department}"`);
    }
    
    // Fix email domain inconsistency
    if (user['Email Address'] === 'officeadmin@co.bw') {
      user['Email Address'] = 'officeadmin@aja.co.bw';
      hasChanges = true;
      issuesFound.push(`User ${user['Employee Name']}: Fixed email domain from @co.bw to @aja.co.bw`);
    }
    
    if (hasChanges) {
      fixedCount++;
    }
  });
  
  // Save fixed data
  const fixedDataPath = path.join(__dirname, 'users_roles_departments_fixed.json');
  fs.writeFileSync(fixedDataPath, JSON.stringify(userData, null, 2));
  
  console.log(`✅ Fixed ${fixedCount} users`);
  console.log(`📄 Fixed data saved to: ${fixedDataPath}`);
  
  if (issuesFound.length > 0) {
    console.log('\n🔍 Issues found and fixed:');
    issuesFound.forEach(issue => console.log(`  - ${issue}`));
  }
  
  // Show department summary
  const departmentCounts = {};
  userData.forEach(user => {
    departmentCounts[user.Department] = (departmentCounts[user.Department] || 0) + 1;
  });
  
  console.log('\n📊 Department distribution after fixes:');
  Object.entries(departmentCounts).forEach(([dept, count]) => {
    console.log(`  ${dept}: ${count} users`);
  });
  
  return fixedDataPath;
}

if (require.main === module) {
  fixUserData();
}

module.exports = { fixUserData };
