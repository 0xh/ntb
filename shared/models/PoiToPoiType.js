export default (sequelize, DataTypes) => {
  const PoiToPoiType = sequelize.define('PoiToPoiType', {
    poiType: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },
    poiUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
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


  // Primary key for this table is created manually in migration 01
  PoiToPoiType.removeAttribute('id');

  return PoiToPoiType;
};
