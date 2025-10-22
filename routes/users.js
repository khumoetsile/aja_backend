const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
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

// Generate secure password
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

// Parse employee name
function parseEmployeeName(fullName) {
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  }
  
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  
  return { firstName, lastName };
}

// Send welcome email
async function sendWelcomeEmail(email, firstName, lastName, password, department, role) {
  const mailOptions = {
    from: 'development@khumo.co.bw',
    to: email,
    subject: 'Welcome to AJA Timesheet System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Welcome to AJA Timesheet System</h2>
        <p>Hello ${firstName} ${lastName},</p>
        <p>Your account has been created in the AJA Timesheet System.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Login Credentials:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p><strong>Department:</strong> ${department}</p>
          <p><strong>Role:</strong> ${role}</p>
        </div>
        
        <p>Please log in at: <a href="https://timesheet.aja.co.bw">https://timesheet.aja.co.bw</a></p>
        <p>For security reasons, please change your password after your first login.</p>
        
        <p>Best regards,<br>AJA Timesheet System</p>
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

// Bulk seed users endpoint
router.post('/bulk-seed', async (req, res) => {
  const { users, options = {} } = req.body;
  const { sendEmails = false, skipDuplicates = true } = options;

  if (!users || !Array.isArray(users)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Users array is required' 
    });
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aja_timesheet',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log(`📋 Processing ${users.length} users...`);
    console.log(`⚙️  Options: Skip duplicates: ${skipDuplicates}, Send emails: ${sendEmails}`);

    const results = {
      total: users.length,
      created: 0,
      skipped: 0,
      errors: 0,
      emailsSent: 0,
      emailErrors: 0,
      details: []
    };

    for (const user of users) {
      try {
        // Validate required fields
        if (!user['Email Address'] || !user['Employee Name'] || !user['Role']) {
          results.errors++;
          results.details.push({
            user: user['Employee Name'] || 'Unknown',
            status: 'error',
            error: 'Missing required fields (Email, Name, or Role)'
          });
          continue;
        }

        // Check if user already exists
        if (skipDuplicates) {
          const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [user['Email Address']]
          );

          if (existingUsers.length > 0) {
            results.skipped++;
            results.details.push({
              user: user['Employee Name'],
              status: 'skipped',
              reason: 'User already exists'
            });
            continue;
          }
        }

        // Parse name
        const { firstName, lastName } = parseEmployeeName(user['Employee Name']);
        
        // Generate password
        const password = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await connection.execute(
          `INSERT INTO users (email, password, first_name, last_name, role, department, is_active, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            user['Email Address'],
            hashedPassword,
            firstName,
            lastName,
            user['Role'],
            user['Department'] || 'Operations',
            true
          ]
        );

        results.created++;
        console.log(`✅ User created: ${user['Employee Name']} (${user['Email Address']})`);

        // Send email if requested
        let emailResult = { success: true, message: 'Email sending disabled' };
        if (sendEmails) {
          emailResult = await sendWelcomeEmail(
            user['Email Address'],
            firstName,
            lastName,
            password,
            user['Department'] || 'Operations',
            user['Role']
          );
          
          if (emailResult.success) {
            results.emailsSent++;
          } else {
            results.emailErrors++;
          }
        }

        results.details.push({
          user: user['Employee Name'],
          status: 'created',
          email: user['Email Address'],
          department: user['Department'] || 'Operations',
          role: user['Role'],
          emailSent: emailResult.success
        });

      } catch (error) {
        results.errors++;
        results.details.push({
          user: user['Employee Name'] || 'Unknown',
          status: 'error',
          error: error.message
        });
        console.error(`❌ Error creating user ${user['Employee Name']}:`, error.message);
      }
    }

    console.log(`📊 Results: ${results.created} created, ${results.skipped} skipped, ${results.errors} errors`);
    if (sendEmails) {
      console.log(`📧 Emails: ${results.emailsSent} sent, ${results.emailErrors} failed`);
    }

    res.json({
      success: true,
      message: `Processed ${users.length} users successfully`,
      results
    });

  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error occurred',
      error: error.message
    });
  } finally {
    await connection.end();
  }
});

// Get all users endpoint
router.get('/', async (req, res) => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aja_timesheet',
    port: process.env.DB_PORT || 3306
  });

  try {
    const [users] = await connection.execute(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.department,
        u.is_active,
        u.created_at,
        COUNT(t.id) as timesheet_entries
      FROM users u
      LEFT JOIN timesheet_entries t ON u.id = t.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  } finally {
    await connection.end();
  }
});

module.exports = router;
