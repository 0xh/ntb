export default (sequelize, DataTypes) => {
  const CabinToArea = sequelize.define('CabinToArea', {
    cabinUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    areaUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });

  return CabinToArea;
};
