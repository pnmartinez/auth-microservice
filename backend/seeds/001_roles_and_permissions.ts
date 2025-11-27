import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('role_permissions').del();
  await knex('permissions').del();
  await knex('roles').del();

  const permissions = await knex('permissions')
    .insert([
    { name: 'users.read', description: 'View users' },
    { name: 'users.write', description: 'Create and update users' },
    { name: 'users.delete', description: 'Delete users' },
    { name: 'admin.panel', description: 'Access admin panel' },
    { name: 'admin.stats', description: 'View statistics' },
    { name: 'admin.tokens', description: 'Manage tokens' },
    { name: 'admin.logs', description: 'View security logs' },
  ])
    .returning('id');

  const [adminRole] = await knex('roles')
    .insert([
    { name: 'admin', description: 'Administrator with full access' },
    { name: 'user', description: 'Regular user' },
  ])
    .returning('id');

  await knex('role_permissions').insert(
    permissions.map((perm) => ({
      role_id: adminRole.id,
      permission_id: perm.id,
    }))
  );
}

