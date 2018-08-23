
export async function up(knex) {
  await knex.schema.table('routeSegments', (table) => {
    table.renameColumn('geometry', 'path');
  });
}


export async function down(knex) {
  await knex.schema.table('routeSegments', (table) => {
    table.renameColumn('path', 'geometry');
  });
}
