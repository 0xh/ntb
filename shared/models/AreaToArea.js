export default (sequelize, DataTypes) => {
  const AreaToArea = sequelize.define('AreaToArea', {
    parentUuid: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },

    childUuid: {
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

  AreaToArea.associate = (models) => {
    models.AreaToArea.belongsTo(models.Area, {
      as: 'Parent',
      foreignKey: 'parentUuid',
    });

    models.AreaToArea.belongsTo(models.Area, {
      as: 'Child',
      foreignKey: 'childUuid',
    });
  };

  return AreaToArea;
};
