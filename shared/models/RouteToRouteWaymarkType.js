export default (sequelize, DataTypes) => {
  const RouteToRouteWaymarkType = sequelize.define('RouteToRouteWaymarkType', {
    routeWaymarkTypeName: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },
    routeUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  // Primary key for this table is created manually in migration 01
  RouteToRouteWaymarkType.removeAttribute('id');

  return RouteToRouteWaymarkType;
};
