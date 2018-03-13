export default (sequelize, DataTypes) => {
  const PoiToArea = sequelize.define('PoiToArea', {
    poiUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },

    areaUuid: {
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
  PoiToArea.removeAttribute('id');


  // Associations

  PoiToArea.associate = (models) => {
    models.PoiToArea.belongsTo(models.Poi, {
      as: 'Poi',
      foreignKey: 'poiUuid',
    });

    models.PoiToArea.belongsTo(models.Area, {
      as: 'Area',
      foreignKey: 'areaUuid',
    });
  };

  return PoiToArea;
};
