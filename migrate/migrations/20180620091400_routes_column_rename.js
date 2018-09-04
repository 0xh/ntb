import { createLogger } from '@ntb/shared-utils';


const logger = createLogger();


export async function up(knex) {
  logger.info('Modifying routes table');
  await knex.schema.table('routes', (table) => {
    table.renameColumn('lengthInMeters', 'calculatedDistance');
    table.dropColumn('is_winter');
    table.dropUnique(['code']);
  });

  logger.info('Modifying route segments table');
  await knex.schema.table('routeSegments', (table) => {
    table.renameColumn('lengthInMeters', 'calculatedDistance');
  });
}


export async function down(knex) {
  await knex.schema.table('routes', (table) => {
    table.renameColumn('calculatedDistance', 'lengthInMeters');
    table.boolean('is_winter').default(false);
  });

  await knex.schema.table('routeSegments', (table) => {
    table.renameColumn('calculatedDistance', 'lengthInMeters');
  });
}
