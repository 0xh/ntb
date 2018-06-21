import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


async function createByDistanceTable(knex, options) {
  const { tableName, from, to } = options;

  let fromPart = from.substr(0, from.length - 1);
  let toPart = to.substr(0, to.length - 1);
  if (from === to) {
    fromPart += 'A';
    toPart += 'B';
  }


  const fromColumn = `${fromPart}Id`;
  const toColumn = `${toPart}Id`;

  await knex.schema.createTable(tableName, (table) => {
    table.uuid(fromColumn)
      .notNullable()
      .references('id')
      .inTable(from);
    table.uuid(toColumn)
      .notNullable()
      .references('id')
      .inTable(to);
    table.integer('calculatedDistance');
    table.text('dataSource');

    table.timestamps(true, true);

    table.primary([fromColumn, toColumn]);
  });
}


async function modifyRoutes(knex) {
  logger.info('Modifying routes table');

  await knex.schema.table('routes', (table) => {
    table.boolean('processedNearPois').default(false);
    table.boolean('processedNearCabins').default(false);
    table.boolean('processedNearRoutes').default(false);
    table.boolean('processedNearTrips').default(false);
    table.boolean('processedDistance').default(false);
    table.boolean('processedCounties').default(false);
    table.boolean('processedMunicipalities').default(false);
    table.boolean('processedAreas').default(false);
    table.boolean('processedHazardRegions').default(false);
  });

  await createByDistanceTable(knex, {
    tableName: 'routesToPoisByDistance',
    from: 'routes',
    to: 'pois',
  });

  await createByDistanceTable(knex, {
    tableName: 'routesToCabinsByDistance',
    from: 'routes',
    to: 'cabins',
  });

  await createByDistanceTable(knex, {
    tableName: 'routesToRoutesByDistance',
    from: 'routes',
    to: 'routes',
  });

  await createByDistanceTable(knex, {
    tableName: 'routesToTripsByDistance',
    from: 'routes',
    to: 'trips',
  });
}


async function modifyRouteSegments(knex) {
  logger.info('Modifying routeSegments table');

  await knex.schema.table('routeSegments', (table) => {
    table.specificType('pointA', 'GEOMETRY');
    table.specificType('pointB', 'GEOMETRY');

    table.boolean('processedNearPois').default(false);
    table.boolean('processedNearCabins').default(false);
    table.boolean('processedNearRouteSegments').default(false);
    table.boolean('processedNearTrips').default(false);
    table.boolean('processedCountour').default(false);
    table.boolean('processedDistance').default(false);
    table.boolean('processedCounties').default(false);
    table.boolean('processedMunicipalities').default(false);
    table.boolean('processedAreas').default(false);
    table.boolean('processedHazardRegions').default(false);
  });

  await knex.raw(
    'SELECT UpdateGeometrySRID(\'route_segments\', \'point_a\', 4326);'
  );
  await knex.raw(
    'SELECT UpdateGeometrySRID(\'route_segments\', \'point_b\', 4326);'
  );

  await createByDistanceTable(knex, {
    tableName: 'routeSegmentsToPoisByDistance',
    from: 'routeSegments',
    to: 'pois',
  });

  await createByDistanceTable(knex, {
    tableName: 'routeSegmentsToCabinsByDistance',
    from: 'routeSegments',
    to: 'cabins',
  });

  await createByDistanceTable(knex, {
    tableName: 'routeSegmentsToRouteSegmentsByDistance',
    from: 'routeSegments',
    to: 'routeSegments',
  });

  await createByDistanceTable(knex, {
    tableName: 'routeSegmentsToTripsByDistance',
    from: 'routeSegments',
    to: 'trips',
  });
}


async function modifyTrips(knex) {
  logger.info('Modifying trips table');

  await knex.schema.table('trips', (table) => {
    table.boolean('processedNearPois').default(false);
    table.boolean('processedNearCabins').default(false);
    table.boolean('processedNearTrips').default(false);
    table.boolean('processedNearRoutes').default(false);
    table.boolean('processedCountour').default(false);
    table.boolean('processedDistance').default(false);
    table.boolean('processedCounties').default(false);
    table.boolean('processedMunicipalities').default(false);
    table.boolean('processedAreas').default(false);
    table.boolean('processedHazardRegions').default(false);
  });

  await createByDistanceTable(knex, {
    tableName: 'tripsToPoisByDistance',
    from: 'trips',
    to: 'pois',
  });

  await createByDistanceTable(knex, {
    tableName: 'tripsToTripsByDistance',
    from: 'trips',
    to: 'trips',
  });
}


async function modifyCabins(knex) {
  logger.info('Modifying cabins table');

  await knex.schema.table('cabins', (table) => {
    table.boolean('processedNearPois').default(false);
    table.boolean('processedNearCabins').default(false);
    table.boolean('processedNearRoutes').default(false);
    table.boolean('processedNearTrips').default(false);
    table.boolean('processedDistance').default(false);
    table.boolean('processedCounties').default(false);
    table.boolean('processedMunicipalities').default(false);
    table.boolean('processedAreas').default(false);
    table.boolean('processedHazardRegions').default(false);
    table.boolean('processedElevation').default(false);
  });

  await createByDistanceTable(knex, {
    tableName: 'cabinsToPoisByDistance',
    from: 'cabins',
    to: 'pois',
  });

  await createByDistanceTable(knex, {
    tableName: 'cabinsToTripsByDistance',
    from: 'cabins',
    to: 'trips',
  });

  await createByDistanceTable(knex, {
    tableName: 'cabinsToCabinsByDistance',
    from: 'cabins',
    to: 'cabins',
  });
}


async function modifyPois(knex) {
  logger.info('Modifying pois table');

  await knex.schema.table('pois', (table) => {
    table.boolean('processedNearPois').default(false);
    table.boolean('processedNearCabins').default(false);
    table.boolean('processedNearRoutes').default(false);
    table.boolean('processedNearTrips').default(false);
    table.boolean('processedDistance').default(false);
    table.boolean('processedCounties').default(false);
    table.boolean('processedMunicipalities').default(false);
    table.boolean('processedAreas').default(false);
    table.boolean('processedHazardRegions').default(false);
    table.boolean('processedElevation').default(false);
  });

  await createByDistanceTable(knex, {
    tableName: 'poisToPoisByDistance',
    from: 'pois',
    to: 'pois',
  });
}


export async function up(knex) {
  await modifyRoutes(knex);
  await modifyRouteSegments(knex);
  await modifyTrips(knex);
  await modifyCabins(knex);
  await modifyPois(knex);
}


export async function down(knex) {
  await knex.schema
    .dropTableIfExists('routesToPoisByDistance')
    .dropTableIfExists('routesToCabinsByDistance')
    .dropTableIfExists('routesToRoutesByDistance')
    .dropTableIfExists('routesToTripsByDistance')
    .dropTableIfExists('routeSegmentsToPoisByDistance')
    .dropTableIfExists('routeSegmentsToCabinsByDistance')
    .dropTableIfExists('routeSegmentsToRouteSegmentsByDistance')
    .dropTableIfExists('routeSegmentsToTripsByDistance')
    .dropTableIfExists('tripsToPoisByDistance')
    .dropTableIfExists('tripsToTripsByDistance')
    .dropTableIfExists('cabinsToPoisByDistance')
    .dropTableIfExists('cabinsToTripsByDistance')
    .dropTableIfExists('cabinsToCabinsByDistance')
    .dropTableIfExists('poisToPoisByDistance');

  await knex.schema.table('routes', (table) => {
    table.dropColumn('processedNearPois');
    table.dropColumn('processedNearCabins');
    table.dropColumn('processedNearRoutes');
    table.dropColumn('processedNearTrips');
    table.dropColumn('processedDistance');
    table.dropColumn('processedCounties');
    table.dropColumn('processedMunicipalities');
    table.dropColumn('processedAreas');
    table.dropColumn('processedHazardRegions');
  });

  await knex.schema.table('routeSegments', (table) => {
    table.dropColumn('pointA');
    table.dropColumn('pointB');
    table.dropColumn('processedNearPois');
    table.dropColumn('processedNearCabins');
    table.dropColumn('processedNearRouteSegments');
    table.dropColumn('processedNearTrips');
    table.dropColumn('processedCountour');
    table.dropColumn('processedDistance');
    table.dropColumn('processedCounties');
    table.dropColumn('processedMunicipalities');
    table.dropColumn('processedAreas');
    table.dropColumn('processedHazardRegions');
  });

  await knex.schema.table('trips', (table) => {
    table.dropColumn('processedNearPois');
    table.dropColumn('processedNearCabins');
    table.dropColumn('processedNearTrips');
    table.dropColumn('processedNearRoutes');
    table.dropColumn('processedCountour');
    table.dropColumn('processedDistance');
    table.dropColumn('processedCounties');
    table.dropColumn('processedMunicipalities');
    table.dropColumn('processedAreas');
    table.dropColumn('processedHazardRegions');
  });

  await knex.schema.table('cabins', (table) => {
    table.dropColumn('processedNearPois');
    table.dropColumn('processedNearCabins');
    table.dropColumn('processedNearRoutes');
    table.dropColumn('processedNearTrips');
    table.dropColumn('processedDistance');
    table.dropColumn('processedCounties');
    table.dropColumn('processedMunicipalities');
    table.dropColumn('processedAreas');
    table.dropColumn('processedHazardRegions');
    table.dropColumn('processedElevation');
  });

  await knex.schema.table('pois', (table) => {
    table.dropColumn('processedNearPois');
    table.dropColumn('processedNearCabins');
    table.dropColumn('processedNearRoutes');
    table.dropColumn('processedNearTrips');
    table.dropColumn('processedDistance');
    table.dropColumn('processedCounties');
    table.dropColumn('processedMunicipalities');
    table.dropColumn('processedAreas');
    table.dropColumn('processedHazardRegions');
    table.dropColumn('processedElevation');
  });
}
