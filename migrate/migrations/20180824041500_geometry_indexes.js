
export async function up(knex) {
  await knex.schema.table('areas', (table) => {
    table.index('geometry', null, 'GIST');
  });
  await knex.schema.table('cabins', (table) => {
    table.index('coordinates', null, 'GIST');
  });
  await knex.schema.table('lists', (table) => {
    table.index('coordinates', null, 'GIST');
  });
  await knex.schema.table('pictures', (table) => {
    table.index('coordinates', null, 'GIST');
  });
  await knex.schema.table('pois', (table) => {
    table.index('coordinates', null, 'GIST');
  });
  await knex.schema.table('route_segments', (table) => {
    table.index('path', null, 'GIST');
    table.index('point_a', null, 'GIST');
    table.index('point_b', null, 'GIST');
  });
  await knex.schema.table('trips', (table) => {
    table.index('starting_point', null, 'GIST');
    table.index('path', null, 'GIST');
  });
}


export async function down(knex) {
  await knex.schema.table('areas', (table) => {
    table.dropIndex('geometry', null, 'GIST');
  });
  await knex.schema.table('cabins', (table) => {
    table.dropIndex('coordinates', null, 'GIST');
  });
  await knex.schema.table('lists', (table) => {
    table.dropIndex('coordinates', null, 'GIST');
  });
  await knex.schema.table('pictures', (table) => {
    table.dropIndex('coordinates', null, 'GIST');
  });
  await knex.schema.table('pois', (table) => {
    table.dropIndex('coordinates', null, 'GIST');
  });
  await knex.schema.table('route_segments', (table) => {
    table.dropIndex('path', null, 'GIST');
    table.dropIndex('point_a', null, 'GIST');
    table.dropIndex('point_b', null, 'GIST');
  });
  await knex.schema.table('trips', (table) => {
    table.dropIndex('starting_point', null, 'GIST');
    table.dropIndex('path', null, 'GIST');
  });
}
