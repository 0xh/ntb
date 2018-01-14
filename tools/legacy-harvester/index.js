'use strict';

const neo4j = require('neo4j-driver').v1;

const settings = require('./lib/settings');
const harvester = require('./lib/harvester');
const legacy = require('./legacy-structure/legacy');


const driver = neo4j.driver(
  settings.NEO4J_URI,
  neo4j.auth.basic(
    settings.NEO4J_USER,
    settings.NEO4J_PASSWORD
  )
);
const session = driver.session();


const main = async () => {
  // await harvester.testRandomObjects('turer', legacy.tur, 100);
  // await harvester.testStructureOfAllObjects('turer', legacy.tur);
  const objects = await harvester.getObjects('lister', legacy.liste);
  console.log('test DONE', objects[0]);  // eslint-disable-line

  session.close();
  driver.close();
};


main();
