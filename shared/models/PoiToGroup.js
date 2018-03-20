export default (sequelize, DataTypes) => {
  const PoiToGroup = sequelize.define('PoiToGroup', {
    poiUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },

    groupUuid: {
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
  PoiToGroup.removeAttribute('id');


  // Associations

  PoiToGroup.associate = (models) => {
    models.PoiToGroup.belongsTo(models.Poi, {
      as: 'Poi',
      foreignKey: 'poiUuid',
    });

    models.PoiToGroup.belongsTo(models.Group, {
      as: 'Group',
      foreignKey: 'groupUuid',
    });
  };

  return PoiToGroup;
};
