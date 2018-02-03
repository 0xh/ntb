'use strict';

const neo4jUtils = require('@turistforeningen/ntb-shared-neo4j-utils');
const CM = require('@turistforeningen/ntb-shared-counties-municipalities');


const up = async (query, DataTypes) => {
  console.log('Set Neo4j schema');
  const driver = neo4jUtils.createDriver();
  const session = neo4jUtils.createSession(driver);
  await session.run(
    'CREATE CONSTRAINT ON (c:County) ASSERT c.uuid IS UNIQUE'
  );
  await session.run(
    'CREATE CONSTRAINT ON (m:Municipality) ASSERT m.uuid IS UNIQUE'
  );

  console.log('Harvest counties and municipalities');
  await CM.harvest(session);
  console.log('  - done');

  session.close();
  driver.close();
  console.log('Done!');
};


const down = async (query, DataTypes) => {
  console.log('Unset Neo4j schema');
  const driver = neo4jUtils.createDriver();
  const session = neo4jUtils.createSession(driver);
  await session.run(
    'MATCH (n) WHERE labels(n) <> ["MigrationDetails"] DETACH DELETE n'
  );
  await session.run(
    'DROP CONSTRAINT ON (c:County) ASSERT c.uuid IS UNIQUE'
  );
  await session.run(
    'DROP CONSTRAINT ON (m:Municipality) ASSERT m.uuid IS UNIQUE'
  );

  session.close();
  driver.close();
  console.log('Done!');
};


module.exports = { up, down };
