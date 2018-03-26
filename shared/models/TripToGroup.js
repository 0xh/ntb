export default (sequelize, DataTypes) => {
  const TripToGroup = sequelize.define('TripToGroup', {
    tripUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      // Composite primaryKey defined in migration 01
      validate: {
        isUUID: 4,
      },
    },

    groupUuid: {
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
  TripToGroup.removeAttribute('id');


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
