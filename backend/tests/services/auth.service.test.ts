import { authService } from '../../src/services/auth.service';
import { db } from '../../src/config/database';
import { AuthenticationError, ValidationError, ConflictError } from '../../src/utils/errors';
import { createTestUser, cleanupTestData } from '../utils/test-helpers';
import { hashPassword } from '../../src/utils/bcrypt.util';

describe('AuthService', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'SecurePass123',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.email_verified).toBe(false);
      expect(result.verificationToken).toBeDefined();

      // Verify user exists in database
      const user = await db('users').where({ email: 'newuser@example.com' }).first();
      expect(user).toBeDefined();
      expect(user.password_hash).not.toBe('SecurePass123'); // Should be hashed
    });

    it('should throw ConflictError if email already exists', async () => {
      await createTestUser({ email: 'existing@example.com' });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'SecurePass123',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError for short password', async () => {
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'short',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const passwordHash = await hashPassword('TestPass123');
      const user = await createTestUser({
        email: 'login@example.com',
        password_hash: passwordHash,
        email_verified: true,
      });

      const result = await authService.login(
        { email: 'login@example.com', password: 'TestPass123' },
        '127.0.0.1'
      );

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe(user.id);
    });

    it('should throw AuthenticationError for invalid email', async () => {
      await expect(
        authService.login(
          { email: 'nonexistent@example.com', password: 'TestPass123' },
          '127.0.0.1'
        )
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for invalid password', async () => {
      await createTestUser({
        email: 'test@example.com',
        email_verified: true,
      });

      await expect(
        authService.login(
          { email: 'test@example.com', password: 'WrongPassword' },
          '127.0.0.1'
        )
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if email not verified', async () => {
      await createTestUser({
        email: 'unverified@example.com',
        email_verified: false,
      });

      await expect(
        authService.login(
          { email: 'unverified@example.com', password: 'TestPassword123' },
          '127.0.0.1'
        )
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if account is disabled', async () => {
      await createTestUser({
        email: 'disabled@example.com',
        email_verified: true,
        is_active: false,
      });

      await expect(
        authService.login(
          { email: 'disabled@example.com', password: 'TestPassword123' },
          '127.0.0.1'
        )
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const user = await createTestUser({ email_verified: false });
      
      // Create verification token
      const { tokenService } = await import('../../src/services/token.service');
      const token = await tokenService.createEmailVerificationToken(user.id);

      await authService.verifyEmail(token);

      const updatedUser = await db('users').where({ id: user.id }).first();
      expect(updatedUser.email_verified).toBe(true);
    });

    it('should throw ValidationError for invalid token', async () => {
      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(ValidationError);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const user = await createTestUser();
      const { tokenService } = await import('../../src/services/token.service');
      const token = await tokenService.createPasswordResetToken(user.id);

      await authService.resetPassword(token, 'NewSecurePass123');

      const updatedUser = await db('users').where({ id: user.id }).first();
      expect(updatedUser.password_hash).not.toBe(user.password_hash);
    });

    it('should throw ValidationError for invalid token', async () => {
      await expect(
        authService.resetPassword('invalid-token', 'NewPass123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for short password', async () => {
      const user = await createTestUser();
      const tokenService = require('../../src/services/token.service').tokenService;
      const token = await tokenService.createPasswordResetToken(user.id);

      await expect(
        authService.resetPassword(token, 'short')
      ).rejects.toThrow(ValidationError);
    });
  });
});

