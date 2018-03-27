export default (sequelize, DataTypes) => {
  const TripToActivityType = sequelize.define('TripToActivityType', {
    activityTypeName: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    tripUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },

    primary: { type: DataTypes.BOOLEAN, default: false, allowNull: false },
    sortIndex: { type: DataTypes.INTEGER },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  return TripToActivityType;
};
