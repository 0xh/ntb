// @flow

import uuid4 from 'uuid/v4';

import { sequelize, Sequelize } from '@turistforeningen/ntb-shared-db-utils';

import CountyTranslation from './CountyTranslation';


const County = sequelize.define('county', {
  uuid: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: uuid4(),
    validate: {
      isUUID: 4,
    },
  },

  name: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true,
    },
  },

  nameLowercase: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true,
    },
  },

  status: {
    type: Sequelize.ENUM,
    values: ['draft', 'public', 'deleted', 'private'],
  },

  dataSource: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['nameLowerCase'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['dataSource'],
    },
  ],
});


// ASSOCIATIONS

County.hasMany(CountyTranslation, {
  as: 'Translation',
  foreignKey: 'countyUuid',
});


// HOOKS

County.hook('beforeSave', (instance: County) => {
  instance.nameLowercase = instance.name.toLowerCase();
});


export default County;
