// @flow

import uuid4 from 'uuid/v4';

import { sequelize, Sequelize } from '@turistforeningen/ntb-shared-db-utils';


const CountyTranslation = sequelize.define('countyTranslation', {
  uuid: {
    type: Sequelize.UUID,
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

  language: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true,
    },
  },

  dataSource: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['nameLowercase'],
    },
    {
      fields: ['dataSource'],
    },
  ],
});


// ASSOCIATIONS

CountyTranslation.belongsTo('county', {
  foreignKey: 'countyUuid',
});


// HOOKS

CountyTranslation.hook('beforeSave', (instance: CountyTranslation) => {
  instance.nameLowercase = instance.name.toLowerCase();
});


export default CountyTranslation;
