export default (sequelize, DataTypes) => {
  const CabinAccessability = sequelize.define('CabinAccessability', {
    accessabilityName: {
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

  return CabinAccessability;
};
