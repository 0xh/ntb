
export async function up(knex) {
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'areas\', \'geometry\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'cabins\', \'coordinates\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'hazard_regions\', \'geometry\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'lists\', \'coordinates\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'pois\', \'coordinates\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'routes\', \'point_a\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'routes\', \'point_b\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'routes\', \'path_ab\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'routes\', \'path_ba\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'trips\', \'path\', 4326);'
  );
}


export async function down(knex) {
  return true;
}
