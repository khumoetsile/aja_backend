const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email configuration
const emailConfig = {
  host: 'mail.khumo.co.bw',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'development@khumo.co.bw',
    pass: 'x}@j@{qVQ2$Eg6+.'
  }
};

// Create email transporter
const transporter = nodemailer.createTransport(emailConfig);

// Function to generate random password
function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Function to parse employee name into first and last name
function parseEmployeeName(fullName) {
  const nameParts = fullName.trim().split(' ');
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  } else if (nameParts.length === 2) {
    return { firstName: nameParts[0], lastName: nameParts[1] };
  } else {
    // For names with more than 2 parts, first part is first name, rest is last name
    return { 
      firstName: nameParts[0], 
      lastName: nameParts.slice(1).join(' ') 
    };
  }
}

// Function to send email with password
async function sendPasswordEmail(email, firstName, lastName, password) {
  const mailOptions = {
    from: '"AJA Timesheet System" <development@khumo.co.bw>',
    to: email,
    subject: 'Welcome to AJA Timesheet System - Your Login Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to AJA Timesheet System</h2>
        
        <p>Dear ${firstName} ${lastName},</p>
        
        <p>Your account has been successfully created in the AJA Timesheet System. Below are your login credentials:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #495057; margin-top: 0;">Login Information</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px;">${password}</code></p>
        </div>
        
        <p><strong>Important Security Notes:</strong></p>
        <ul>
          <li>Please change your password after your first login</li>
          <li>Keep your login credentials secure and do not share them</li>
          <li>If you have any issues accessing the system, contact your administrator</li>
        </ul>
        
        <p>You can access the system at: <a href="http://localhost:4200" style="color: #007bff;">http://localhost:4200</a></p>
        
        <p>Best regards,<br>
        AJA Timesheet System Administrator</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
        <p style="font-size: 12px; color: #6c757d;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error.message);
    return false;
  }
}

// Main seeding function
async function seedUsers(userList) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aja_timesheet',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔗 Connected to database');
    console.log(`📋 Processing ${userList.length} users...`);

    let successCount = 0;
    let emailSuccessCount = 0;
    let duplicateCount = 0;
    const errors = [];

    for (let i = 0; i < userList.length; i++) {
      const user = userList[i];
      console.log(`\n👤 Processing user ${i + 1}/${userList.length}: ${user['Employee Name']} (${user['Email Address']})`);

      try {
        // Parse employee name
        const { firstName, lastName } = parseEmployeeName(user['Employee Name']);
        
        // Generate random password
        const password = generatePassword();
        
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Check if user already exists
        const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [user['Email Address']]
        );

        if (existingUsers.length > 0) {
          console.log(`⚠️  User ${user['Email Address']} already exists, skipping...`);
          duplicateCount++;
          continue;
        }

        // Insert new user
        await connection.execute(
          `INSERT INTO users (email, password, first_name, last_name, role, department, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, true, NOW())`,
          [
            user['Email Address'],
            hashedPassword,
            firstName,
            lastName,
            user['Role'],
            user['Department']
          ]
        );

        console.log(`✅ User ${user['Email Address']} created successfully`);

        // Send email with password
        const emailSent = await sendPasswordEmail(
          user['Email Address'],
          firstName,
          lastName,
          password
        );

        if (emailSent) {
          emailSuccessCount++;
        }

        successCount++;

      } catch (error) {
        console.error(`❌ Error processing user ${user['Email Address']}:`, error.message);
        errors.push({
          email: user['Email Address'],
          name: user['Employee Name'],
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n📊 SEEDING SUMMARY');
    console.log('==================');
    console.log(`✅ Users created successfully: ${successCount}`);
    console.log(`📧 Emails sent successfully: ${emailSuccessCount}`);
    console.log(`⚠️  Duplicate users skipped: ${duplicateCount}`);
    console.log(`❌ Errors encountered: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(error => {
        console.log(`  - ${error.name} (${error.email}): ${error.error}`);
      });
    }

    console.log('\n🎉 User seeding completed!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    try { 
      await connection.end(); 
    } catch (_) {}
  }
}

// Sample user data (replace with your actual data)
const sampleUsers = [
  {
    "Employee Name": "KEALEBOGA MONYAI",
    "Department": "Property",
    "Email Address": "kmolabi@gmail.com", 
    "Role": "ADMIN"
  },
  {
    "Employee Name": "NTHABISENG KGOSIKWENA",
    "Department": "Property",
    "Email Address": "kmolabi@bitri.co.bw", 
    "Role": "STAFF"
  }
];

// Function to load users from JSON file (for larger datasets)
async function loadUsersFromFile(filePath) {
  try {
    const fs = require('fs');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading users from file:', error.message);
    return [];
  }
}

// Main execution
async function main() {
  console.log('🚀 AJA Timesheet User Seeding Script');
  console.log('=====================================\n');

  // Check if file path is provided as command line argument
  const userFilePath = process.argv[2];
  
  let usersToSeed;
  
  if (userFilePath) {
    console.log(`📁 Loading users from file: ${userFilePath}`);
    usersToSeed = await loadUsersFromFile(userFilePath);
    
    if (usersToSeed.length === 0) {
      console.log('❌ No users found in file or file could not be read');
      process.exit(1);
    }
  } else {
    console.log('📋 Using sample user data');
    usersToSeed = sampleUsers;
  }

  console.log(`📊 Total users to process: ${usersToSeed.length}\n`);

  // Validate user data structure
  const requiredFields = ['Employee Name', 'Department', 'Email Address', 'Role'];
  const invalidUsers = usersToSeed.filter(user => 
    !requiredFields.every(field => user[field])
  );

  if (invalidUsers.length > 0) {
    console.log('❌ Invalid user data found. All users must have: Employee Name, Department, Email Address, Role');
    console.log('Invalid users:', invalidUsers);
    process.exit(1);
  }

  // Start seeding
  await seedUsers(usersToSeed);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { seedUsers, generatePassword, parseEmployeeName, sendPasswordEmail };
