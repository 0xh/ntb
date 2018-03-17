export default (sequelize, DataTypes) => {
  const CabinServiceLevel = sequelize.define('CabinServiceLevel', {
    name: { type: DataTypes.TEXT, primaryKey: true },
    description: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  return CabinServiceLevel;
};
