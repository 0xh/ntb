export default (sequelize, DataTypes) => {
  const RouteToCounty = sequelize.define('RouteToCounty', {
    routeUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },

    countyUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });

  // Primary key for this table is created manually in migration 01
  RouteToCounty.removeAttribute('id');


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
