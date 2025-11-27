import dotenv from 'dotenv';
import path from 'path';
import { db } from '../src/config/database';

// Ensure we load test environment variables before anything else
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

beforeAll(async () => {
  try {
    await db.migrate.latest();
    await db.seed.run();
  } catch (error) {
    console.error('Error preparing test database:', error);
    throw error;
  }
});

afterEach(async () => {
  try {
    await db('login_attempts').del();
    await db('refresh_tokens').del();
    await db('email_verifications').del();
    await db('password_resets').del();
    await db('user_roles').del();
    await db('users').del();
  } catch (error) {
    console.warn('Cleanup failed:', error);
  }
});

afterAll(async () => {
  await db.migrate.rollback(undefined, true);
  await db.destroy();
});

