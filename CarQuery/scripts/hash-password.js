
const bcrypt = require('bcrypt');

if (process.argv.length < 3) {
  console.log('Usage: node scripts/hash-password.js <password>');
  console.log('Example: node scripts/hash-password.js mySecurePassword123');
  process.exit(1);
}

const password = process.argv[2];
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  
  console.log('\n=== Password Hash Generated ===');
  console.log('Add this to your .env file:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('\nOr set it in your environment variables in production.');
  console.log('Keep this hash secure and never commit it to version control!');
});
