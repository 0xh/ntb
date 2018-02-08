import * as fs from 'fs';

const DEV_SETTINGS_FILE = `${__dirname}/../../settings-dev.json`;

let settingsJson = {};
if (fs.existsSync(DEV_SETTINGS_FILE)) {
  const settingsFile = fs.readFileSync(DEV_SETTINGS_FILE, 'utf-8');
  settingsJson = JSON.parse(settingsFile);
}

const _legacyMongoDbUri =
  settingsJson.LEGACY_MONGO_DB_URI || process.env.LEGACY_MONGO_DB_URI;
if (!_legacyMongoDbUri) {
  throw new Error('LEGACY_MONGO_DB_URI is required');
}

const _legacyMongoDbName =
  settingsJson.LEGACY_MONGO_DB_NAME || process.env.LEGACY_MONGO_DB_NAME;
if (!_legacyMongoDbName) {
  throw new Error('LEGACY_MONGO_DB_NAME is required');
}

const _dbHost =
  settingsJson.DB_HOST || process.env.DB_HOST;
if (!_dbHost) {
  throw new Error('DB_HOST is required');
}

const _dbPort =
  settingsJson.DB_PORT || process.env.DB_PORT;
if (!_dbPort) {
  throw new Error('DB_PORT is required');
}

const _dbUser =
  settingsJson.DB_USER || process.env.DB_USER;
if (!_dbUser) {
  throw new Error('DB_USER is required');
}

const _dbPassword =
  settingsJson.DB_PASSWORD || process.env.DB_PASSWORD;
if (!_dbPassword) {
  throw new Error('DB_PASSWORD is required');
}

const _dbName =
  settingsJson.DB_NAME || process.env.DB_NAME;
if (!_dbName) {
  throw new Error('DB_NAME is required');
}


const _dbPoolMin =
  +(settingsJson.DB_POOL_MIN || process.env.DB_POOL_MIN || 0);
const _dbPoolMax =
  +(settingsJson.DB_POOL_MAX || process.env.DB_POOL_MAX || 5);
const _dbPoolIdle =
  +(settingsJson.DB_POOL_IDLE || process.env.DB_POOL_IDLE || 10000);
const _dbPoolAcquire =
  +(settingsJson.DB_POOL_ACQUIRE || process.env.DB_POOL_ACQUIRE || 10000);
const _dbPoolEvict =
  +(settingsJson.DB_POOL_EVICT || process.env.DB_POOL_EVICT || 10000);

const _minQueryTimeForLogging = +(
  settingsJson.MIN_QUERY_TIME_FOR_LOGGING ||
  process.env.MIN_QUERY_TIME_FOR_LOGGING ||
  20
);


export const LEGACY_MONGO_DB_URI = _legacyMongoDbUri;
export const LEGACY_MONGO_DB_NAME = _legacyMongoDbName;

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

export const MIN_QUERY_TIME_FOR_LOGGING = _minQueryTimeForLogging;
