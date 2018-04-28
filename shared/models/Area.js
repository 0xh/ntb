export default (sequelize, DataTypes) => {
  const attributeConfig = {
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
  };

  const modelConfig = {
    timestamps: true,
  };

  const Area = sequelize.define('Area', attributeConfig, modelConfig);


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

    models.Area.hasMany(models.AreaToArea, {
      as: 'AreaToAreaParent',
      foreignKey: 'parentUuid',
      sourceKey: 'uuid',
    });

    models.Area.hasMany(models.AreaToArea, {
      as: 'AreaToAreaChild',
      foreignKey: 'childUuid',
      sourceKey: 'uuid',
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


  // API CONFIGURATION

  Area.APIEntryModel = true;

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
      defaultOrder: [['name', 'ASC']],
      // validFields - true/false if they should be returned from API as
      // default if no ?fields=.. parameter is specified
      validFields: {
        uri: true,
        id: true,
        name: true,
        description: true,
        geometry: true,
        map: true,
        url: true,
        license: true,
        provider: true,
        status: true,
        dataSource: true,
        updatedAt: true,
        createdAt: false,
      },
      include: {
        parents: {
          includeByDefault: true,
          model: models.Area,
          through: {
            association: 'AreaToAreaParent',
            reverseAssociation: 'Parent',
            foreignKey: 'childUuid',
            otherKey: 'parentUuid',
          },
        },
        children: {
          includeByDefault: true,
          model: models.Area,
          through: {
            association: 'AreaToAreaChild',
            reverseAssociation: 'Child',
            foreignKey: 'parentUuid',
            otherKey: 'childUuid',
          },
        },
      },
    };

    // Default configuration when included from another model
    config.byReferrer.default = {
      ...config.byReferrer['*onEntry'],

      validFields: {
        // Allow the same fields as '*onEntry' but set them to default false
        ...Object.assign(
          {},
          ...(
            Object.keys(config.byReferrer['*onEntry'].validFields)
              .map((f) => ({
                [f]: false,
              }))
          )
        ),
        uri: true,
        id: true,
        name: true,
      },

      include: {
        parents: {
          ...config.byReferrer['*onEntry'].include.parents,
          includeByDefault: false,
        },
        children: {
          ...config.byReferrer['*onEntry'].include.children,
          includeByDefault: false,
        },
      },
    };

    return config;
  };

  Area.fieldsToAttributes = (fields) => {
    const attributes = [].concat(...fields.map((field) => {
      switch (field) {
        case 'uri':
          return null;
        case 'id':
          return ['uuid'];
        case 'createdAt':
        case 'updatedAt':
          if (modelConfig.timestamps) {
            return [field];
          }
          throw new Error(`Unable to translate field ${field} on Area model`);
        default:
          if (Object.keys(attributeConfig).includes(field)) {
            return [field];
          }
          throw new Error(`Unable to translate field ${field} on Area model`);
      }
    }).filter((field) => field !== null));

    return attributes;
  };

  Area.prototype.format = function format() {
    return {
      uri: `area/${this.uuid}`,
      id: this.uuid,
      name: this.name,
      description: this.description,
      geometry: this.geometry,
      map: this.map,
      url: this.url,
      license: this.license,
      provider: this.provider,
      status: this.status,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
  };

  return Area;
};
