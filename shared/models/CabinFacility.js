export default (sequelize, DataTypes) => {
  const CabinFacility = sequelize.define('CabinFacility', {
    facilityName: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    cabinUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },

    description: { type: DataTypes.TEXT },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  return CabinFacility;
};
