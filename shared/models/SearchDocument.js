export default (sequelize, DataTypes) => {
  const SearchDocument = sequelize.define('SearchDocument', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    // Foreign key to Area
    areaUuid: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: true,
      validate: {
        isUUID: 4,
      },
    },

    // Foreign key to Group
    groupUuid: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: true,
      validate: {
        isUUID: 4,
      },
    },

    // Foreign key to Cabin
    cabinUuid: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: true,
      validate: {
        isUUID: 4,
      },
    },

    // Foreign key to Poi
    poiUuid: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: true,
      validate: {
        isUUID: 4,
      },
    },

    // Foreign key to Trip
    tripUuid: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: true,
      validate: {
        isUUID: 4,
      },
    },

    // Foreign key to Route
    routeUuid: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: true,
      validate: {
        isUUID: 4,
      },
    },

    // Foreign key to County
    countyUuid: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: true,
      validate: {
        isUUID: 4,
      },
    },

    // Foreign key to Municipality
    municipalityUuid: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: true,
      validate: {
        isUUID: 4,
      },
    },

    status: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // * Fields created in migration 01
    // search_nb
    // search_en

    searchDocumentBoost: {
      type: DataTypes.FLOAT,
      allowNull: false,
      default: 1,
    },

    searchDocumentTypeBoost: {
      type: DataTypes.FLOAT,
      allowNull: false,
      default: 1,
    },
  }, {
    timestamps: true,
  });


  // Primary key for this table is created manually in migration 01
  SearchDocument.removeAttribute('id');


  // Associations

  SearchDocument.associate = (models) => {
    models.SearchDocument.belongsTo(models.Area, {
      as: 'Area',
      foreignKey: 'areaUuid',
    });

    models.SearchDocument.belongsTo(models.Group, {
      as: 'Group',
      foreignKey: 'groupUuid',
    });

    models.SearchDocument.belongsTo(models.Cabin, {
      as: 'Cabin',
      foreignKey: 'cabinUuid',
    });

    models.SearchDocument.belongsTo(models.Poi, {
      as: 'Poi',
      foreignKey: 'poiUuid',
    });

    models.SearchDocument.belongsTo(models.Trip, {
      as: 'Trip',
      foreignKey: 'tripUuid',
    });

    models.SearchDocument.belongsTo(models.Route, {
      as: 'Route',
      foreignKey: 'routeUuid',
    });

    models.SearchDocument.belongsTo(models.County, {
      as: 'County',
      foreignKey: 'countyUuid',
    });

    models.SearchDocument.belongsTo(models.Municipality, {
      as: 'Municipality',
      foreignKey: 'municipalityUuid',
    });
  };

  return SearchDocument;
};
