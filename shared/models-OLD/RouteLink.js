export default (sequelize, DataTypes) => {
  const RouteLink = sequelize.define('RouteLink', {
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4,
      },
    },

    routeUuid: {
      type: DataTypes.UUID,
      unique: 'route-link-sort-index-key',
      allowNull: false,
      validate: {
        isUUID: 4,
      },
    },

    title: { type: DataTypes.TEXT },
    url: { type: DataTypes.TEXT, allowNull: false },

    sortIndex: {
      type: DataTypes.INTEGER,
      unique: 'route-link-sort-index-key',
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


  // Associations

  RouteLink.associate = (models) => {
    models.RouteLink.belongsTo(models.Route);
  };

  return RouteLink;
};
