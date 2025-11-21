import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { logger } from '../utils/logger.util';
import { Knex } from 'knex';

export class TokenService {
  async createRefreshToken(userId: string, trx?: Knex.Transaction): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const query = trx || db;
    await query('refresh_tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
    });

    return token;
  }

  async validateRefreshToken(token: string): Promise<{ userId: string } | null> {
    const refreshToken = await db('refresh_tokens')
      .where({ token, revoked: false })
      .where('expires_at', '>', new Date())
      .first();

    if (!refreshToken) {
      return null;
    }

    // Update last_used_at
    await db('refresh_tokens')
      .where({ id: refreshToken.id })
      .update({ last_used_at: new Date() });

    return { userId: refreshToken.user_id };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await db('refresh_tokens')
      .where({ token })
      .update({ revoked: true });
  }

  async revokeAllUserTokens(userId: string, trx?: Knex.Transaction): Promise<void> {
    const query = trx || db;
    await query('refresh_tokens')
      .where({ user_id: userId })
      .update({ revoked: true });
  }

  async createEmailVerificationToken(userId: string, trx?: Knex.Transaction): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    const query = trx || db;
    await query('email_verifications').insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
    });

    return token;
  }

  async validateEmailVerificationToken(token: string): Promise<{ userId: string } | null> {
    const verification = await db('email_verifications')
      .where({ token })
      .where('expires_at', '>', new Date())
      .first();

    if (!verification) {
      return null;
    }

    // Mark as used by deleting it
    await db('email_verifications')
      .where({ id: verification.id })
      .delete();

    return { userId: verification.user_id };
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    await db('password_resets').insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
    });

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<{ userId: string } | null> {
    const reset = await db('password_resets')
      .where({ token, used: false })
      .where('expires_at', '>', new Date())
      .first();

    if (!reset) {
      return null;
    }

    return { userId: reset.user_id };
  }

  async markPasswordResetTokenAsUsed(token: string, trx?: Knex.Transaction): Promise<void> {
    const query = trx || db;
    await query('password_resets')
      .where({ token })
      .update({ used: true });
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      
      await db('refresh_tokens')
        .where('expires_at', '<', now)
        .delete();

      await db('email_verifications')
        .where('expires_at', '<', now)
        .delete();

      await db('password_resets')
        .where('expires_at', '<', now)
        .delete();

      logger.info('Cleaned up expired tokens');
    } catch (error) {
      logger.error('Error cleaning up expired tokens:', error);
    }
  }
}

export const tokenService = new TokenService();

