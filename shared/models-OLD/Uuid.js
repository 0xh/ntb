export default (sequelize, DataTypes) => {
  const Uuid = sequelize.define('Uuid', {
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    documentType: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
  }, {
    timestamps: false,
  });

  return Uuid;
};
