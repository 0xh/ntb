import _ from 'lodash';

import settings from '@turistforeningen/ntb-shared-settings';
import {
  startDuration,
  endDuration,
  createLogger,
} from '@turistforeningen/ntb-shared-utils';

import _Knex from 'knex';
import { Model as _Model, AjvValidator as _AjvValidator } from 'objection';
import { knexIdentifierMappers } from 'objection/lib/utils/identifierMapping';
import knexPostgis from 'knex-postgis';


const logger = createLogger();


// ##################################
// Utilities
// ##################################

// Export related libraries
// This helps us in only requiring the Knex/Objection npm modules in one
// package and probably avoid version upgrade mismatching between packages.
export const Knex = _Knex;
export const Model = _Model;
export const AjvValidator = _AjvValidator;

// Create and export the connection configuration. This configuration is also
// used in the migrations Knex-CLI
export const knexConfig = {
  client: 'pg',
  connection: {
    host: settings.DB_HOST,
    port: settings.DB_PORT,
    user: settings.DB_USER,
    password: settings.DB_PASSWORD,
    database: settings.DB_NAME,
  },
  pool: {
    max: settings.DB_POOL_MAX,
    min: settings.DB_POOL_MIN,
  },
  // debug: true,

  // Use lodash to set correct identifier case.
  // We use lodash and not the ObjectionJS internal one in order to be sure
  // we use the same identifier format elswhere in our code
  ...knexIdentifierMappers({
    parse: (str) => _.camelCase(str) || str,
    format: (str) => _.snakeCase(str) || str,
  }),
};

// Create and export the knex instance
// eslint-disable-next-line new-cap
export const knex = Knex(knexConfig);

// Install postgis function
knexPostgis(knex);


knex.on('query', (data) => {
  logger.debug('Query start');

  if (settings.ENV_IS_DEVELOPMENT) {
    logger.debug(
      data.sql.length > 500
        ? `${data.sql.substr(0, 500)}... [TRUNCATED]`
        : data.sql
    );
    if (data.bindings.length && data.bindings.length <= 20) {
      logger.debug(data.bindings);
    }
    else if (data.bindings.length) {
      logger.debug('[Too many sql bindings to log]');
    }
  }

  startDuration(data.__knexQueryUid);
});


knex.on('query-error', (data) => {
  logger.debug('Query failed');
  endDuration(data.__knexQueryUid);
});


knex.on('query-response', (data) => {
  logger.debug('Query success');
  endDuration(data.__knexQueryUid);
});


// Give the knex object to objection.
Model.knex(knex);
