import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


export async function up(knex) {
  logger.info('Modifying routesToRouteSegments table');
  await knex.schema.table('routesToRouteSegments', (table) => {
    table.primary(['routeId', 'routeSegmentId']);
  });
}


export async function down(knex) {
  return true;
}
