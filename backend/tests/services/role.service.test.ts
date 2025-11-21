import { roleService } from '../../src/services/role.service';
import { db } from '../../src/config/database';
import { NotFoundError } from '../../src/utils/errors';
import { createTestUser, cleanupTestData } from '../utils/test-helpers';

describe('RoleService', () => {
  beforeEach(async () => {
    await cleanupTestData();
    // Ensure roles exist (run seed if needed)
    const adminRole = await db('roles').where({ name: 'admin' }).first();
    if (!adminRole) {
      // Create basic roles for testing
      await db('roles').insert([
        { name: 'admin', description: 'Administrator' },
        { name: 'user', description: 'Regular user' },
      ]);
    }
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      const user = await createTestUser();
      
      await roleService.assignRole(user.id, 'user');

      const userRoles = await roleService.getUserRoles(user.id);
      expect(userRoles).toHaveLength(1);
      expect(userRoles[0].name).toBe('user');
    });

    it('should not duplicate role assignment', async () => {
      const user = await createTestUser();
      
      await roleService.assignRole(user.id, 'user');
      await roleService.assignRole(user.id, 'user');

      const userRoles = await roleService.getUserRoles(user.id);
      expect(userRoles).toHaveLength(1);
    });

    it('should throw NotFoundError for non-existent role', async () => {
      const user = await createTestUser();
      
      await expect(
        roleService.assignRole(user.id, 'nonexistent')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has role', async () => {
      const user = await createTestUser();
      await roleService.assignRole(user.id, 'admin');

      const hasRole = await roleService.hasRole(user.id, 'admin');
      expect(hasRole).toBe(true);
    });

    it('should return false if user does not have role', async () => {
      const user = await createTestUser();

      const hasRole = await roleService.hasRole(user.id, 'admin');
      expect(hasRole).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has permission through role', async () => {
      const user = await createTestUser();
      await roleService.assignRole(user.id, 'admin');

      // Admin role should have all permissions
      const hasPermission = await roleService.hasPermission(user.id, 'admin.panel');
      expect(hasPermission).toBe(true);
    });

    it('should return false if user does not have permission', async () => {
      const user = await createTestUser();
      await roleService.assignRole(user.id, 'user');

      const hasPermission = await roleService.hasPermission(user.id, 'admin.panel');
      expect(hasPermission).toBe(false);
    });
  });
});

