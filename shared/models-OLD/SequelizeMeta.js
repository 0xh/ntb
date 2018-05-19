export default (sequelize, DataTypes) => {
  const SequelizeMeta = sequelize.define('SequelizeMeta', {
    name: DataTypes.STRING,
  }, {
    timestamps: false,
  });

  return SequelizeMeta;
};
