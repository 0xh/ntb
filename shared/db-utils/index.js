import path from 'path';
import _Sequelize from 'sequelize';
import _ from 'lodash';
import uuid4 from 'uuid/v4';

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
export const sequelize = settings.DB_DIALECT === 'postgres'
  ? new _Sequelize(
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

      logging: (sql, duration) => {
        if (duration >= settings.DB_MIN_QUERY_TIME_FOR_LOGGING) {
          logger.info(`SQL QUERY :: ${duration}ms execution time`);
          let msg = sql;
          if (msg.length > 500) {
            msg = `${msg.substr(0, 500)} ... [TRUNCATED]`;
          }
          logger.info(msg);
        }
      },
    }
  )
  // Database used for testing
  : new _Sequelize(
    settings.DB_NAME,
    null,
    null,
    {
      storage: path.resolve(__dirname, '..', '..', 'test.sqlite'),
      dialect: 'sqlite',
      operatorsAliases: Op,
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

  // Set snace case on through-tables fields
  if (options.foreignKey) {
    options.foreignKey = _.snakeCase(options.foreignKey);
  }
  if (options.otherKey) {
    options.otherKey = _.snakeCase(options.otherKey);
  }
  if (options.sourceKey) {
    options.sourceKey = _.snakeCase(options.sourceKey);
  }
  if (options.targetKey) {
    options.targetKey = _.snakeCase(options.targetKey);
  }
});


sequelize.addHook('afterDefine', (factory) => {
  // Set camel case on createdAt and updatedAt for retrieval
  if (factory.rawAttributes.created_at) {
    factory.rawAttributes.createdAt = {
      ...factory.rawAttributes.created_at,
      fieldName: 'createdAt',
    };
    delete factory.rawAttributes.created_at;
  }
  if (factory.rawAttributes.updated_at) {
    factory.rawAttributes.updatedAt = {
      ...factory.rawAttributes.updated_at,
      fieldName: 'updatedAt',
    };
    delete factory.rawAttributes.updated_at;
  }
});


sequelize.addHook('beforeFindAfterOptions', (options) => {
  // Snake case column names in order satement
  if (options.order) {
    if (Array.isArray(options.order)) {
      options.order.forEach((order, idx) => {
        options.order[idx] = order.map((o) => {
          if (!['desc', 'asc'].includes(o.toLowerCase())) {
            return _.snakeCase(o);
          }
          return o;
        });
      });
    }
  }
});


// HELPERS


export function getSqlFromFindAll(Model, options) {
  const id = uuid4();
  return new Promise((resolve, reject) => {
    Model.addHook('beforeFindAfterOptions', id, (opts) => {
      if (opts._hookId) {
        Model.removeHook('beforeFindAfterOptions', opts._hookId);

        try {
          opts._hookResolver(
            Model.sequelize.dialect.QueryGenerator.selectQuery(
              Model.getTableName(),
              opts,
              Model
            ).slice(0, -1)
          );
        }
        catch (err) {
          opts._hookRejecter(err);
        }
      }
    });

    options._hookId = id;
    options._hookResolver = resolve;
    options._hookRejecter = reject;
    Model.findAll(options).catch(reject);
  });
}
