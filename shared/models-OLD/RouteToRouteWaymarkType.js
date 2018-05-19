export default (sequelize, DataTypes) => {
  const RouteToRouteWaymarkType = sequelize.define('RouteToRouteWaymarkType', {
    routeWaymarkTypeName: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    routeUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  return RouteToRouteWaymarkType;
};
