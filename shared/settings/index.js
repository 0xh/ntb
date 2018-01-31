// @flow

import * as fs from 'fs';

const DEV_SETTINGS_FILE = `${__dirname}/../../settings.json`;

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

const _neo4jUri =
  settingsJson.NEO4J_URI || process.env.NEO4J_URI;
if (!_neo4jUri) {
  throw new Error('NEO4J_URI is required');
}

const _neo4jUser =
  settingsJson.NEO4J_USER || process.env.NEO4J_USER;
if (!_neo4jUser) {
  throw new Error('NEO4J_USER is required');
}

const _neo4jPassword =
  settingsJson.NEO4J_PASSWORD || process.env.NEO4J_PASSWORD;
if (!_neo4jPassword) {
  throw new Error('NEO4J_PASSWORD is required');
}


export const LEGACY_MONGO_DB_URI: string = _legacyMongoDbUri;
export const LEGACY_MONGO_DB_NAME: string = _legacyMongoDbName;
export const NEO4J_URI: string = _neo4jUri;
export const NEO4J_USER: string = _neo4jUser;
export const NEO4J_PASSWORD: string = _neo4jPassword;
