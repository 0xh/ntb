export async function up(knex) {
  await knex.schema.table('routesToRoutesByDistance', (table) => {
    table.dropColumn('createdAt');
    table.dropColumn('updatedAt');
    table.dropColumn('dataSource');

    table.dropForeign('routeAId');
    table.dropForeign('routeBId');

    table.foreign('routeAId')
      .references('id')
      .inTable('routes')
      .onDelete('CASCADE');
    table.foreign('routeBId')
      .references('id')
      .inTable('routes')
      .onDelete('CASCADE');

    table.timestamp('processedVerified');
  });
}


export async function down(knex) {
  return true;
}
