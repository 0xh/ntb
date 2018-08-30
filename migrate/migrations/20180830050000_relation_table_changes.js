
export async function up(knex) {
  await knex.schema
    .dropTableIfExists('cabinsToCounties')
    .dropTableIfExists('cabinsToMunicipalities')
    .dropTableIfExists('poisToCounties')
    .dropTableIfExists('poisToMunicipalities')
    .dropTableIfExists('routesToTripsByDistance')
    .dropTableIfExists('areasToAreas');

  await knex.schema.createTable('areasToAreas', (table) => {
    table.uuid('parentId')
      .notNullable()
      .references('id')
      .inTable('areas');
    table.uuid('childId')
      .notNullable()
      .references('id')
      .inTable('areas');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary(['parentId', 'childId']);
  });

  await knex.schema.createTable('routesToTripsByDistance', (table) => {
    table.uuid('routeId')
      .notNullable()
      .references('id')
      .inTable('routes');
    table.uuid('tripId')
      .notNullable()
      .references('id')
      .inTable('trips');
    table.integer('calculatedDistance');
    table.timestamp('processedVerified');

    table.primary(['routeId', 'tripId']);
  });
}


export async function down(knex) {
  return true;
}
