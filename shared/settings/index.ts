import getEnvValue from './getEnvValue';


const NODE_ENV = getEnvValue('NODE_ENV', 'string', true);


export default {
  NODE_ENV,
  ENV_IS_PRODUCTION: NODE_ENV === 'production',
  ENV_IS_DEVELOPMENT: NODE_ENV === 'development',
  ENV_IS_TEST: NODE_ENV === 'test',

  LEGACY_MONGO_DB_URI:
    getEnvValue('LEGACY_MONGO_DB_URI', 'string', true),
  LEGACY_MONGO_DB_NAME:
    getEnvValue('LEGACY_MONGO_DB_NAME', 'string', true),
  DB_DIALECT:
    getEnvValue('DB_DIALECT', 'string', false, 'postgres'),
  DB_HOST:
    getEnvValue('DB_HOST', 'string', true),
  DB_PORT:
    getEnvValue('DB_PORT', 'number', true),
  DB_USER:
    getEnvValue('DB_USER', 'string', true),
  DB_PASSWORD:
    getEnvValue('DB_PASSWORD', 'string', true),
  DB_NAME:
    getEnvValue('DB_NAME', 'string', true),
  DB_POOL_MIN:
    getEnvValue('DB_POOL_MIN', 'number', false, 1),
  DB_POOL_MAX:
    getEnvValue('DB_POOL_MAX', 'number', false, 5),
  DB_MIN_QUERY_TIME_FOR_LOGGING:
    getEnvValue('DB_MIN_QUERY_TIME_FOR_LOGGING', 'number', false, 30),
  MAPBOX_TOKEN:
    getEnvValue('MAPBOX_TOKEN', 'string', true),

  // services/admin
  SERVICES_ADMIN_PORT:
    getEnvValue('SERVICES_ADMIN_PORT', 'number', false, 8080),
  SERVICES_ADMIN_SENTRY_DSN:
    getEnvValue('SERVICES_ADMIN_SENTRY_DSN', 'string', false, null),
  SERVICES_ADMIN_GA_CODE:
    getEnvValue('SERVICES_ADMIN_GA_CODE', 'string', false, null),
  SERVICES_ADMIN_GTM_CODE:
    getEnvValue('SERVICES_ADMIN_GTM_CODE', 'string', false, null),
  SERVICES_ADMIN_OAUTH_CLIENT_ID:
    getEnvValue('SERVICES_ADMIN_OAUTH_CLIENT_ID', 'string', false, null),
  SERVICES_ADMIN_OAUTH_CLIENT_SECRET:
    getEnvValue('SERVICES_ADMIN_OAUTH_CLIENT_SECRET', 'string', false, null),
  SERVICES_ADMIN_OAUTH_DOMAIN:
    getEnvValue('SERVICES_ADMIN_OAUTH_DOMAIN', 'string', false, null),
  SERVICES_ADMIN_SHERPA_API_DOMAIN:
    getEnvValue('SERVICES_ADMIN_SHERPA_API_DOMAIN', 'string', false, null),
  SERVICES_ADMIN_REDIS_HOSTNAME:
    getEnvValue('SERVICES_ADMIN_REDIS_HOSTNAME', 'string', false, 'redis'),
  SERVICES_ADMIN_REDIS_PORT:
    getEnvValue('SERVICES_ADMIN_REDIS_PORT', 'number', false, 6379),

  // services/docs
  SERVICES_DOCS_PORT:
    getEnvValue('SERVICES_DOCS_PORT', 'number', false, 8080),
  SERVICES_DOCS_SENTRY_DSN:
    getEnvValue('SERVICES_DOCS_SENTRY_DSN', 'string', false, null),
  SERVICES_DOCS_GA_CODE:
    getEnvValue('SERVICES_DOCS_GA_CODE', 'string', false, null),
  SERVICES_DOCS_GTM_CODE:
    getEnvValue('SERVICES_DOCS_GTM_CODE', 'string', false, null),
};
