import { Knex } from 'knex';
import { db } from '../config/database';
import { logger } from './logger.util';

/**
 * Execute a function within a database transaction
 * Automatically commits on success or rolls back on error
 */
export async function withTransaction<T>(
  callback: (trx: Knex.Transaction) => Promise<T>
): Promise<T> {
  const trx = await db.transaction();
  
  try {
    const result = await callback(trx);
    await trx.commit();
    return result;
  } catch (error) {
    await trx.rollback();
    logger.error('Transaction rolled back:', error);
    throw error;
  }
}

