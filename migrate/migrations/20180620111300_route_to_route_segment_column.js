import { createLogger } from '@ntb/utils';


const logger = createLogger();


export async function up(knex) {
  logger.info('Modifying routesToRouteSegments table');
  await knex.schema.table('routesToRouteSegments', (table) => {
    table.text('type');
  });
}


export async function down(knex) {
  await knex.schema.table('routesToRouteSegments', (table) => {
    table.dropColumn('type');
  });
}
