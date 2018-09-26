const NAMES = [
  'areas',
  'cabins',
  'groups',
  'lists',
  'pois',
  'routes',
  'trips',
];


export async function up(knex) {
  // Update value of search_document_boost for all tables
  for (const name of NAMES) {
    await knex.schema.raw(`
      UPDATE ${name} SET search_document_boost = 100;
    `);
  }

  // Update search_config values
  await knex.schema.raw(`
    UPDATE search_config SET boost = 40 WHERE name = 'search_document__area';
  `);
  await knex.schema.raw(`
    UPDATE search_config SET boost = 80 WHERE name = 'search_document__cabin';
  `);
  await knex.schema.raw(`
    UPDATE search_config SET boost = 0 WHERE name = 'search_document__group';
  `);
  await knex.schema.raw(`
    UPDATE search_config SET boost = 0 WHERE name = 'search_document__list';
  `);
  await knex.schema.raw(`
    UPDATE search_config SET boost = 0 WHERE name = 'search_document__poi';
  `);
  await knex.schema.raw(`
    UPDATE search_config SET boost = 20 WHERE name = 'search_document__route';
  `);
  await knex.schema.raw(`
    UPDATE search_config SET boost = 0 WHERE name = 'search_document__trip';
  `);

  // Remove unused values
  await knex.schema.raw(`
    DELETE FROM search_config WHERE name = 'search_document__county';
  `);
  await knex.schema.raw(`
    DELETE FROM search_config WHERE name = 'search_document__municipality';
  `);

  // Update search_documents boost
  await knex.schema.raw(`
    UPDATE search_documents sd1 SET
      search_document_type_boost = sc.boost,
      search_document_boost = 100
    FROM search_documents sd2
    INNER JOIN search_config sc ON
      sc.name = 'search_document__' || sd2.document_type
    WHERE
      sd1.id = sd2.id
  `);
}


export async function down(knex) {
  return true;
}
