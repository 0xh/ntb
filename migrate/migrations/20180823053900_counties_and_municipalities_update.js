import { Logger } from '@ntb/utils';


const logger = Logger.getLogger();


export async function up(knex) {
  logger.info('Modifying counties table');
  await knex.schema.table('counties', (table) => {
    table.specificType('geometry', 'GEOMETRY');
    table.unique('code');
    table.index('geometry', null, 'GIST');
  });

  await knex.raw(
    'SELECT UpdateGeometrySRID(\'counties\', \'geometry\', 4326);'
  );


  logger.info('Modifying municipalities table');
  await knex.schema.table('municipalities', (table) => {
    table.specificType('geometry', 'GEOMETRY');
    table.unique('code');
    table.index('geometry', null, 'GIST');
  });

  await knex.raw(
    'SELECT UpdateGeometrySRID(\'municipalities\', \'geometry\', 4326);'
  );
}


export async function down(knex) {
  await knex.schema.table('counties', (table) => {
    table.dropColumn('geometry');
    table.dropUnique('code');
  });
  await knex.schema.table('municipalities', (table) => {
    table.dropColumn('geometry');
    table.dropUnique('code');
  });
}
