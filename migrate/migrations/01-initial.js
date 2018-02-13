
import CMharvest from
  '@turistforeningen/ntb-shared-counties-municipalities-harvester';

import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


const up = async (db) => {
  logger.info('Sync database');
  await db.sequelize.sync();

  // Harvest counties and municipalities from kartverket
  await CMharvest()
    .then((status) => {
      if (status) {
        logger.info('CM Harvester: Done with success!');
      }
      else {
        logger.error('CM Harvester: Done with error!');
        throw new Error('CM harvester reported failure');
      }
    })
    .catch((err) => {
      logger.error('UNCAUGHT ERROR');
      logger.error(err.stack);
      throw err;
    });

  logger.info('Done!');
};


const down = async (db) => {
  logger.info('Unset all the things');
  const sqls = [];
  Object.keys(db.sequelize.models).forEach((modelName) => {
    const { tableName } = db.sequelize.models[modelName];
    sqls.push(
      `DROP TABLE IF EXISTS "${tableName}" CASCADE;`,
    );
  });

  await db.sequelize.query(
    sqls.join('\n')
  );
  logger.info('Done!');
};


module.exports = { up, down };
