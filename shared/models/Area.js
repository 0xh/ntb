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

    idLegacyNtb: { type: DataTypes.TEXT, unique: true },

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

    description: { type: DataTypes.TEXT },
    descriptionPlain: { type: DataTypes.TEXT },

    geojson: { type: DataTypes.GEOMETRY },
    map: { type: DataTypes.TEXT },
    url: { type: DataTypes.TEXT },

    license: { type: DataTypes.TEXT },
    provider: { type: DataTypes.TEXT, allowNull: false },

    status: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ['draft', 'public', 'deleted', 'private'],
    },

    dataSource: { type: DataTypes.TEXT },

    searchDocumentBoost: {
      type: DataTypes.FLOAT,
      default: 1,
      allowNull: false,
    },
  }, {
    timestamps: true,
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

    models.Area.belongsToMany(models.Cabin, {
      as: 'Cabins',
      through: models.CabinToArea,
      foreignKey: 'areaUuid',
    });

    models.Area.belongsToMany(models.Poi, {
      as: 'Pois',
      through: models.PoiToArea,
      foreignKey: 'areaUuid',
    });
  };


  // HOOKS

  Area.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });


  // API presentation

  Area.format = (instance) => (
    {
      uuid: instance.uuid,
      name: instance.name,
      description: instance.description,
      geojson: instance.geojson,
      map: instance.map,
      url: instance.url,
      license: instance.license,
      provider: instance.provider,
      status: instance.status,
      updatedAt: instance.updatedAt,
      createdAt: instance.createdAt,
    }
  );

  return Area;
};
