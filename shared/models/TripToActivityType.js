export default (sequelize, DataTypes) => {
  const TripToActivityType = sequelize.define('TripToActivityType', {
    activityTypeName: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },
    tripUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
    },

    primary: { type: DataTypes.BOOLEAN, default: false, allowNull: false },
    sortIndex: { type: DataTypes.INTEGER },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: false,
  });

  // Primary key for this table is created manually in migration 01
  TripToActivityType.removeAttribute('id');

  return TripToActivityType;
};
