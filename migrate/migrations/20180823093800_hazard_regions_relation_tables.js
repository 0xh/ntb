import { createLogger } from '@ntb/utils';


const logger = createLogger();


async function createCabinsRelation(knex) {
  logger.info('Creating cabinsToHazardRegions');
  await knex.schema.createTable('cabinsToHazardRegions', (table) => {
    table.uuid('cabinId')
      .notNullable()
      .references('id')
      .inTable('cabins');
    table.uuid('hazardRegionId')
      .notNullable()
      .references('id')
      .inTable('hazardRegions');

    table.timestamps(true, true);

    table.primary(['cabinId', 'hazardRegionId']);
  });
}


async function createRoutesRelation(knex) {
  logger.info('Creating routesToHazardRegions');
  await knex.schema.createTable('routesToHazardRegions', (table) => {
    table.uuid('routeId')
      .notNullable()
      .references('id')
      .inTable('routes');
    table.uuid('hazardRegionId')
      .notNullable()
      .references('id')
      .inTable('hazardRegions');

    table.timestamps(true, true);

    table.primary(['routeId', 'hazardRegionId']);
  });
}


async function createRouteSegmentsRelation(knex) {
  logger.info('Creating routeSegmentsToHazardRegions');
  await knex.schema.createTable('routeSegmentsToHazardRegions', (table) => {
    table.uuid('routeSegmentId')
      .notNullable()
      .references('id')
      .inTable('routeSegments');
    table.uuid('hazardRegionId')
      .notNullable()
      .references('id')
      .inTable('hazardRegions');

    table.timestamps(true, true);

    table.primary(['routeSegmentId', 'hazardRegionId']);
  });
}


async function createTripsRelation(knex) {
  logger.info('Creating tripsToHazardRegions');
  await knex.schema.createTable('tripsToHazardRegions', (table) => {
    table.uuid('tripId')
      .notNullable()
      .references('id')
      .inTable('trips');
    table.uuid('hazardRegionId')
      .notNullable()
      .references('id')
      .inTable('hazardRegions');

    table.timestamps(true, true);

    table.primary(['tripId', 'hazardRegionId']);
  });
}


async function createPoisRelation(knex) {
  logger.info('Creating poisToHazardRegions');
  await knex.schema.createTable('poisToHazardRegions', (table) => {
    table.uuid('poiId')
      .notNullable()
      .references('id')
      .inTable('pois');
    table.uuid('hazardRegionId')
      .notNullable()
      .references('id')
      .inTable('hazardRegions');

    table.timestamps(true, true);

    table.primary(['poiId', 'hazardRegionId']);
  });
}


export async function up(knex) {
  await createCabinsRelation(knex);
  await createRoutesRelation(knex);
  await createRouteSegmentsRelation(knex);
  await createTripsRelation(knex);
  await createPoisRelation(knex);
}


export async function down(knex) {
  await knex.schema
    .dropTableIfExists('cabinsToHazardRegions')
    .dropTableIfExists('routesToHazardRegions')
    .dropTableIfExists('routeSegmentsToHazardRegions')
    .dropTableIfExists('tripsToHazardRegions')
    .dropTableIfExists('poisToHazardRegions');
}
