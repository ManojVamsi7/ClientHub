/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('recruiter_mistakes', (table) => {
    table.uuid('id').primary();
    table.string('recruiter_name', 255).notNullable();
    table.text('mistake_description').notNullable();
    table
      .enu('severity', ['low', 'medium', 'high'])
      .notNullable()
      .defaultTo('low');
    table.text('impact').nullable();
    table.text('resolution_notes').nullable();
    table
      .uuid('created_by')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('deleted_at').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index('recruiter_name');
    table.index('severity');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('recruiter_mistakes');
};
