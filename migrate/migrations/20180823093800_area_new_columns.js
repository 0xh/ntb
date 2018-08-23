
export async function up(knex) {
  await knex.schema.table('areas', (table) => {
    table.boolean('processedCounties').default(false);
    table.boolean('processedMunicipalities').default(false);
  });
}


export async function down(knex) {
  await knex.schema.table('areas', (table) => {
    table.dropColumn('processedCounties');
    table.dropColumn('processedMunicipalities');
  });
}
