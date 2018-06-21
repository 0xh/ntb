import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


async function createSystemSettings(knex) {
  logger.info('Creating systemSettings table');

  await knex.schema.createTable('systemSettings', (table) => {
    table.text('name')
      .primary();
    table.jsonb('settings');
  });
}


async function modifyRoute(knex) {
  logger.info('Modifying routes table');

  await knex.schema.table('routes', (table) => {
    table.text('type')
      .references('name')
      .inTable('routeTypes');
    table.integer('lengthInMeters');

    table.text('name').nullable().alter();
    table.text('name_lower_case').nullable().alter();

    table.dropColumn('pathAb');
    table.dropColumn('pathBa');
    table.dropColumn('pointA');
    table.dropColumn('pointB');
    table.dropColumn('pathAbPolyline');
    table.dropColumn('pathBaPolyline');

    table.unique(['type', 'code']);
  });
}


async function createRouteTypes(knex) {
  logger.info('Creating routeTypes table');

  await knex.schema.createTable('routeTypes', (table) => {
    table.text('name')
      .primary();
    table.text('description');
  });

  await knex('routeTypes')
    .insert([
      { name: 'foot' },
      { name: 'bike' },
      { name: 'ski' },
      { name: 'other' },
    ]);
}


async function createRouteSegments(knex) {
  logger.info('Creating routeSegments table');

  await knex.schema.createTable('routeSegments', (table) => {
    table.uuid('id')
      .primary();
    table.text('type')
      .references('name')
      .inTable('routeTypes');
    table.specificType('gmlIds', 'TEXT[]');
    table.specificType('maintainers', 'TEXT[]');
    table.integer('lengthInMeters');
    table.specificType('geometry', 'GEOMETRY');
    table.text('dataSource');

    table.timestamps(true, true);
  });

  await knex.raw(
    'SELECT UpdateGeometrySRID(\'route_segments\', \'geometry\', 4326);'
  );
}


async function createRoutesToRouteSegments(knex) {
  logger.info('Creating routesToRouteSegments table');

  await knex.schema.createTable('routesToRouteSegments', (table) => {
    table.uuid('routeId')
      .references('id')
      .inTable('routes');
    table.uuid('routeSegmentId')
      .references('id')
      .inTable('routeSegments');
    table.text('dataSource');

    table.timestamps(true, true);
  });
}


async function createRouteWfsDataSki(knex) {
  logger.info('Creating routesWfsDataSki table');

  await knex.schema.createTable('routesWfsDataSki', (table) => {
    table.increments('ogcFid')
      .primary();
    table.text('gmlId')
      .notNullable();
    table.text('lokalid');
    table.text('navnerom');
    table.integer('versjonid');
    table.text('datafangstdato');
    table.text('oppdateringsdato');
    table.integer('målemetode');
    table.integer('nøyaktighet');
    table.text('merking');
    table.text('rutenavn');
    table.text('rutenummer');
    table.text('vedlikeholdsansvarlig');
    table.specificType('wkbGeometry', 'GEOMETRY')
      .index(null, 'GIST');
  });

  await knex.raw(
    'SELECT UpdateGeometrySRID(\'routes_wfs_data_ski\', ' +
    '\'wkb_geometry\', 25833);'
  );
}


async function createRouteWfsDataFoot(knex) {
  logger.info('Creating routesWfsDataFoot table');

  await knex.schema.createTable('routesWfsDataFoot', (table) => {
    table.increments('ogcFid')
      .primary();
    table.text('gmlId')
      .notNullable();
    table.text('lokalid');
    table.text('navnerom');
    table.integer('versjonid');
    table.text('datafangstdato');
    table.text('oppdateringsdato');
    table.integer('målemetode');
    table.integer('nøyaktighet');
    table.text('informasjon');
    table.text('merking');
    table.text('rutefølger');
    table.text('rutenavn');
    table.text('rutenummer');
    table.text('vedlikeholdsansvarlig');
    table.specificType('wkbGeometry', 'GEOMETRY')
      .index(null, 'GIST');
  });

  await knex.raw(
    'SELECT UpdateGeometrySRID(\'routes_wfs_data_foot\', ' +
    '\'wkb_geometry\', 25833);'
  );
}


async function createRouteWfsDataBike(knex) {
  logger.info('Creating routesWfsDataBike table');

  await knex.schema.createTable('routesWfsDataBike', (table) => {
    table.increments('ogcFid')
      .primary();
    table.text('gmlId')
      .notNullable();
    table.text('lokalid');
    table.text('navnerom');
    table.integer('versjonid');
    table.text('datafangstdato');
    table.text('oppdateringsdato');
    table.integer('målemetode');
    table.integer('nøyaktighet');
    table.text('opphav');
    table.text('informasjon');
    table.text('merking');
    table.text('skilting');
    table.text('rutefølger');
    table.text('rutenavn');
    table.text('rutenummer');
    table.text('vedlikeholdsansvarlig');
    table.text('gradering');
    table.specificType('wkbGeometry', 'GEOMETRY')
      .index(null, 'GIST');
  });

  await knex.raw(
    'SELECT UpdateGeometrySRID(\'routes_wfs_data_bike\', ' +
    '\'wkb_geometry\', 25833);'
  );
}


async function createRouteWfsDataOther(knex) {
  logger.info('Creating routesWfsDataOther table');

  await knex.schema.createTable('routesWfsDataOther', (table) => {
    table.increments('ogcFid')
      .primary();
    table.text('gmlId')
      .notNullable();
    table.text('lokalid');
    table.text('navnerom');
    table.integer('versjonid');
    table.text('datafangstdato');
    table.text('oppdateringsdato');
    table.integer('målemetode');
    table.integer('nøyaktighet');
    table.text('opphav');
    table.text('merking');
    table.text('skilting');
    table.text('rutefølger');
    table.text('rutenavn');
    table.text('rutenummer');
    table.text('vedlikeholdsansvarlig');
    table.text('spesialannenrutetype');
    table.text('ruteinformasjon');
    table.specificType('wkbGeometry', 'GEOMETRY')
      .index(null, 'GIST');
  });

  await knex.raw(
    'SELECT UpdateGeometrySRID(\'routes_wfs_data_other\', ' +
    '\'wkb_geometry\', 25833);'
  );
}


export async function up(knex) {
  await createSystemSettings(knex);
  await createRouteTypes(knex);
  await modifyRoute(knex);
  await createRouteSegments(knex);
  await createRoutesToRouteSegments(knex);
  await createRouteWfsDataSki(knex);
  await createRouteWfsDataFoot(knex);
  await createRouteWfsDataBike(knex);
  await createRouteWfsDataOther(knex);
}


export async function down(knex) {
  await knex.schema.table('routes', (table) => {
    table.dropUnique(['type', 'code']);
    table.dropColumn('type');
    table.dropColumn('lengthInMeters');

    table.text('name').notNullable().alter();
    table.text('name_lower_case').notNullable().alter();

    table.specificType('pathAb', 'GEOMETRY');
    table.specificType('pathBa', 'GEOMETRY');
    table.specificType('pointA', 'GEOMETRY');
    table.specificType('pointB', 'GEOMETRY');
    table.text('pathAbPolyline');
    table.text('pathBaPolyline');
  });

  await knex.raw('SELECT UpdateGeometrySRID(\'routes\', \'path_ab\', 4326);');
  await knex.raw('SELECT UpdateGeometrySRID(\'routes\', \'path_ba\', 4326);');
  await knex.raw('SELECT UpdateGeometrySRID(\'routes\', \'point_a\', 4326);');
  await knex.raw('SELECT UpdateGeometrySRID(\'routes\', \'point_b\', 4326);');

  await knex.schema
    .dropTableIfExists('systemSettings')
    .dropTableIfExists('routesWfsDataFoot')
    .dropTableIfExists('routesWfsDataBike')
    .dropTableIfExists('routesWfsDataSki')
    .dropTableIfExists('routesWfsDataOther')
    .dropTableIfExists('routesToRouteSegments')
    .dropTableIfExists('routeSegments')
    .dropTableIfExists('routeTypes');
}
