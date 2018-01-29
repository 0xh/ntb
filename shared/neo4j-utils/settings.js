// @flow

'use strict';

const settingsJson = require('../../settings.json');


type settingsObject = {
  +NTB_HOST: string,
  +NTB_KEY: string,

  +LEGACY_MONGO_DB_URI: string,
  +LEGACY_MONGO_DB_NAME: string,

  +NEO4J_URI: string,
  +NEO4J_USER: string,
  +NEO4J_PASSWORD: string,
};


const settings: settingsObject = {
  ...settingsJson,
};


module.exports = settings;
