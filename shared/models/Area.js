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

    geometry: { type: DataTypes.GEOMETRY },
    map: { type: DataTypes.TEXT },
    url: { type: DataTypes.TEXT },

    license: { type: DataTypes.TEXT },
    provider: { type: DataTypes.TEXT, allowNull: false },

    status: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    models.Area.belongsTo(models.DocumentStatus, {
      foreignKey: 'status',
    });

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

  Area.fields = [
    'uri',
    'uuid',
    'name',
    'description',
    'geometry',
    'map',
    'url',
    'license',
    'provider',
    'status',
    'updated_at',
    'created_at',
  ];

  Area.getAPIConfig = (models) => {
    const config = { byReferrer: {} };

    // Configuration when it's the entry model
    config.byReferrer['*onEntry'] = {
      paginate: true,
      fullTextSearch: true,
      ordering: true,

      defaultLimit: 10,
      maxLimit: 50,
      validOrderFields: [
        'name',
        'updatedAt',
        'createdAt',
      ],
      defaultOrder: [['name', 'DESC']],
      validFields: [
        ['uri', true],
        ['uuid', true],
        ['name', true],
        ['description', true],
        ['geometry', true],
        ['map', true],
        ['url', true],
        ['license', true],
        ['provider', true],
        ['status', true],
        ['updatedAt', true],
        ['createdAt', false],
      ],
      include: {
        parents: { association: 'Parents' },
        children: { association: 'Children' },
      },
    };

    // Configuration when included through Area.Parents
    config.byReferrer['Area.Parents'] = {
      ...config.byReferrer['*onEntry'],
      include: null,
    };

    // Configuration when included through Area.Parents
    config.byReferrer['Area.Children'] = {
      ...config.byReferrer['*onEntry'],
      include: null,
    };

    // Default configuration when included from another model
    config.byReferrer.default = {
      ...config.byReferrer['*onEntry'],
      include: null,
    };

    return config;
  };

  Area.fieldsToAttributes = (fields) => {
    const attributes = fields.map((field) => {
      switch (field) {
        case 'uri':
          return null;
        default:
          if (Area.fields.includes(field)) {
            return field;
          }
          throw new Error(`Unable to translate field ${field} on Area model`);
      }
    }).filter((field) => field !== null);

    return attributes;
  };

  Area.format = (instance) => (
    {
      uri: `area/${instance.uuid}`,
      uuid: instance.uuid,
      name: instance.name,
      description: instance.description,
      geometry: instance.geometry,
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
