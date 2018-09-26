
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
    table.integer('autocompleteRank')
      .default(0)
      .index();

    table.index('searchNb', null, 'gin');
  });
}


export async function down(knex) {
  return true;
}
