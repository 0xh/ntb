import _Sequelize from 'sequelize';
import _ from 'lodash';

import * as settings from '@turistforeningen/ntb-shared-settings';
import { createLogger } from '@turistforeningen/ntb-shared-utils';


const logger = createLogger();


// ##################################
// Utilities
// ##################################

// Export Sequelize module
// This helps us in only requiring the sequelize npm module in one package
// and probably avoid version upgrade mismatching between packages.
export const Sequelize = _Sequelize;
const { Op } = Sequelize;


// Create and export sequelize instance
export const sequelize = new _Sequelize(
  settings.DB_NAME,
  settings.DB_USER,
  settings.DB_PASSWORD,
  {
    host: settings.DB_HOST,
    port: settings.DB_PORT,
    dialect: 'postgres',

    pool: {
      max: settings.DB_POOL_MAX,
      min: settings.DB_POOL_MIN,
      idle: settings.DB_POOL_IDLE,
      acquire: settings.DB_POOL_ACQUIRE,
      evict: settings.DB_POOL_EVICT,
    },

    operatorsAliases: Op,
    benchmark: true,

    logging: (msg, duration) => {
      if (duration >= settings.DB_MIN_QUERY_TIME_FOR_LOGGING) {
        logger.info(`SQL QUERY :: ${duration}ms execution time`);
        logger.info(msg);
      }
    },
  }
);


// Use snake case for all the tings in the database
sequelize.addHook('beforeDefine', (attributes, options) => {
  // Set tablename to snake case if not set in model definition
  if (!options.tableName) {
    options.tableName = _.snakeCase(options.modelName);
  }

  // Set underscored to snake case timestamps (if used)
  options.underscored = true;

  // Set `field` name to snake case if not set in modle definition
  Object.keys(attributes).forEach((key) => {
    if (!attributes[key].field) {
      attributes[key].field = _.snakeCase(key);
    }
  });

  // Snake case fields in indexes
  options.indexes.forEach((index) => {
    const newFields = [];
    index.fields.forEach((field) => {
      if (attributes[field]) {
        newFields.push(attributes[field].field);
      }
      else {
        newFields.push(_.snakeCase(field));
      }
    });
    index.fields = newFields;
  });
});
