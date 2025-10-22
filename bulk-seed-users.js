const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Email configuration
const emailConfig = {
  host: 'mail.khumo.co.bw',
  port: 465,
  secure: true,
  auth: {
    user: 'development@khumo.co.bw',
    pass: 'x}@j@{qVQ2$Eg6+.'
  }
};

const transporter = nodemailer.createTransport(emailConfig);

// Enhanced password generation with better security
function generateSecurePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Parse employee name with better handling
function parseEmployeeName(fullName) {
  const nameParts = fullName.trim().split(/\s+/);
  
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

// Enhanced email template
async function sendWelcomeEmail(email, firstName, lastName, password, department, role) {
  const mailOptions = {
    from: '"AJA Timesheet System" <development@khumo.co.bw>',
    to: email,
    subject: 'Welcome to AJA Timesheet System - Your Account Details',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300;">Welcome to AJA Timesheet System</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your account has been created successfully</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
            Dear <strong>${firstName} ${lastName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">
            Welcome to the AJA Timesheet Management System! Your account has been successfully created and you can now access the system using the credentials below.
          </p>
          
          <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 25px; margin: 30px 0;">
            <h3 style="color: #495057; margin-top: 0; margin-bottom: 20px; font-size: 18px;">🔐 Your Login Credentials</h3>
            <div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #dee2e6;">
              <p style="margin: 8px 0; font-size: 16px;"><strong>Email Address:</strong> <span style="color: #007bff;">${email}</span></p>
              <p style="margin: 8px 0; font-size: 16px;"><strong>Password:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 14px; color: #d63384;">${password}</code></p>
              <p style="margin: 8px 0; font-size: 16px;"><strong>Department:</strong> ${department}</p>
              <p style="margin: 8px 0; font-size: 16px;"><strong>Role:</strong> ${role}</p>
            </div>
          </div>
          
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h4 style="color: #0c5460; margin-top: 0; margin-bottom: 15px;">⚠️ Important Security Information</h4>
            <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Please change your password immediately after your first login</li>
              <li style="margin-bottom: 8px;">Keep your login credentials secure and do not share them with anyone</li>
              <li style="margin-bottom: 8px;">If you suspect any unauthorized access, contact your administrator immediately</li>
              <li style="margin-bottom: 0;">Use a strong, unique password for your account</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://timesheet.aja.co.bw" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 500; display: inline-block; font-size: 16px;">
              🚀 Access Timesheet System
            </a>
          </div>
          
          <div style="border-top: 1px solid #dee2e6; padding-top: 25px; margin-top: 30px;">
            <h4 style="color: #495057; margin-bottom: 15px;">📋 Getting Started</h4>
            <ol style="color: #555; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Log in using the credentials provided above</li>
              <li style="margin-bottom: 8px;">Change your password in the profile settings</li>
              <li style="margin-bottom: 8px;">Familiarize yourself with the timesheet entry process</li>
              <li style="margin-bottom: 0;">Contact your supervisor if you have any questions</li>
            </ol>
          </div>
          
          <p style="color: #6c757d; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            Best regards,<br>
            <strong>AJA Timesheet System Administrator</strong><br>
            <em>This is an automated message. Please do not reply to this email.</em>
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: `Email sent successfully to ${email}` };
  } catch (error) {
    return { success: false, message: `Failed to send email to ${email}: ${error.message}` };
  }
}

// Main bulk seeding function
async function bulkSeedUsers(userList, options = {}) {
  const {
    skipDuplicates = true,
    sendEmails = true,
    batchSize = 10,
    delayBetweenBatches = 1000
  } = options;

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
    console.log(`⚙️  Options: Skip duplicates: ${skipDuplicates}, Send emails: ${sendEmails}, Batch size: ${batchSize}`);

    const results = {
      total: userList.length,
      created: 0,
      skipped: 0,
      errors: 0,
      emailsSent: 0,
      emailErrors: 0,
      details: []
    };

    // Process users in batches
    for (let i = 0; i < userList.length; i += batchSize) {
      const batch = userList.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(userList.length / batchSize)} (${batch.length} users)`);

      for (let j = 0; j < batch.length; j++) {
        const user = batch[j];
        const userIndex = i + j + 1;
        
        console.log(`\n👤 [${userIndex}/${userList.length}] Processing: ${user['Employee Name']} (${user['Email Address']})`);

        try {
          // Validate required fields
          const requiredFields = ['Employee Name', 'Department', 'Email Address', 'Role'];
          const missingFields = requiredFields.filter(field => !user[field]);
          
          if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
          }

          // Parse employee name
          const { firstName, lastName } = parseEmployeeName(user['Employee Name']);
          
          // Check if user already exists
          if (skipDuplicates) {
            const [existingUsers] = await connection.execute(
              'SELECT id FROM users WHERE email = ?',
              [user['Email Address']]
            );

            if (existingUsers.length > 0) {
              console.log(`⚠️  User already exists, skipping...`);
              results.skipped++;
              results.details.push({
                index: userIndex,
                name: user['Employee Name'],
                email: user['Email Address'],
                status: 'skipped',
                reason: 'User already exists'
              });
              continue;
            }
          }

          // Generate secure password
          const password = generateSecurePassword();
          
          // Hash password
          const saltRounds = 12;
          const hashedPassword = await bcrypt.hash(password, saltRounds);

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

          console.log(`✅ User created successfully`);

          // Send email if requested
          let emailResult = { success: true, message: 'Email sending disabled' };
          if (sendEmails) {
            emailResult = await sendWelcomeEmail(
              user['Email Address'],
              firstName,
              lastName,
              password,
              user['Department'],
              user['Role']
            );
            
            if (emailResult.success) {
              results.emailsSent++;
              console.log(`📧 ${emailResult.message}`);
            } else {
              results.emailErrors++;
              console.log(`❌ ${emailResult.message}`);
            }
          }

          results.created++;
          results.details.push({
            index: userIndex,
            name: user['Employee Name'],
            email: user['Email Address'],
            status: 'success',
            password: password,
            emailSent: emailResult.success
          });

        } catch (error) {
          console.error(`❌ Error: ${error.message}`);
          results.errors++;
          results.details.push({
            index: userIndex,
            name: user['Employee Name'],
            email: user['Email Address'],
            status: 'error',
            error: error.message
          });
        }
      }

      // Delay between batches to avoid overwhelming the system
      if (i + batchSize < userList.length) {
        console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    // Print comprehensive summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BULK SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total users processed: ${results.total}`);
    console.log(`✅ Users created successfully: ${results.created}`);
    console.log(`⚠️  Users skipped: ${results.skipped}`);
    console.log(`❌ Errors encountered: ${results.errors}`);
    console.log(`📧 Emails sent successfully: ${results.emailsSent}`);
    console.log(`📧 Email errors: ${results.emailErrors}`);

    if (results.errors > 0 || results.emailErrors > 0) {
      console.log('\n❌ DETAILED ERROR REPORT:');
      console.log('-'.repeat(40));
      results.details
        .filter(detail => detail.status === 'error' || (detail.emailSent === false))
        .forEach(detail => {
          console.log(`  ${detail.index}. ${detail.name} (${detail.email})`);
          if (detail.error) console.log(`     Error: ${detail.error}`);
          if (detail.emailSent === false) console.log(`     Email: Failed to send`);
        });
    }

    console.log('\n🎉 Bulk seeding completed!');
    return results;

  } catch (error) {
    console.error('❌ Bulk seeding failed:', error);
    throw error;
  } finally {
    try { 
      await connection.end(); 
    } catch (_) {}
  }
}

// Function to load users from various file formats
async function loadUsersFromFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.json') {
      return JSON.parse(data);
    } else if (ext === '.csv') {
      // Simple CSV parser (you might want to use a proper CSV library for complex files)
      const lines = data.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  } catch (error) {
    console.error('Error loading users from file:', error.message);
    return [];
  }
}

// CLI interface
async function main() {
  console.log('🚀 AJA Timesheet Bulk User Seeding Script');
  console.log('==========================================\n');

  const userFilePath = process.argv[2];
  const skipEmails = process.argv.includes('--no-email');
  const skipDuplicates = !process.argv.includes('--force');
  const batchSize = parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 10;

  if (!userFilePath) {
    console.log('Usage: node bulk-seed-users.js <users-file> [options]');
    console.log('Options:');
    console.log('  --no-email        Skip sending emails');
    console.log('  --force           Overwrite existing users');
    console.log('  --batch-size=N    Process N users at a time (default: 10)');
    console.log('\nExample: node bulk-seed-users.js users.json --batch-size=5');
    process.exit(1);
  }

  console.log(`📁 Loading users from: ${userFilePath}`);
  const usersToSeed = await loadUsersFromFile(userFilePath);
  
  if (usersToSeed.length === 0) {
    console.log('❌ No users found in file or file could not be read');
    process.exit(1);
  }

  console.log(`📊 Total users to process: ${usersToSeed.length}`);
  console.log(`⚙️  Configuration: Skip duplicates: ${skipDuplicates}, Send emails: ${!skipEmails}, Batch size: ${batchSize}\n`);

  const options = {
    skipDuplicates,
    sendEmails: !skipEmails,
    batchSize,
    delayBetweenBatches: 1000
  };

  try {
    const results = await bulkSeedUsers(usersToSeed, options);
    
    // Save results to file
    const resultsFile = `seeding-results-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { bulkSeedUsers, loadUsersFromFile, generateSecurePassword, parseEmployeeName };

