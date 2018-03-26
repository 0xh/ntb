export default (sequelize, DataTypes) => {
  const TripToPoi = sequelize.define('TripToPoi', {
    tripUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },

    poiUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });

  // Primary key for this table is created manually in migration 01
  TripToPoi.removeAttribute('id');


  // Associations

  TripToPoi.associate = (models) => {
    models.TripToPoi.belongsTo(models.Trip, {
      as: 'Trip',
      foreignKey: 'tripUuid',
    });

    models.TripToPoi.belongsTo(models.Poi, {
      as: 'Poi',
      foreignKey: 'poiUuid',
    });
  };

  return TripToPoi;
};
