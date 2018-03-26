export default (sequelize, DataTypes) => {
  const RouteToActivityType = sequelize.define('RouteToActivityType', {
    activityTypeName: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },
    routeUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },

    sortIndex: { type: DataTypes.INTEGER },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  // Primary key for this table is created manually in migration 01
  RouteToActivityType.removeAttribute('id');

  return RouteToActivityType;
};
