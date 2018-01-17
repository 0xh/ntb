'use strict';

const neo4jUtils = require('@turistforeningen/ntb-shared-neo4j-utils');
const CM = require('@turistforeningen/ntb-shared-counties-municipalities');


const driver = neo4jUtils.createDriver();
const session = neo4jUtils.createSession(driver);


console.log('Harvesting counties and municipalities from Kartverket');
CM.harvest(session)
  .then(() => {
    session.close();
    driver.close();

    console.log('Done with success!');
    process.exit(0);
  })
  .catch((err) => {
    console.log('ERROR');
    console.log(err);
    process.exit(1);
  });
