
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
  for (const name of NAMES) {
    await knex.schema.table(name, (table) => {
      table.float('searchDocumentManualBoost')
        .default(0);
    });
  }
}


export async function down(knex) {
  return true;
}
