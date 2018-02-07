// @flow

import _Sequelize from 'sequelize';
import type {
  QueryInterface as _QueryInterface,
  DataTypes as _DataTypes,
} from 'sequelize';

import * as settings from '@turistforeningen/ntb-shared-settings';

// ##################################
// Export flow types
// ##################################


export type QueryInterface = _QueryInterface;
export type DataTypes = _DataTypes;


// ##################################
// Utilities
// ##################################

// Export Sequelize module
// This helps us in only requiering the sequelize npm module in one package
// and probably avoid version upgrade mismatching between packages.
export const Sequelize = _Sequelize;


// Create and export sequelize instance
export const sequelize = new _Sequelize(
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
  }
);
