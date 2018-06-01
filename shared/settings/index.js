import * as fs from 'fs';

const DEV_SETTINGS_FILE = `${__dirname}/../../settings-dev.json`;
const TEST_SETTINGS_FILE = `${__dirname}/../../settings-dev.json`;
let OVERRIDE_SETTINGS_FILE;


// Use settings file for test
if (process.env.NODE_ENV === 'test') {
  OVERRIDE_SETTINGS_FILE = TEST_SETTINGS_FILE;
}

// Use settings file for development
if (process.env.NODE_ENV === 'development') {
  OVERRIDE_SETTINGS_FILE = DEV_SETTINGS_FILE;
}


// Read from override file if exists
let settingsJson = {};
if (fs.existsSync(OVERRIDE_SETTINGS_FILE)) {
  const settingsFile = fs.readFileSync(OVERRIDE_SETTINGS_FILE, 'utf-8');
  settingsJson = JSON.parse(settingsFile);
}


const variables = [
  // General variables
  { name: 'NODE_ENV', required: true },
  { name: 'LEGACY_MONGO_DB_URI', required: true },
  { name: 'LEGACY_MONGO_DB_NAME', required: true },
  { name: 'DB_DIALECT', default: 'postgres' },
  { name: 'DB_HOST', required: true },
  { name: 'DB_PORT', required: true },
  { name: 'DB_USER', required: true },
  { name: 'DB_PASSWORD', required: true },
  { name: 'DB_NAME', required: true },
  { name: 'DB_POOL_MIN', default: 1, format: 'number' },
  { name: 'DB_POOL_MAX', default: 5, format: 'number' },
  { name: 'DB_MIN_QUERY_TIME_FOR_LOGGING', default: 30, format: 'number' },

  // services/admin
  { name: 'SERVICES_ADMIN_PORT', default: 8080 },
  { name: 'SERVICES_ADMIN_SENTRY_DSN', default: null },
  { name: 'SERVICES_ADMIN_GA_CODE', default: null },
  { name: 'SERVICES_ADMIN_GTM_CODE', default: null },
  { name: 'SERVICES_ADMIN_OAUTH_CLIENT_ID', default: null },
  { name: 'SERVICES_ADMIN_OAUTH_CLIENT_SECRET', default: null },
  { name: 'SERVICES_ADMIN_OAUTH_DOMAIN', default: null },
  { name: 'SERVICES_ADMIN_SHERPA_API_DOMAIN', default: null },
  { name: 'SERVICES_ADMIN_REDIS_HOSTNAME', default: 'redis' },
  { name: 'SERVICES_ADMIN_REDIS_PORT', default: 6379 },

  // services/docs
  { name: 'SERVICES_DOCS_PORT', default: 8080 },
  { name: 'SERVICES_DOCS_SENTRY_DSN', default: null },
  { name: 'SERVICES_DOCS_GA_CODE', default: null },
  { name: 'SERVICES_DOCS_GTM_CODE', default: null },
];


// Read and export variables
const settings = {};

variables.forEach((variable) => {
  let value = settingsJson[variable.name] || process.env[variable.name];
  if (variable.default && value === undefined) {
    value = variable.default;
  }
  if (variable.required && value === undefined) {
    throw new Error(`The environment variable ${variable.name} is required`);
  }
  settings[variable.name] = value;
});

export default settings;
