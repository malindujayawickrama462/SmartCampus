const mysql = require('mysql2/promise');
const crypto = require('crypto');

// BCrypt hash of "technician123" — pre-computed since we can't run bcrypt here
// We'll insert with a known password and Spring will verify via BCrypt
// Instead, let's just update an existing user OR insert with no password (OAuth only)
// Best approach: set role on existing user after registration

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '5631#$%Ap',
    database: 'smartCampusDB'
  });

  // Check if technician user already exists
  const [rows] = await conn.execute("SELECT id, email, role FROM users WHERE email = 'technician@campus.com'");
  
  if (rows.length > 0) {
    const user = rows[0];
    console.log('Found user:', user);
    if (user.role !== 'TECHNICIAN') {
      await conn.execute("UPDATE users SET role = 'TECHNICIAN' WHERE email = 'technician@campus.com'");
      console.log('✅ Role updated to TECHNICIAN');
    } else {
      console.log('✅ Already a TECHNICIAN');
    }
  } else {
    console.log('❌ User technician@campus.com does not exist yet.');
    console.log('   Please register at http://localhost:5173/register with email: technician@campus.com');
    console.log('   Then run this script again to upgrade the role.');
  }

  // Also show all current users and their roles
  const [allUsers] = await conn.execute("SELECT id, name, email, role FROM users");
  console.log('\n📋 All users in database:');
  console.table(allUsers);

  await conn.end();
}

main().catch(console.error);
