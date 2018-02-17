
import CMharvest from
  '@turistforeningen/ntb-shared-counties-municipalities-harvester';

import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


const up = async (db) => {
  logger.info('Sync database');
  await db.sequelize.sync();

  const queryInterface = db.sequelize.getQueryInterface();

  // Create composite primary keys
  await queryInterface.sequelize.query([
    'ALTER TABLE "tag_relation"',
    'ADD CONSTRAINT "tag_relation_primary" PRIMARY KEY (',
    '  "tag_name", "tagged_type", "tagged_uuid"',
    ')',
  ].join('\n'));
  await queryInterface.sequelize.query([
    'ALTER TABLE "area_to_area"',
    'ADD CONSTRAINT "area_to_area_primary" PRIMARY KEY (',
    '  "parent_uuid", "child_uuid"',
    ')',
  ].join('\n'));
  await queryInterface.sequelize.query([
    'ALTER TABLE "area_to_county"',
    'ADD CONSTRAINT "area_to_county_primary" PRIMARY KEY (',
    '  "area_uuid", "county_uuid"',
    ')',
  ].join('\n'));
  await queryInterface.sequelize.query([
    'ALTER TABLE "area_to_municipality"',
    'ADD CONSTRAINT "area_to_municipality_primary" PRIMARY KEY (',
    '  "area_uuid", "municipality_uuid"',
    ')',
  ].join('\n'));

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
