export default (sequelize, DataTypes) => {
  const TripToPoi = sequelize.define('TripToPoi', {
    tripUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    poiUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    dataSource: { type: DataTypes.TEXT },
  }, {
    timestamps: true,
  });


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
