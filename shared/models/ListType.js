export default (sequelize, DataTypes) => {
  const ListType = sequelize.define('ListType', {
    name: { type: DataTypes.TEXT, primaryKey: true },
    description: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  return ListType;
};
