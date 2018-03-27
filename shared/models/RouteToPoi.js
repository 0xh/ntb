export default (sequelize, DataTypes) => {
  const RouteToPoi = sequelize.define('RouteToPoi', {
    routeUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    poiUuid: {
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

  RouteToPoi.associate = (models) => {
    models.RouteToPoi.belongsTo(models.Route, {
      as: 'Route',
      foreignKey: 'routeUuid',
    });

    models.RouteToPoi.belongsTo(models.Poi, {
      as: 'Poi',
      foreignKey: 'poiUuid',
    });
  };

  return RouteToPoi;
};
