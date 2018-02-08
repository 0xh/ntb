
// import CMHarvest from
//   '@turistforeningen/ntb-shared-counties-municipalities-harvester';

import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


const up = async (db) => {
  logger.info('Sync database');
  await db.sequelize.sync();
  logger.info('Done!');
};


const down = async (db) => {
  logger.info('Unset all the things');
  db.sequelize.query(
    'DROP SCHEMA public CASCADE; ' +
    'CREATE SCHEMA public;'
  );
  logger.info('Done!');
};


module.exports = { up, down };
