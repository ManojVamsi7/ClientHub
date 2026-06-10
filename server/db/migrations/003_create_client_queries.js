/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('client_queries', (table) => {
    table.uuid('id').primary();
    table
      .uuid('client_id')
      .notNullable()
      .references('id')
      .inTable('clients')
      .onDelete('CASCADE');
    table.text('issue_description').notNullable();
    table
      .enu('category', ['technical', 'billing', 'account', 'other'])
      .notNullable()
      .defaultTo('other');
    table
      .enu('status', ['open', 'in_progress', 'resolved', 'closed'])
      .notNullable()
      .defaultTo('open');
    table.text('notes').nullable();
    table
      .uuid('created_by')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('deleted_at').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index('client_id');
    table.index('status');
    table.index('category');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('client_queries');
};
