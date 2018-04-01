// const VALID_POI_TYPES = [
//   'attraction',
//   'bathing spot',
//   'bridge',
//   'campground',
//   'climbing',
//   'public transport stop',
//   'food service',
//   'fishing',
//   'geocaching',
//   'grotto',
//   'kiting area',
//   'lookout point',
//   'mountain peak',
//   'orienteering',
//   'parking',
//   'picnic area',
//   'hut',
//   'fording place',
//   'shelter',
//   'sign point',
//   'ski lift',
//   'sledding hill',
//   'toilet',
//   'train station',
//   'trip record',
// ];


export default (sequelize, DataTypes) => {
  const Poi = sequelize.define('Poi', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    idLegacyNtb: { type: DataTypes.TEXT, unique: true },
    idSsr: { type: DataTypes.TEXT },

    type: {
      // Foreign key to PoiType
      type: DataTypes.TEXT,
      allowNull: false,
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

    description: { type: DataTypes.TEXT },
    descriptionPlain: { type: DataTypes.TEXT },

    coordinate: { type: DataTypes.GEOMETRY },
    season: { type: DataTypes.ARRAY(DataTypes.INTEGER) },
    open: { type: DataTypes.BOOLEAN },

    countyUuid: {
      type: DataTypes.UUID,
      validate: {
        isUUID: 4,
      },
    },

    municipalityUuid: {
      type: DataTypes.UUID,
      validate: {
        isUUID: 4,
      },
    },

    license: { type: DataTypes.TEXT },

    provider: { type: DataTypes.TEXT },

    status: {
      type: DataTypes.ENUM,
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

  Poi.associate = (models) => {
    models.Poi.belongsTo(models.County, {
      foreignKey: 'countyUuid',
    });

    models.Poi.belongsTo(models.Municipality, {
      foreignKey: 'municipalityUuid',
    });

    models.Poi.belongsTo(models.PoiType, {
      foreignKey: 'type',
    });

    models.Poi.belongsToMany(models.PoiType, {
      as: 'PoiTypes',
      through: { model: models.PoiToPoiType },
      foreignKey: 'poiUuid',
    });

    models.Poi.belongsToMany(models.Area, {
      as: 'Areas',
      through: models.PoiToArea,
      foreignKey: 'poiUuid',
    });

    models.Poi.belongsToMany(models.Group, {
      as: 'Groups',
      through: models.PoiToGroup,
      foreignKey: 'poiUuid',
    });

    models.Poi.belongsToMany(models.Accessability, {
      as: 'Accessabilities',
      through: { model: models.PoiAccessability },
      foreignKey: 'poiUuid',
    });

    models.Poi.belongsToMany(models.List, {
      through: {
        model: models.ListRelation,
        unique: false,
        scope: {
          documentType: 'poi',
        },
      },
      foreignKey: 'documentUuid',
      constraints: false,
    });
  };


  // HOOKS

  Poi.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return Poi;
};
