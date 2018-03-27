export default (sequelize, DataTypes) => {
  const ActivityType = sequelize.define('ActivityType', {
    name: {
      primaryKey: true,
      type: DataTypes.TEXT,
      allowNull: false,
    },
    primary: {
      type: DataTypes.BOOLEAN,
      default: false,
      allowNull: false,
    },
    description: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });


  // Associations

  ActivityType.associate = (models) => {
    models.ActivityType.belongsToMany(models.ActivityType, {
      as: 'SubTypes',
      through: models.ActivityTypeToActivityType,
      foreignKey: 'primaryType',
      otherKey: 'subType',
    });

    models.ActivityType.belongsToMany(models.ActivityType, {
      as: 'PrimaryTypes',
      through: models.ActivityTypeToActivityType,
      foreignKey: 'subType',
      otherKey: 'primaryType',
    });

    models.ActivityType.belongsToMany(models.Route, {
      as: 'Routes',
      through: models.RouteToActivityType,
      foreignKey: 'activityTypeName',
    });

    models.ActivityType.belongsToMany(models.Trip, {
      as: 'Trips',
      through: models.TripToActivityType,
      foreignKey: 'activityTypeName',
    });
  };

  return ActivityType;
};
