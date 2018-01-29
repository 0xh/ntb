// @flow

import {
  createDriver,
  createSession,
} from '@turistforeningen/ntb-shared-neo4j-utils';
import { createLogger } from '@turistforeningen/ntb-shared-utils';
import harvest from
  '@turistforeningen/ntb-shared-counties-municipalities-harvester';


const logger = createLogger();
const driver = createDriver();
const session = createSession(driver);


logger.info('Harvesting counties and municipalities from Kartverket');
harvest(session)
  .then((status) => {
    session.close();
    driver.close();

    if (status) {
      logger.info('Done with success!');
      process.exit(0);
    }
    else {
      logger.error('Done with error!');
      process.exit(1);
    }
  })
  .catch((err) => {
    logger.error('UNCAUGHT ERROR');
    logger.error(err.stack);
    process.exit(1);
  });
