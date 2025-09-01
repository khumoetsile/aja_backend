const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const saltRounds = 12;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash verification:', isValid);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash(); 