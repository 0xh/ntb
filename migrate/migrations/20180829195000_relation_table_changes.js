
export async function up(knex) {
  await knex.schema.table('areas', (table) => {
    table.dropColumn('processedCounties');
    table.dropColumn('processedMunicipalities');

    table.timestamp('geometryUpdatedAt');
    table.timestamp('processedRelationsUpdatedAt');
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

    table.timestamp('coordinatesUpdatedAt');
    table.timestamp('processedRelationsUpdatedAt');
    table.timestamp('processedElevationUpdatedAt');
  });

  await knex.schema.table('counties', (table) => {
    table.timestamp('geometryUpdatedAt');
    table.timestamp('processedRelationsUpdatedAt');
  });

  await knex.schema.table('hazardRegions', (table) => {
    table.timestamp('geometryUpdatedAt');
    table.timestamp('processedRelationsUpdatedAt');
  });

  await knex.schema.table('municipalities', (table) => {
    table.timestamp('geometryUpdatedAt');
    table.timestamp('processedRelationsUpdatedAt');
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

    table.timestamp('coordinatesUpdatedAt');
    table.timestamp('processedRelationsUpdatedAt');
    table.timestamp('processedElevationUpdatedAt');
  });

  await knex.schema.table('routeSegments', (table) => {
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
    table.timestamp('processedElevationUpdatedAt');
  });

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

    table.timestamp('pathUpdatedAt');
    table.timestamp('processedRelationsUpdatedAt');
  });

  await knex.schema.table('trips', (table) => {
    table.dropColumn('processedNearPois');
    table.dropColumn('processedNearCabins');
    table.dropColumn('processedNearRoutes');
    table.dropColumn('processedNearTrips');
    table.dropColumn('processedCountour');
    table.dropColumn('processedDistance');
    table.dropColumn('processedCounties');
    table.dropColumn('processedMunicipalities');
    table.dropColumn('processedAreas');
    table.dropColumn('processedHazardRegions');

    table.timestamp('pathUpdatedAt');
    table.timestamp('processedRelationsUpdatedAt');
    table.timestamp('processedElevationUpdatedAt');
  });
}


export async function down(knex) {
  await knex.schema
    .dropTableIfExists('tripAccessabilities');
}
