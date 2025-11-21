import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { db } from '../src/config/database';

// Setup test database
beforeAll(async () => {
  // Ensure database connection
  try {
    await db.raw('SELECT 1');
  } catch (error) {
    console.warn('Database connection failed, tests may fail:', error);
  }
});

afterAll(async () => {
  // Close database connection
  await db.destroy();
});

// Clean up after each test
afterEach(async () => {
  try {
    // Clean up test data
    await db('login_attempts').delete();
    await db('password_resets').delete();
    await db('email_verifications').delete();
    await db('refresh_tokens').delete();
    await db('user_roles').delete();
    await db('users').delete();
  } catch (error) {
    // Ignore cleanup errors
  }
});

