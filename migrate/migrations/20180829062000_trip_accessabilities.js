
export async function up(knex) {
  await knex.schema.createTable('tripAccessabilities', (table) => {
    table.text('accessabilityName')
      .notNullable()
      .references('name')
      .inTable('accessabilities');
    table.uuid('tripId')
      .notNullable()
      .references('id')
      .inTable('trips');
    table.text('description');
    table.text('dataSource');

    table.primary(['accessabilityName', 'tripId']);
  });
}


export async function down(knex) {
  await knex.schema
    .dropTableIfExists('tripAccessabilities');
}
