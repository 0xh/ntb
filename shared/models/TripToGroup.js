export default (sequelize, DataTypes) => {
  const TripToGroup = sequelize.define('TripToGroup', {
    tripUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    groupUuid: {
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

  TripToGroup.associate = (models) => {
    models.TripToGroup.belongsTo(models.Trip, {
      as: 'Trip',
      foreignKey: 'tripUuid',
    });

    models.TripToGroup.belongsTo(models.Group, {
      as: 'Group',
      foreignKey: 'groupUuid',
    });
  };

  return TripToGroup;
};
