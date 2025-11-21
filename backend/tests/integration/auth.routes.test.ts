import request from 'supertest';
import app from '../../src/app';
import { createTestUser, cleanupTestData } from '../utils/test-helpers';
import { hashPassword } from '../../src/utils/bcrypt.util';
import { signAccessToken } from '../../src/config/jwt';

describe('Auth Routes', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123',
        })
        .expect(201);

      expect(response.body.message).toContain('registered successfully');
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    it('should return 400 for invalid email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123',
        })
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
        })
        .expect(400);
    });

    it('should return 409 for duplicate email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123',
        })
        .expect(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully', async () => {
      const passwordHash = await hashPassword('TestPass123');
      await createTestUser({
        email: 'login@example.com',
        password_hash: passwordHash,
        email_verified: true,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'TestPass123',
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPass',
        })
        .expect(401);
    });

    it('should return 401 for unverified email', async () => {
      const passwordHash = await hashPassword('TestPass123');
      await createTestUser({
        email: 'unverified@example.com',
        password_hash: passwordHash,
        email_verified: false,
      });

      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'unverified@example.com',
          password: 'TestPass123',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      const user = await createTestUser();
      const token = signAccessToken({ userId: user.id, email: user.email });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await createTestUser();
      const token = signAccessToken({ userId: user.id, email: user.email });

      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});

