import knex, { Knex } from 'knex';
import config from '../../knexfile';

const environment = process.env.NODE_ENV || 'development';

if (environment === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be configured in production to avoid default credentials');
}

const dbConfig = config[environment];

export const db: Knex = knex(dbConfig);

export async function testConnection(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  await db.destroy();
}

