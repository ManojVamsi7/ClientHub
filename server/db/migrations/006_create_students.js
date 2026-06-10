/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('students', (table) => {
      table.uuid('id').primary();
      table.string('student_id').unique().notNullable();
      table.string('name').notNullable();
      table.string('email').nullable();
      table.string('department').nullable();
      table.string('years_of_experience').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .alterTable('interview_calls', (table) => {
      table.uuid('student_id').nullable().references('id').inTable('students').onDelete('SET NULL');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable('interview_calls', (table) => {
      table.dropColumn('student_id');
    })
    .dropTableIfExists('students');
};
