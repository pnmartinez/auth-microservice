import { db } from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt.util';
import { tokenService } from './token.service';
import { emailService } from './email.service';
import { roleService } from './role.service';
import { signAccessToken } from '../config/jwt';
import { logger } from '../utils/logger.util';
import { withTransaction } from '../utils/transaction.util';
import {
  AuthenticationError,
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  email_verified: boolean;
  azure_id?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<{ user: User; verificationToken: string }> {
    // Validate password
    if (data.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    return await withTransaction(async (trx) => {
      // Check if user already exists
      const existingUser = await trx('users').where({ email: data.email }).first();
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Create user
      const [user] = await trx('users')
        .insert({
          email: data.email,
          password_hash: passwordHash,
          email_verified: false,
          is_active: true,
        })
        .returning('*');

      // Create verification token
      const verificationToken = await tokenService.createEmailVerificationToken(user.id, trx);

      // Assign default role (user) - outside transaction to avoid issues if roles don't exist yet
      // This will be retried if it fails
      const assignRoleAsync = async () => {
        try {
          await roleService.assignRole(user.id, 'user');
          
          // Check if this is the first user, assign admin role
          const userCount = await db('users').count('* as count').first();
          if (parseInt(userCount?.count as string || '0') === 1) {
            await roleService.assignRole(user.id, 'admin');
            logger.info('First user assigned admin role:', user.id);
          }
        } catch (error) {
          logger.warn('Failed to assign role, will retry later:', error);
        }
      };
      
      // Don't await, run async
      assignRoleAsync();

      // Send verification email (async, don't wait for it)
      emailService.sendVerificationEmail(user.email, verificationToken).catch((error) => {
        logger.error('Failed to send verification email:', error);
      });

      return { user, verificationToken };
    });
  }

  async login(data: LoginData, ipAddress: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }> {
    // Find user
    const user = await db('users').where({ email: data.email }).first();
    
    if (!user) {
      await this.recordLoginAttempt(data.email, ipAddress, false);
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      await this.recordLoginAttempt(data.email, ipAddress, false);
      throw new AuthenticationError('Account is disabled');
    }

    // Check if email is verified
    if (!user.email_verified) {
      await this.recordLoginAttempt(data.email, ipAddress, false);
      throw new AuthenticationError('Email not verified');
    }

    // Check password
    if (!user.password_hash) {
      await this.recordLoginAttempt(data.email, ipAddress, false);
      throw new AuthenticationError('Invalid credentials');
    }

    const passwordValid = await comparePassword(data.password, user.password_hash);
    if (!passwordValid) {
      await this.recordLoginAttempt(data.email, ipAddress, false);
      throw new AuthenticationError('Invalid credentials');
    }

    return await withTransaction(async (trx) => {
      // Update last login
      await trx('users')
        .where({ id: user.id })
        .update({ last_login: new Date() });

      // Record successful login
      await this.recordLoginAttempt(data.email, ipAddress, true);

      // Generate tokens
      const accessToken = signAccessToken({ userId: user.id, email: user.email });
      const refreshToken = await tokenService.createRefreshToken(user.id, trx);

      return {
        accessToken,
        refreshToken,
        user,
      };
    });
  }

  async loginWithAzure(azureId: string, email: string, _name?: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }> {
    return await withTransaction(async (trx) => {
      // Find or create user
      let user = await trx('users').where({ azure_id: azureId }).first();

      if (!user) {
        // Check if email exists
        const existingUser = await trx('users').where({ email }).first();
        if (existingUser) {
          // Link Azure account to existing user
          await trx('users')
            .where({ id: existingUser.id })
            .update({ azure_id: azureId, email_verified: true });
          user = { ...existingUser, azure_id: azureId, email_verified: true };
        } else {
          // Create new user
          const [newUser] = await trx('users')
            .insert({
              email,
              azure_id: azureId,
              email_verified: true,
              is_active: true,
            })
            .returning('*');
          user = newUser;
        }
      } else {
        // Update last login
        await trx('users')
          .where({ id: user.id })
          .update({ last_login: new Date(), email_verified: true });
        user = { ...user, last_login: new Date(), email_verified: true };
      }

      // Generate tokens
      const accessToken = signAccessToken({ userId: user.id, email: user.email });
      const refreshToken = await tokenService.createRefreshToken(user.id, trx);

      return {
        accessToken,
        refreshToken,
        user,
      };
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const result = await tokenService.validateEmailVerificationToken(token);
    if (!result) {
      throw new ValidationError('Invalid or expired verification token');
    }

    await db('users')
      .where({ id: result.userId })
      .update({ email_verified: true });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await db('users').where({ email }).first();
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.email_verified) {
      throw new ValidationError('Email already verified');
    }

    const verificationToken = await tokenService.createEmailVerificationToken(user.id);
    emailService.sendVerificationEmail(user.email, verificationToken).catch((error) => {
      logger.error('Failed to send verification email:', error);
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await db('users').where({ email }).first();
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    if (!user.password_hash) {
      // User registered with Azure only
      return;
    }

    const resetToken = await tokenService.createPasswordResetToken(user.id);
    await emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const result = await tokenService.validatePasswordResetToken(token);
    if (!result) {
      throw new ValidationError('Invalid or expired reset token');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    return await withTransaction(async (trx) => {
      const passwordHash = await hashPassword(newPassword);

      await trx('users')
        .where({ id: result.userId })
        .update({ password_hash: passwordHash });

      // Revoke all refresh tokens
      await tokenService.revokeAllUserTokens(result.userId, trx);

      // Mark token as used
      await tokenService.markPasswordResetTokenAsUsed(token, trx);
    });
  }

  async logout(refreshToken: string): Promise<void> {
    await tokenService.revokeRefreshToken(refreshToken);
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const result = await tokenService.validateRefreshToken(refreshToken);
    if (!result) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const user = await db('users').where({ id: result.userId }).first();
    if (!user || !user.is_active) {
      throw new AuthenticationError('User not found or inactive');
    }

    return signAccessToken({ userId: user.id, email: user.email });
  }

  private async recordLoginAttempt(email: string, ipAddress: string, success: boolean): Promise<void> {
    try {
      await db('login_attempts').insert({
        email,
        ip_address: ipAddress,
        success,
      });
    } catch (error) {
      logger.error('Error recording login attempt:', error);
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    return db('users').where({ id: userId }).first();
  }
}

export const authService = new AuthService();

