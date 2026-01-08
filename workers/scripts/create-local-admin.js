// Quick script to create a local admin user with proper password hash
import bcrypt from 'bcryptjs';

const password = 'admin123'; // Simple dev password
const hash = await bcrypt.hash(password, 10);

console.log('Password hash:', hash);
console.log('\nRun this SQL command:');
console.log(`
DELETE FROM admins WHERE username = 'admin';
INSERT INTO admins (username, password_hash, email, full_name, is_super_admin, assigned_regions)
VALUES ('admin', '${hash}', 'admin@local.dev', 'Local Admin', 1, NULL);
`);

console.log('\nThen login with:');
console.log('Username: admin');
console.log('Password: admin123');
