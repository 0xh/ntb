
export async function up(knex) {
  await knex.schema.createTable('tripsToTripsByDistance', (table) => {
    table.uuid('tripAId')
      .notNullable()
      .references('id')
      .inTable('trips');
    table.uuid('tripBId')
      .notNullable()
      .references('id')
      .inTable('trips');
    table.integer('calculatedDistance');
    table.timestamp('processedVerified');

    table.primary(['tripAId', 'tripBId']);
  });
}


export async function down(knex) {
  return true;
}
