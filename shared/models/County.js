export default (sequelize, DataTypes) => {
  const County = sequelize.define('County', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    code: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    nameLowerCase: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    status: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ['draft', 'public', 'deleted', 'private'],
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  County.associate = (models) => {
    models.County.hasMany(models.CountyTranslation, {
      as: 'Translations',
    });

    models.County.belongsToMany(models.Area, {
      as: 'Areas',
      through: models.AreaToCounty,
      foreignKey: 'countyUuid',
    });
  };


  // HOOKS

  County.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return County;
};
