export default (sequelize, DataTypes) => {
  const ActivityTypeToActivityType = sequelize.define(
    'ActivityTypeToActivityType',
    {
      primaryType: {
        type: DataTypes.TEXT,
        allowNull: false,
        // Composite primaryKey defined in migration 01
      },
      subType: {
        type: DataTypes.TEXT,
        allowNull: false,
        // Composite primaryKey defined in migration 01
      },
    }, {
      timestamps: false,
    }
  );

  // Primary key for this table is created manually in migration 01
  ActivityTypeToActivityType.removeAttribute('id');


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
