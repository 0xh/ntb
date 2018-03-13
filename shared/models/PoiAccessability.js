export default (sequelize, DataTypes) => {
  const PoiAccessability = sequelize.define('PoiAccessability', {
    accessabilityName: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },
    poiUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },

    description: { type: DataTypes.TEXT },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  // Primary key for this table is created manually in migration 01
  PoiAccessability.removeAttribute('id');

  return PoiAccessability;
};
