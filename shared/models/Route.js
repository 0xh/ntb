export default (sequelize, DataTypes) => {
  const Route = sequelize.define('Route', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    idLegacyNtbAb: { type: DataTypes.TEXT, unique: true },
    idLegacyNtbBa: { type: DataTypes.TEXT, unique: true },

    code: { type: DataTypes.TEXT, unique: true, allowNull: false },

    type: {
      type: DataTypes.ENUM,
      allowNull: false,
      values: ['summer', 'winter'],
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
    descriptionAb: { type: DataTypes.TEXT },
    descriptionAbPlain: { type: DataTypes.TEXT },
    descriptionBa: { type: DataTypes.TEXT },
    descriptionBaPlain: { type: DataTypes.TEXT },

    url: { type: DataTypes.TEXT },
    source: { type: DataTypes.TEXT },
    notes: { type: DataTypes.TEXT },

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

    waymarkWinterAllYear: {
      type: DataTypes.BOOLEAN,
      default: false,
      allowNull: false,
    },
    waymarkWinterFrom: { type: DataTypes.DATE },
    waymarkWinterTo: { type: DataTypes.DATE },
    waymarkWinterComment: { type: DataTypes.TEXT },

    durationMinutes: { type: DataTypes.INTEGER },
    durationHours: { type: DataTypes.INTEGER },
    durationDays: { type: DataTypes.INTEGER },

    pointA: { type: DataTypes.GEOMETRY },
    pointB: { type: DataTypes.GEOMETRY },
    pathAbGeojson: { type: DataTypes.GEOMETRY },
    pathBaGeojson: { type: DataTypes.GEOMETRY },
    pathAbPolyline: { type: DataTypes.TEXT },
    pathBaPolyline: { type: DataTypes.TEXT },

    season: { type: DataTypes.ARRAY(DataTypes.INTEGER) },

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

  Route.associate = (models) => {
    models.Route.belongsToMany(models.ActivityType, {
      as: 'SuitableActivityTypes',
      through: models.RouteToActivityType,
      foreignKey: 'routeUuid',
    });

    models.Route.belongsToMany(models.RouteWaymarkType, {
      as: 'RouteWaymarkTypes',
      through: { model: models.RouteToRouteWaymarkType },
      foreignKey: 'routeUuid',
    });
  };


  // HOOKS

  Route.hook('beforeSave', (instance) => {
    instance.nameLowerCase = instance.name.toLowerCase();
  });

  return Route;
};
