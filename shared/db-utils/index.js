// @flow

import Sequelize from 'sequelize';

import {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_POOL_MIN,
  DB_POOL_MAX,
  DB_POOL_IDLE,
  DB_POOL_ACQUIRE,
  DB_POOL_EVICT,
} from '@turistforeningen/ntb-shared-settings';


export default new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',

  pool: {
    max: DB_POOL_MAX,
    min: DB_POOL_MIN,
    idle: DB_POOL_IDLE,
    acquire: DB_POOL_ACQUIRE,
    evict: DB_POOL_EVICT,
  },
});
