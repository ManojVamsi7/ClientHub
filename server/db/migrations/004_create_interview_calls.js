/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('interview_calls', (table) => {
    table.uuid('id').primary();
    table
      .uuid('client_id')
      .notNullable()
      .references('id')
      .inTable('clients')
      .onDelete('CASCADE');
    table.timestamp('call_date').notNullable();
    table.string('recruiter_name', 255).notNullable();
    table.string('position_applied', 255).nullable();
    table.text('call_notes').nullable();
    table.timestamp('deleted_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('client_id');
    table.index('recruiter_name');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('interview_calls');
};
