export default (sequelize, DataTypes) => {
  const DocumentStatus = sequelize.define('DocumentStatus', {
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
  }, {
    timestamps: false,
  });

  return DocumentStatus;
};
