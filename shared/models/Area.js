export default (sequelize, DataTypes) => {
  const Area = sequelize.define('Area', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    idLegacyNtb: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: true,
    },

    name: {
      type: DataTypes.TEXT,
      validate: {
        notEmpty: true,
      },
    },

    nameLowerCase: {
      type: DataTypes.TEXT,
      validate: {
        notEmpty: true,
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    descriptionPlain: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    descriptionWords: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },

    descriptionWordsStemmed: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },

    geojson: {
      type: DataTypes.GEOMETRY,
      allowNull: true,
    },

    map: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    license: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    provider: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM,
      values: ['draft', 'public', 'deleted', 'private'],
    },

    dataSource: {
      type: DataTypes.TEXT,
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


  // Associations

  Area.associate = (models) => {
    models.Area.belongsToMany(models.Area, {
      as: 'Children',
      through: models.AreaToArea,
      foreignKey: 'parentUuid',
      otherKey: 'childUuid',
    });

    models.Area.belongsToMany(models.Area, {
      as: 'Parents',
      through: models.AreaToArea,
      foreignKey: 'childUuid',
      otherKey: 'parentUuid',
    });

    models.Area.belongsToMany(models.County, {
      as: 'Counties',
      through: models.AreaToCounty,
      foreignKey: 'areaUuid',
    });

    models.Area.belongsToMany(models.Municipality, {
      as: 'Municipalities',
      through: models.AreaToMunicipality,
      foreignKey: 'areaUuid',
    });
  };


  // HOOKS

  Area.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return Area;
};
