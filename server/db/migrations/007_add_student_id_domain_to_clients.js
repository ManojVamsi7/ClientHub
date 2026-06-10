/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('clients', (table) => {
    table.string('student_id', 100).nullable();
    table.string('domain', 255).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('clients', (table) => {
    table.dropColumn('student_id');
    table.dropColumn('domain');
  });
};
