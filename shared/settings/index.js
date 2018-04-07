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


// ENV
const _env =
  settingsJson.NODE_ENV || process.env.NODE_ENV;
if (!_env) {
  throw new Error('NODE_ENV is required');
}


// LEGACY_MONGO_DB_URI
const _legacyMongoDbUri =
  settingsJson.LEGACY_MONGO_DB_URI || process.env.LEGACY_MONGO_DB_URI;
if (!_legacyMongoDbUri) {
  throw new Error('LEGACY_MONGO_DB_URI is required');
}

// LEGACY_MONGO_DB_NAME
const _legacyMongoDbName =
  settingsJson.LEGACY_MONGO_DB_NAME || process.env.LEGACY_MONGO_DB_NAME;
if (!_legacyMongoDbName) {
  throw new Error('LEGACY_MONGO_DB_NAME is required');
}

// DB_DIALECT
const _dbDialect =
  settingsJson.DB_DIALECT || process.env.DB_DIALECT || 'postgres';

// DB_HOST
const _dbHost =
  settingsJson.DB_HOST || process.env.DB_HOST;
if (!_dbHost) {
  throw new Error('DB_HOST is required');
}

// DB_PORT
const _dbPort =
  settingsJson.DB_PORT || process.env.DB_PORT;
if (!_dbPort) {
  throw new Error('DB_PORT is required');
}

// DB_USER
const _dbUser =
  settingsJson.DB_USER || process.env.DB_USER;
if (!_dbUser) {
  throw new Error('DB_USER is required');
}

// DB_PASSWORD
const _dbPassword =
  settingsJson.DB_PASSWORD || process.env.DB_PASSWORD;
if (!_dbPassword) {
  throw new Error('DB_PASSWORD is required');
}

// DB_NAME
const _dbName =
  settingsJson.DB_NAME || process.env.DB_NAME;
if (!_dbName) {
  throw new Error('DB_NAME is required');
}


// DB_POOL_MIN
const _dbPoolMin =
  +(settingsJson.DB_POOL_MIN || process.env.DB_POOL_MIN || 0);

// DB_POOL_MAX
const _dbPoolMax =
  +(settingsJson.DB_POOL_MAX || process.env.DB_POOL_MAX || 5);

// DB_POOL_IDLE
const _dbPoolIdle =
  +(settingsJson.DB_POOL_IDLE || process.env.DB_POOL_IDLE || 10000);

// DB_POOL_ACQUIRE
const _dbPoolAcquire =
  +(settingsJson.DB_POOL_ACQUIRE || process.env.DB_POOL_ACQUIRE || 10000);

// DB_POOL_EVICT
const _dbPoolEvict =
  +(settingsJson.DB_POOL_EVICT || process.env.DB_POOL_EVICT || 10000);

// DB_MIN_QUERY_TIME_FOR_LOGGING
const _dbMinQueryTimeForLogging = +(
  settingsJson.DB_MIN_QUERY_TIME_FOR_LOGGING ||
  process.env.DB_MIN_QUERY_TIME_FOR_LOGGING ||
  30
);


export const ENV = _env;

export const LEGACY_MONGO_DB_URI = _legacyMongoDbUri;
export const LEGACY_MONGO_DB_NAME = _legacyMongoDbName;

export const DB_DIALECT = _dbDialect;
export const DB_HOST = _dbHost;
export const DB_PORT = +_dbPort;
export const DB_USER = _dbUser;
export const DB_PASSWORD = _dbPassword;
export const DB_NAME = _dbName;
export const DB_POOL_MIN = _dbPoolMin;
export const DB_POOL_MAX = _dbPoolMax;
export const DB_POOL_IDLE = _dbPoolIdle;
export const DB_POOL_ACQUIRE = _dbPoolAcquire;
export const DB_POOL_EVICT = _dbPoolEvict;

export const DB_MIN_QUERY_TIME_FOR_LOGGING = _dbMinQueryTimeForLogging;
