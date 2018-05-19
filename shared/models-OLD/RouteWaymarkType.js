export default (sequelize, DataTypes) => {
  const RouteWaymarkType = sequelize.define('RouteWaymarkType', {
    name: { type: DataTypes.TEXT, primaryKey: true },
    description: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });


  // Associations

  RouteWaymarkType.associate = (models) => {
    models.RouteWaymarkType.belongsToMany(models.Route, {
      through: {
        model: models.RouteToRouteWaymarkType,
      },
      as: 'Routes',
      foreignKey: 'routeWaymarkTypeName',
    });
  };

  return RouteWaymarkType;
};
