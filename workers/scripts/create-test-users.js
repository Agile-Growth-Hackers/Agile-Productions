/**
 * Script to create test admin users for E2E testing
 * Run with: node scripts/create-test-users.js
 */

import { hashPassword } from '../src/utils/password.js';

const TEST_USERS = [
  {
    username: 'test-admin',
    email: 'test-admin@agileproductions.test',
    fullName: 'Test Admin User',
    password: 'TestAdmin123!',
    isSuperAdmin: false
  },
  {
    username: 'test-superadmin',
    email: 'test-superadmin@agileproductions.test',
    fullName: 'Test Super Admin User',
    password: 'TestSuperAdmin123!',
    isSuperAdmin: true
  }
];

async function generateSQL() {
  console.log('Generating SQL for test users...\n');
  console.log('-- SQL to create test admin users for E2E testing');
  console.log('-- Generated:', new Date().toISOString());
  console.log();

  for (const user of TEST_USERS) {
    const passwordHash = await hashPassword(user.password);

    console.log(`-- ${user.fullName} (${user.username})`);
    console.log(`INSERT INTO admins (username, email, full_name, password_hash, is_super_admin, is_active, is_test_account)`);
    console.log(`VALUES ('${user.username}', '${user.email}', '${user.fullName}', '${passwordHash}', ${user.isSuperAdmin ? 1 : 0}, 1, 1);`);
    console.log();
  }

  console.log('\n=== Test Credentials ===');
  console.log('\nRegular Admin:');
  console.log('  Username:', TEST_USERS[0].username);
  console.log('  Password:', TEST_USERS[0].password);
  console.log('\nSuper Admin:');
  console.log('  Username:', TEST_USERS[1].username);
  console.log('  Password:', TEST_USERS[1].password);
  console.log('\n=== GitHub Secrets Configuration ===');
  console.log('\nAdd these secrets to your GitHub repository:');
  console.log('https://github.com/Agile-Growth-Hackers/Agile-Productions/settings/secrets/actions');
  console.log();
  console.log(`TEST_ADMIN_USERNAME=${TEST_USERS[0].username}`);
  console.log(`TEST_ADMIN_PASSWORD=${TEST_USERS[0].password}`);
  console.log(`TEST_SUPER_ADMIN_USERNAME=${TEST_USERS[1].username}`);
  console.log(`TEST_SUPER_ADMIN_PASSWORD=${TEST_USERS[1].password}`);
  console.log();
}

generateSQL().catch(console.error);
