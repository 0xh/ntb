const TABLES = {
  areasToAreas: 'update',
  cabinsToAreas: 'update',
  areasToCounties: 'update',
  areasToHazardRegions: 'create',
  areasToMunicipalities: 'update',
  poisToAreas: 'update',
  routesToAreas: 'create',
  tripsToAreas: 'create',
  cabinsToCounties: 'create',
  cabinsToMunicipalities: 'create',
  cabinsToHazardRegions: 'update',
  cabinsToCabinsByDistance: 'update',
  cabinsToPoisByDistance: 'update',
  routesToCabinsByDistance: 'update',
  cabinsToTripsByDistance: 'update',
  countiesToHazardRegions: 'create',
  poisToCounties: 'create',
  routesToCounties: 'update',
  tripsToCounties: 'create',
  municipalitiesToHazardRegions: 'create',
  poisToHazardRegions: 'update',
  routesToHazardRegions: 'update',
  tripsToHazardRegions: 'update',
  poisToMunicipalities: 'create',
  routesToMunicipalities: 'create',
  tripsToMunicipalities: 'create',
  poisToPoisByDistance: 'update',
  routesToPoisByDistance: 'update',
  tripsToPoisByDistance: 'update',
};


function getTableNames(relationTableName) {
  return relationTableName
    .replace('ByDistance', '')
    .split('To')
    .map((table) => `${table[0].toLowerCase()}${table.substr(1)}`);
}


function getColumnNames(relationTableName) {
  const tables = getTableNames(relationTableName);
  let columns = tables
    .map((table) => {
      switch (table) {
        case 'counties':
          return 'county';
        case 'municipalities':
          return 'municipality';
        default:
          return table.substr(0, table.length - 1);
      }
    });

  if (columns[0] === columns[1]) {
    columns = [`${columns[0]}A`, `${columns[0]}B`];
  }

  return columns;
}


async function createRelationTable(
  knex,
  relationTableName
) {
  const columnNames = getColumnNames(relationTableName);
  const tableNames = getTableNames(relationTableName);
  const byDistance = relationTableName.endsWith('ByDistance');

  await knex.schema.createTable(relationTableName, (table) => {
    table.uuid(`${columnNames[0]}Id`)
      .notNullable()
      .references('id')
      .inTable(tableNames[0])
      .onDelete('CASCADE');
    table.uuid(`${columnNames[1]}Id`)
      .notNullable()
      .references('id')
      .inTable(tableNames[1])
      .onDelete('CASCADE');

    if (byDistance) {
      table.integer('calculatedDistance')
        .index();
    }

    table.timestamp('processedVerified')
      .index();

    table.primary([`${columnNames[0]}Id`, `${columnNames[1]}Id`]);
  });
}


export async function up(knex) {
  // eslint-disable-next-line
  for (const relationTableName of Object.keys(TABLES)) {
    const action = TABLES[relationTableName];
    if (action === 'update') {
      // eslint-disable-next-line
      await knex.schema.dropTableIfExists(relationTableName);
    }
    // eslint-disable-next-line
    await createRelationTable(knex, relationTableName);
  }

  await knex.schema.dropTableIfExists('tripsToTripsByDistance');
  await knex.schema.dropTableIfExists('routeSegmentsToCabinsByDistance');
  await knex.schema.dropTableIfExists('routeSegmentsToHazardRegions');
  await knex.schema.dropTableIfExists('routeSegmentsToPoisByDistance');
  await knex.schema.dropTableIfExists(
    'routeSegmentsToRouteSegmentsByDistance'
  );
  await knex.schema.dropTableIfExists('routeSegmentsToTripsByDistance');
}


export async function down(knex) {
  return true;
}
