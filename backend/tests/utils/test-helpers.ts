import { db } from '../../src/config/database';
import { hashPassword } from '../../src/utils/bcrypt.util';

export async function createTestUser(overrides: any = {}) {
  const defaultUser = {
    email: 'test@example.com',
    password_hash: await hashPassword('TestPassword123'),
    email_verified: true,
    is_active: true,
    ...overrides,
  };

  const [user] = await db('users').insert(defaultUser).returning('*');
  return user;
}

export async function createTestUserWithRole(roleName: string = 'user', overrides: any = {}) {
  const user = await createTestUser(overrides);
  
  // Get role
  const role = await db('roles').where({ name: roleName }).first();
  if (role) {
    await db('user_roles').insert({
      user_id: user.id,
      role_id: role.id,
    });
  }
  
  return user;
}

export async function cleanupTestData() {
  await db('login_attempts').delete();
  await db('password_resets').delete();
  await db('email_verifications').delete();
  await db('refresh_tokens').delete();
  await db('user_roles').delete();
  await db('users').delete();
}

