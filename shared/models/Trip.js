export default (sequelize, DataTypes) => {
  const Trip = sequelize.define('Trip', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    idLegacyNtb: { type: DataTypes.TEXT, unique: true },

    activityType: {
      // foreign key to TripType
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
    url: { type: DataTypes.TEXT },

    grading: {
      type: DataTypes.ENUM,
      values: ['easy', 'moderate', 'tough', 'very tough'],
    },
    suitableForChildren: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    distance: { type: DataTypes.INTEGER },
    direction: { type: DataTypes.ENUM, values: ['ab', 'aba'] },

    durationMinutes: { type: DataTypes.INTEGER },
    durationHours: { type: DataTypes.INTEGER },
    durationDays: { type: DataTypes.INTEGER },

    startingPoint: { type: DataTypes.GEOMETRY },
    geojson: { type: DataTypes.GEOMETRY },
    polyline: { type: DataTypes.TEXT },

    season: { type: DataTypes.ARRAY(DataTypes.INTEGER) },

    htgtGeneral: { type: DataTypes.TEXT },
    htgtPublicTransport: { type: DataTypes.TEXT },

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

  Trip.associate = (models) => {
    models.Trip.belongsTo(models.ActivityType, {
      as: 'ActivityType',
      foreignKey: 'activityType',
    });

    models.Trip.belongsToMany(models.ActivityType, {
      as: 'ActivityTypes',
      through: models.TripToActivityType,
      foreignKey: 'tripUuid',
    });
  };


  // HOOKS

  Trip.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return Trip;
};
