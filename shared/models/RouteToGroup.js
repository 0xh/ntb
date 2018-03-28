export default (sequelize, DataTypes) => {
  const RouteToGroup = sequelize.define('RouteToGroup', {
    routeUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    groupUuid: {
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

  RouteToGroup.associate = (models) => {
    models.RouteToGroup.belongsTo(models.Route, {
      as: 'Route',
      foreignKey: 'routeUuid',
    });

    models.RouteToGroup.belongsTo(models.Group, {
      as: 'Group',
      foreignKey: 'groupUuid',
    });
  };

  return RouteToGroup;
};