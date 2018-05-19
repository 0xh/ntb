export default (sequelize, DataTypes) => {
  const CabinPictureType =
    sequelize.define('CabinPictureType', {
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        primaryKey: true,
      },
    }, {
      timestamps: false,
    });

  return CabinPictureType;
};
