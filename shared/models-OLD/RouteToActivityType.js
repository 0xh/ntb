export default (sequelize, DataTypes) => {
  const RouteToActivityType = sequelize.define('RouteToActivityType', {
    activityTypeName: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    routeUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },

    sortIndex: { type: DataTypes.INTEGER },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  return RouteToActivityType;
};
