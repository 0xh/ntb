export default (sequelize, DataTypes) => {
  const Picture = sequelize.define('Picture', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    idLegacyNtb: { type: DataTypes.TEXT, unique: true },

    areaUuid: { type: DataTypes.UUID },
    cabinUuid: { type: DataTypes.UUID },
    listUuid: { type: DataTypes.UUID },
    poiUuid: { type: DataTypes.UUID },
    routeUuid: { type: DataTypes.UUID },
    tripUuid: { type: DataTypes.UUID },

    sortIndex: { type: DataTypes.INTEGER },

    cabinPictureType: {
      type: DataTypes.TEXT,
    },

    photographerName: { type: DataTypes.TEXT },
    photographerEmail: { type: DataTypes.TEXT },
    photographerCredit: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT },

    coordinates: { type: DataTypes.GEOMETRY },

    original: { type: DataTypes.JSONB },
    exif: { type: DataTypes.JSONB },
    versions: { type: DataTypes.JSONB },

    license: { type: DataTypes.TEXT },
    provider: { type: DataTypes.TEXT, allowNull: false },

    // These legacy fields are only used when importing data from leagcy-ntb
    legacyFirstTag: { type: DataTypes.TEXT },
    legacyTags: { type: DataTypes.ARRAY(DataTypes.TEXT) },

    status: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  Picture.associate = (models) => {
    models.Picture.belongsTo(models.DocumentStatus, {
      foreignKey: 'status',
    });

    models.Picture.belongsTo(models.CabinPictureType, {
      foreignKey: 'cabinPictureType',
    });

    models.Picture.belongsTo(models.Area, {
      foreignKey: 'areaUuid',
    });

    models.Picture.belongsTo(models.Cabin, {
      foreignKey: 'cabinUuid',
    });

    models.Picture.belongsTo(models.List, {
      foreignKey: 'listUuid',
    });

    models.Picture.belongsTo(models.Poi, {
      foreignKey: 'poiUuid',
    });

    models.Picture.belongsTo(models.Route, {
      foreignKey: 'routeUuid',
    });

    models.Picture.belongsTo(models.Trip, {
      foreignKey: 'tripUuid',
    });
  };

  return Picture;
};
