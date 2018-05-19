export default (sequelize, DataTypes) => {
  const TripDirection =
    sequelize.define('TripDirection', {
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
        primaryKey: true,
      },
    }, {
      timestamps: false,
    });

  return TripDirection;
};
