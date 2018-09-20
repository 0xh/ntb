
export async function up(knex) {
  await knex.schema.table('cabins', (table) => {
    table.text('serviceLevelToday');
    table.integer('bedsToday');
  });
}


export async function down(knex) {
  return true;
}
