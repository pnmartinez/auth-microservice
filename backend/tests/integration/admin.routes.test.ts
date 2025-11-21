import request from 'supertest';
import app from '../../src/app';
import { db } from '../../src/config/database';
import { createTestUserWithRole, cleanupTestData } from '../utils/test-helpers';
import { signAccessToken } from '../../src/config/jwt';

describe('Admin Routes', () => {
  let adminToken: string;
  let adminUser: any;
  let regularToken: string;
  let regularUser: any;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Ensure roles exist
    const adminRole = await db('roles').where({ name: 'admin' }).first();
    if (!adminRole) {
      await db('roles').insert([
        { name: 'admin', description: 'Administrator' },
        { name: 'user', description: 'Regular user' },
      ]);
    }

    // Create admin user
    adminUser = await createTestUserWithRole('admin', { email: 'admin@example.com' });
    adminToken = signAccessToken({ userId: adminUser.id, email: adminUser.email });

    // Create regular user
    regularUser = await createTestUserWithRole('user', { email: 'user@example.com' });
    regularToken = signAccessToken({ userId: regularUser.id, email: regularUser.email });
  });

  describe('GET /api/v1/admin/users', () => {
    it('should return users list for admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should return 403 for non-admin user', async () => {
      await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/v1/admin/users')
        .expect(401);
    });
  });

  describe('GET /api/v1/admin/stats', () => {
    it('should return statistics for admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users).toBeDefined();
      expect(response.body.sessions).toBeDefined();
      expect(response.body.security).toBeDefined();
    });

    it('should return 403 for non-admin user', async () => {
      await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);
    });
  });
});

