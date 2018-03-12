export default (sequelize, DataTypes) => {
  const CabinFacility = sequelize.define('CabinFacility', {
    facilityName: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },
    cabinUuid: {
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
  CabinFacility.removeAttribute('id');

  return CabinFacility;
};