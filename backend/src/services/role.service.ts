import { db } from '../config/database';
import { NotFoundError } from '../utils/errors';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
}

export class RoleService {
  async getUserRoles(userId: string): Promise<Role[]> {
    const roles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', userId)
      .select('roles.*');

    return roles;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const permissions = await db('user_roles')
      .join('role_permissions', 'user_roles.role_id', 'role_permissions.role_id')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('user_roles.user_id', userId)
      .select('permissions.name');

    return permissions.map((p: { name: string }) => p.name);
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.some((role) => role.name === roleName);
  }

  async assignRole(userId: string, roleName: string, trx?: any): Promise<void> {
    const query = trx || db;
    const role = await query('roles').where({ name: roleName }).first();
    if (!role) {
      throw new NotFoundError(`Role: ${roleName}`);
    }

    // Check if already assigned
    const existing = await query('user_roles')
      .where({ user_id: userId, role_id: role.id })
      .first();

    if (!existing) {
      await query('user_roles').insert({
        user_id: userId,
        role_id: role.id,
      });
    }
  }

  async removeRole(userId: string, roleName: string): Promise<void> {
    const role = await db('roles').where({ name: roleName }).first();
    if (!role) {
      throw new NotFoundError(`Role: ${roleName}`);
    }

    await db('user_roles')
      .where({ user_id: userId, role_id: role.id })
      .delete();
  }

  async getAllRoles(): Promise<Role[]> {
    return db('roles').select('*').orderBy('name');
  }

  async getAllPermissions(): Promise<Permission[]> {
    return db('permissions').select('*').orderBy('name');
  }
}

export const roleService = new RoleService();

