
export async function up(knex) {
  await knex.raw('DROP VIEW IF EXISTS "unique_names";');

  await knex.schema.createTable('uniqueNames', (table) => {
    table.text('name')
      .primary();
    table.specificType('searchNb', 'TSVECTOR');
    table.specificType('areaIds', 'TEXT[]');
    table.specificType('cabinIds', 'TEXT[]');
    table.specificType('poiIds', 'TEXT[]');
    table.specificType('routeIds', 'TEXT[]');
    table.specificType('tripIds', 'TEXT[]');
    table.boolean('isArea')
      .default(false)
      .index();
    table.boolean('isCabin')
      .default(false)
      .index();
    table.boolean('isPoi')
      .default(false)
      .index();
    table.boolean('isRoute')
      .default(false)
      .index();
    table.boolean('isTrip')
      .default(false)
      .index();

    table.index('searchNb', null, 'gin');
  });
}


export async function down(knex) {
  return true;
}
