'use strict';

const neo4j = require('neo4j-driver').v1;

const settings = require('./lib/settings');
const harvester = require('./lib/harvester');
const legacy = require('./legacy-structure/legacy');
const CM = require('../../shared-lib/countiesMunicipalities');


const driver = neo4j.driver(
  settings.NEO4J_URI,
  neo4j.auth.basic(
    settings.NEO4J_USER,
    settings.NEO4J_PASSWORD
  )
);

const runQuery = async (query, parameters) => {
  const session = driver.session();
  const result = await session.run(query, parameters);
  session.close();
  return result;
};


const addCountiesToDb = async (data) => {
  const uuids = [];
  const replacesUUID = [];

  const query = [
    'MERGE (c:County {uuid: $data.uuid})',
    'ON CREATE SET c = $data',
    'ON MATCH SET c = $data',
  ].join('\n');

  Object.values(data).forEach(async (county) => {
    uuids.push(county.data.uuid);

    await runQuery(query, { data: county.data });

    // Add counties this replaces
    if (county.replace) {
      const countyLegacyRelationQuery = [
        'MATCH (replacement:County {uuid: $replacement}),',
        '      (replaced:County {uuid: $replaced})',
        'MERGE (replaced)-[:COUNTY_REPLACED_BY]->(replacement)',
      ].join('\n');

      county.replaces.forEach(async (legacyCounty) => {
        replacesUUID.push(legacyCounty.data.uuid);
        await runQuery(query, { data: legacyCounty.data });
        await runQuery(countyLegacyRelationQuery, {
          replacement: county.data.uuid,
          replaced: legacyCounty.data.uuid,
        });
      });
    }

    // TODO(Roar): Identify existing replacements that should be removed.
  });

  return uuids;
};


const addAreasToDb = async (data) => data.areas.forEach((legacyData) => {
  const area = legacy.omrade.mapping(legacyData);
  addCountiesToDb(area.counties);
});


const main = async () => {
  // await harvester.testRandomObjects('turer', legacy.tur.structure, 3);
  // await harvester.testStructureOfAllObjects('turer', legacy.tur.structure);

  const objects = {
    // lists: await harvester.getObjects('lister', legacy.liste.structure),
    areas: await harvester.getObjects('områder', legacy.omrade.structure),
    // places: await harvester.getObjects('steder', legacy.sted.structure),
    // images: await harvester.getObjects('bilder', legacy.bilde.structure),
  };

  console.log('- Adding areas to DB');
  await addAreasToDb(objects);
  console.log('  - Done adding to database');

  driver.close();
};


main();
