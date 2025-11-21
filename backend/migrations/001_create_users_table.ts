import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).nullable();
    table.boolean('email_verified').notNullable().defaultTo(false);
    table.string('azure_id', 255).nullable().unique();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_login', { useTz: true }).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    
    // Indexes
    table.index('email');
    table.index('azure_id');
    table.index('email_verified');
    table.index('is_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}

