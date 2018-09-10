import settings from '@ntb/settings';
import {
  startDuration,
  printDuration,
  Logger,
  _,
} from '@ntb/utils';

import Knex from 'knex';
import { Model as _Model } from 'objection';
import { knexIdentifierMappers } from 'objection/lib/utils/identifierMapping';
import knexPostgis from 'knex-postgis';


const logger = Logger.getLogger();


// ##################################
// Utilities
// ##################################

// Export related libraries
// This helps us in only requiring the Knex/Objection npm modules in one
// package and probably avoid version upgrade mismatching between packages.
export class Model extends _Model {}
export {
  AjvValidator,
  RelationMappings,
  RelationMapping,
  Relations,
  Relation,
  JsonSchema,
} from 'objection';

// Create and export the connection configuration. This configuration is also
// used in the migrations Knex-CLI
export const knexConfig: Knex.Config = {
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
    parse: (str: string) => _.camelCase(str) || str,
    format: (str: string) => _.snakeCase(str) || str,
  }),
};

// Create and export the knex instance
// eslint-disable-next-line new-cap
export const knex = Knex(knexConfig);

// Install postgis function (spatial type (st))
export const st = knexPostgis(knex);

// Export types
export { default as Knex } from 'knex';

// Give the knex object to objection.
Model.knex(knex);


// Add events
interface KnexEventData extends Knex.Sql {
  __knexQueryUid: string;
}


knex.on('query', (status: KnexEventData) => {
  logger.debug('Query start');

  if (settings.ENV_IS_DEVELOPMENT) {
    logger.debug(
      status.sql.length > 1500
        ? `${status.sql.substr(0, 1500)}... [TRUNCATED]`
        : status.sql
    );
    if (status.bindings && status.bindings.length && status.bindings.length <= 20) {
      logger.debug(status.bindings);
    }
    else if (status.bindings && status.bindings.length) {
      logger.debug('[Too many sql bindings to log]');
    }
  }

  startDuration(status.__knexQueryUid);
});


knex.on('query-error', (_data: {}, status: KnexEventData) => {
  if (status.__knexQueryUid) {
    printDuration(
      status.__knexQueryUid,
      '- Query failed! Duration: %duration',
      'error',
    );
  }
});


knex.on('query-response', (_data: {}, status: KnexEventData) => {
  if (status.__knexQueryUid) {
    printDuration(status.__knexQueryUid, '- Query success! Duration: %duration');
  }
});
