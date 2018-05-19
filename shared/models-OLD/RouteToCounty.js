export default (sequelize, DataTypes) => {
  const RouteToCounty = sequelize.define('RouteToCounty', {
    routeUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    countyUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  RouteToCounty.associate = (models) => {
    models.RouteToCounty.belongsTo(models.Route, {
      as: 'Route',
      foreignKey: 'routeUuid',
    });

    models.RouteToCounty.belongsTo(models.County, {
      as: 'County',
      foreignKey: 'countyUuid',
    });
  };

  return RouteToCounty;
};
