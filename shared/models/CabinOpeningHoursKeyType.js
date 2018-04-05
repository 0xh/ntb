export default (sequelize, DataTypes) => {
  const CabinOpeningHoursKeyType =
    sequelize.define('CabinOpeningHoursKeyType', {
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        primaryKey: true,
      },
    }, {
      timestamps: false,
    });

  return CabinOpeningHoursKeyType;
};
