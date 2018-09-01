
export async function up(knex) {
  await knex.schema.table('poisToPoiTypes', (table) => {
    table.dropForeign('poiType');
    table.dropForeign('poiId');

    table.foreign('poiId')
      .references('id')
      .inTable('pois')
      .onDelete('CASCADE');
    table.foreign('poiType')
      .references('name')
      .inTable('poiTypes')
      .onDelete('CASCADE');
  });
}


export async function down(knex) {
  return true;
}
