export default (sequelize, DataTypes) => {
  const PoiType = sequelize.define('PoiType', {
    name: { type: DataTypes.TEXT, primaryKey: true },
    description: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });


  // Associations

  PoiType.associate = (models) => {
    models.PoiType.belongsToMany(models.Poi, {
      as: 'Pois',
      through: { model: models.PoiToPoiType },
      foreignKey: 'poiType',
    });
  };

  return PoiType;
};
