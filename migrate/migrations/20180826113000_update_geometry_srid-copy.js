
export async function up(knex) {
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'pictures\', \'coordinates\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'routes\', \'path\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'routes\', \'path_buffer\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'trips\', \'starting_point\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'trips\', \'path_buffer\', 4326);'
  );
}


export async function down(knex) {
  return true;
}
