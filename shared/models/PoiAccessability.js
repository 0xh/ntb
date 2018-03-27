export default (sequelize, DataTypes) => {
  const PoiAccessability = sequelize.define('PoiAccessability', {
    accessabilityName: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    poiUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },

    description: { type: DataTypes.TEXT },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  return PoiAccessability;
};
