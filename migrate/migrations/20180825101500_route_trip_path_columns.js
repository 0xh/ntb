
export async function up(knex) {
  await knex.schema.table('routes', (table) => {
    table.specificType('path', 'geometry');
    table.specificType('pathBuffer', 'geometry');

    table.index('path', null, 'GIST');
    table.index('pathBuffer', null, 'GIST');
  });
  await knex.schema.table('trips', (table) => {
    table.specificType('pathBuffer', 'geometry');

    table.index('pathBuffer', null, 'GIST');
  });
}


export async function down(knex) {
  await knex.schema.table('routes', (table) => {
    table.dropColumn('path', null, 'GIST');
    table.dropColumn('pathBuffer', null, 'GIST');
  });
  await knex.schema.table('trips', (table) => {
    table.dropColumn('pathBuffer', null, 'GIST');
  });
}
