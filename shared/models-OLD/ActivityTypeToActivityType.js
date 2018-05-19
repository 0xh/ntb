export default (sequelize, DataTypes) => {
  const ActivityTypeToActivityType = sequelize.define(
    'ActivityTypeToActivityType',
    {
      primaryType: {
        type: DataTypes.TEXT,
        allowNull: false,
        primaryKey: true,
      },
      subType: {
        type: DataTypes.TEXT,
        allowNull: false,
        primaryKey: true,
      },
    }, {
      timestamps: false,
    }
  );


  // Associations

  ActivityTypeToActivityType.associate = (models) => {
    models.ActivityTypeToActivityType.belongsTo(models.ActivityType, {
      as: 'PrimaryType',
      foreignKey: 'primaryType',
    });

    models.ActivityTypeToActivityType.belongsTo(models.ActivityType, {
      as: 'SubType',
      foreignKey: 'subType',
    });
  };

  return ActivityTypeToActivityType;
};
