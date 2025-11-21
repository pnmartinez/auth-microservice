import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';

export class AdminController {
  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;

      let query = db('users').select(
        'id',
        'email',
        'email_verified',
        'azure_id',
        'created_at',
        'updated_at',
        'last_login',
        'is_active'
      );

      if (search) {
        query = query.where('email', 'ilike', `%${search}%`);
      }

      const [users, total] = await Promise.all([
        query.limit(limit).offset(offset).orderBy('created_at', 'desc'),
        db('users').count('* as count').first(),
      ]);

      res.json({
        users,
        pagination: {
          page,
          limit,
          total: parseInt(total?.count as string || '0'),
          totalPages: Math.ceil(parseInt(total?.count as string || '0') / limit),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get users';
      res.status(500).json({ error: message });
    }
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await db('users').where({ id }).first();

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get related data
      const [refreshTokens, loginAttempts] = await Promise.all([
        db('refresh_tokens')
          .where({ user_id: id, revoked: false })
          .where('expires_at', '>', new Date())
          .select('id', 'created_at', 'last_used_at', 'expires_at'),
        db('login_attempts')
          .where({ email: user.email })
          .orderBy('created_at', 'desc')
          .limit(10)
          .select('success', 'ip_address', 'created_at'),
      ]);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          azure_id: user.azure_id,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_login: user.last_login,
          is_active: user.is_active,
        },
        refreshTokens,
        recentLoginAttempts: loginAttempts,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json({ error: message });
    }
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { is_active, email_verified } = req.body;

      const updates: Record<string, unknown> = {};
      if (typeof is_active === 'boolean') updates.is_active = is_active;
      if (typeof email_verified === 'boolean') updates.email_verified = email_verified;

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ error: 'No valid fields to update' });
        return;
      }

      updates.updated_at = new Date();

      await db('users').where({ id }).update(updates);
      const user = await db('users').where({ id }).first();

      res.json({ user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      res.status(500).json({ error: message });
    }
  }

  async getRefreshTokens(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const userId = req.query.userId as string;

      let query = db('refresh_tokens')
        .select(
          'refresh_tokens.id',
          'refresh_tokens.token',
          'refresh_tokens.created_at',
          'refresh_tokens.last_used_at',
          'refresh_tokens.expires_at',
          'refresh_tokens.revoked',
          'users.email'
        )
        .join('users', 'refresh_tokens.user_id', 'users.id');

      if (userId) {
        query = query.where('refresh_tokens.user_id', userId);
      }

      const [tokens, total] = await Promise.all([
        query.limit(limit).offset(offset).orderBy('refresh_tokens.created_at', 'desc'),
        userId
          ? db('refresh_tokens').where({ user_id: userId }).count('* as count').first()
          : db('refresh_tokens').count('* as count').first(),
      ]);

      res.json({
        tokens: tokens.map((t: { token: string }) => ({
          ...t,
          token: t.token.substring(0, 8) + '...', // Don't expose full token
        })),
        pagination: {
          page,
          limit,
          total: parseInt(total?.count as string || '0'),
          totalPages: Math.ceil(parseInt(total?.count as string || '0') / limit),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get refresh tokens';
      res.status(500).json({ error: message });
    }
  }

  async revokeToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await db('refresh_tokens').where({ id }).update({ revoked: true });
      res.json({ message: 'Token revoked successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke token';
      res.status(500).json({ error: message });
    }
  }

  async getLoginAttempts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      const email = req.query.email as string;

      let query = db('login_attempts')
        .select('id', 'email', 'ip_address', 'success', 'created_at')
        .orderBy('created_at', 'desc');

      if (email) {
        query = query.where('email', email);
      }

      const [attempts, total] = await Promise.all([
        query.limit(limit).offset(offset),
        email
          ? db('login_attempts').where({ email }).count('* as count').first()
          : db('login_attempts').count('* as count').first(),
      ]);

      res.json({
        attempts,
        pagination: {
          page,
          limit,
          total: parseInt(total?.count as string || '0'),
          totalPages: Math.ceil(parseInt(total?.count as string || '0') / limit),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get login attempts';
      res.status(500).json({ error: message });
    }
  }

  async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        activeTokens,
        failedLogins,
      ] = await Promise.all([
        db('users').count('* as count').first(),
        db('users').where({ is_active: true }).count('* as count').first(),
        db('users').where({ email_verified: true }).count('* as count').first(),
        db('refresh_tokens')
          .where({ revoked: false })
          .where('expires_at', '>', new Date())
          .count('* as count')
          .first(),
        db('login_attempts')
          .where({ success: false })
          .where('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
          .count('* as count')
          .first(),
      ]);

      res.json({
        users: {
          total: parseInt(totalUsers?.count as string || '0'),
          active: parseInt(activeUsers?.count as string || '0'),
          verified: parseInt(verifiedUsers?.count as string || '0'),
        },
        sessions: {
          active: parseInt(activeTokens?.count as string || '0'),
        },
        security: {
          failedLoginsLast24h: parseInt(failedLogins?.count as string || '0'),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get stats';
      res.status(500).json({ error: message });
    }
  }

  async getTableData(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { table } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      // Whitelist allowed tables
      const allowedTables = [
        'users',
        'email_verifications',
        'password_resets',
        'refresh_tokens',
        'login_attempts',
      ];

      if (!allowedTables.includes(table)) {
        res.status(400).json({ error: 'Invalid table name' });
        return;
      }

      const [data, total] = await Promise.all([
        db(table).select('*').limit(limit).offset(offset).orderBy('created_at', 'desc'),
        db(table).count('* as count').first(),
      ]);

      res.json({
        table,
        data,
        pagination: {
          page,
          limit,
          total: parseInt(total?.count as string || '0'),
          totalPages: Math.ceil(parseInt(total?.count as string || '0') / limit),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get table data';
      res.status(500).json({ error: message });
    }
  }
}

export const adminController = new AdminController();

