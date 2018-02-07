// @flow

import * as settings from '@turistforeningen/ntb-shared-settings';


module.exports = {
  development: {
    username: settings.DB_USER,
    password: settings.DB_PASSWORD,
    database: settings.DB_NAME,
    host: settings.DB_HOST,
    port: settings.DB_PORT,
    dialect: 'postgres',
  },
  test: {
    username: settings.DB_USER,
    password: settings.DB_PASSWORD,
    database: settings.DB_NAME,
    host: settings.DB_HOST,
    port: settings.DB_PORT,
    dialect: 'postgres',
  },
  production: {
    username: settings.DB_USER,
    password: settings.DB_PASSWORD,
    database: settings.DB_NAME,
    host: settings.DB_HOST,
    port: settings.DB_PORT,
    dialect: 'postgres',
  },
};
