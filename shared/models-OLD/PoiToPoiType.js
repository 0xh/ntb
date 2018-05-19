export default (sequelize, DataTypes) => {
  const PoiToPoiType = sequelize.define('PoiToPoiType', {
    poiType: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    poiUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      unique: 'poi-type-sort-index-key',
    },

    primary: { type: DataTypes.BOOLEAN, default: false, allowNull: true },

    sortIndex: {
      type: DataTypes.INTEGER,
      unique: 'poi-type-sort-index-key',
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });

  return PoiToPoiType;
};
